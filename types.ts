export enum UnlockStep {
  SELECTION = 1,
  AUTH = 2,
  PAYMENT = 3,
  CONFIRMATION = 4,
  SUCCESS = 5
}

export interface RouterData {
  country: string;
  brand: string;
  model: string;
  imei: string;
  notes?: string;
}

export interface User {
  uid: string;
  email: string | null;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string;
}

export interface WalletInfo {
  currency: string;
  address: string;
  network: string;
  qrCodeUrl: string;
  price: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  router: RouterData;
  paymentProofUrl: string;
  status: 'pending' | 'verified' | 'completed' | 'failed';
  amount: number;
  currency: string;
  createdAt: string; // Supabase returns ISO date strings
  unlockCode?: string; // New field
}

export interface TechnicalAnalysis {
  difficulty: string;
  estimatedTime: string;
  successRate: string;
  message: string;
}

export interface ManagementItem {
  id: string;
  name: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
}