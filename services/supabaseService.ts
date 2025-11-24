import { supabase } from '../supabaseClient';
import { Order, RouterData, WalletInfo, UserProfile, ManagementItem } from '../types';
import { CRYPTO_WALLETS, COUNTRIES, BRANDS } from '../constants';

// --- Database Services ---

export const fetchWallets = async (): Promise<WalletInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');
      
    if (error) {
      // If table doesn't exist (404/42P01), fail silently to constants
      if (error.code !== '42P01' && error.code !== '404') {
         console.warn("Wallet fetch warning:", error.message);
      }
      return CRYPTO_WALLETS;
    }

    if (!data || data.length === 0) {
      return CRYPTO_WALLETS;
    }
    
    return data.map((w: any) => ({
      currency: w.currency,
      address: w.address,
      network: w.network,
      qrCodeUrl: w.qr_code_url || w.qrCodeUrl,
      price: w.price
    }));
  } catch (error: any) {
    // Fail silently to fallback
    return CRYPTO_WALLETS;
  }
};

// Public Fetch: Only Active and Non-Deleted
export const fetchCountries = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('name')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name');
    
    if (error) throw error;
    if (!data || data.length === 0) return COUNTRIES;
    
    return data.map((c: any) => c.name);
  } catch (error: any) {
    // Only warn if it's not a missing table error (common during initial setup)
    if (error.code !== '42P01' && error.code !== '404') {
      console.warn("Error fetching countries, using defaults.");
    }
    return COUNTRIES;
  }
};

// Public Fetch: Only Active and Non-Deleted
export const fetchBrands = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('name')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name');
    
    if (error) throw error;
    if (!data || data.length === 0) return BRANDS;
    
    return data.map((b: any) => b.name);
  } catch (error: any) {
    if (error.code !== '42P01' && error.code !== '404') {
        console.warn("Error fetching brands, using defaults.");
    }
    return BRANDS;
  }
};

export const createOrder = async (
  userId: string, 
  userEmail: string, 
  router: RouterData, 
  file: File, 
  wallet: WalletInfo
): Promise<string> => {
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('proofs')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('proofs')
    .getPublicUrl(filePath);

  const orderData = {
    user_id: userId,
    user_email: userEmail,
    router: router,
    payment_proof_url: publicUrl,
    status: 'pending',
    amount: wallet.price,
    currency: wallet.currency
  };

  const { data, error: dbError } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);
  
  return data.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      router: row.router,
      paymentProofUrl: row.payment_proof_url,
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      createdAt: row.created_at,
      unlockCode: row.unlock_code
    }));
  } catch (error: any) {
    if (error.code !== '42P01') {
        console.error("Error fetching user orders:", error.message || error);
    }
    return [];
  }
};

// --- Auth & User Services ---

export const ensureUserProfile = async (user: any): Promise<void> => {
  try {
    // 1. Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Ignore "Row not found" (PGRST116), log others
      console.warn("Profile check warning:", error.message);
    }

    // 2. If no profile, insert it manually (Fallback for failed Triggers)
    if (!data) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider || 'email'
        }]);
      
      if (insertError) {
        console.error("Failed to create user profile:", insertError.message);
      }
    }
  } catch (e) {
    console.error("ensureUserProfile exception:", e);
  }
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('admin_roles')
            .select('user_id')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            // PGRST116 = JSON object requested, multiple (or no) rows returned. (No row found)
            // 42P01 = undefined_table (Table doesn't exist yet)
            if (error.code !== 'PGRST116' && error.code !== '42P01') {
                 console.error("Error checking admin status:", error.message || error);
            }
            return false;
        }
        
        return !!data;
    } catch (e: any) {
        // Suppress generic errors during init
        return false;
    }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      router: row.router,
      paymentProofUrl: row.payment_proof_url,
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      createdAt: row.created_at,
      unlockCode: row.unlock_code
    }));
  } catch (error: any) {
    console.error("Error fetching all orders:", error.message || error);
    return [];
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      provider: row.provider || 'email',
      createdAt: row.created_at,
      lastSignInAt: row.last_sign_in_at
    }));
  } catch (error: any) {
    console.error("Error fetching users:", error.message || error);
    return [];
  }
};

export const getAdmins = async (): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('admin_roles')
            .select('user_id');
        
        if (error) throw error;
        return data.map((r: any) => r.user_id);
    } catch (error: any) {
        // Silently fail if table is missing
        if (error.code !== '42P01') console.error("Error fetching admins:", error.message);
        return [];
    }
};

export const addAdmin = async (email: string): Promise<void> => {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
    
    if (profileError || !profile) throw new Error("User not found");

    const { error } = await supabase
        .from('admin_roles')
        .insert({ user_id: profile.id });
    
    if (error) throw error;
};

export const removeAdmin = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId);
    
    if (error) throw error;
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], unlockCode?: string): Promise<void> => {
  const updateData: any = { status };
  if (unlockCode !== undefined) {
      updateData.unlock_code = unlockCode;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) throw error;
};

// --- Generic Management Services (Countries/Brands) ---

export const getManagementData = async (table: 'countries' | 'brands'): Promise<ManagementItem[]> => {
  try {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('is_deleted', false) // Soft delete check
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e: any) {
    // Return empty if table doesn't exist yet
    if (e.code === '42P01' || e.code === '404') return [];
    throw e;
  }
};

export const addManagementItem = async (table: 'countries' | 'brands', name: string): Promise<void> => {
  const { error } = await supabase
    .from(table)
    .insert([{ name }]);
  if (error) throw error;
};

export const updateManagementItem = async (table: 'countries' | 'brands', id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from(table)
    .update({ name })
    .eq('id', id);
  if (error) throw error;
};

export const toggleManagementItemStatus = async (table: 'countries' | 'brands', id: string, currentStatus: boolean): Promise<void> => {
  const { error } = await supabase
    .from(table)
    .update({ is_active: !currentStatus })
    .eq('id', id);
  if (error) throw error;
};

export const softDeleteManagementItem = async (table: 'countries' | 'brands', id: string): Promise<void> => {
  const { error } = await supabase
    .from(table)
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw error;
};