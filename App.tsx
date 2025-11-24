import React, { useState, useEffect } from 'react';
import { User } from './types';
import { UnlockWizard } from './components/UnlockWizard';
import { AdminPanel } from './components/AdminPanel';
import { OrderHistory } from './components/OrderHistory';
import { AuthForm } from './components/AuthForm';
import { Wifi, Shield, Zap, LockKeyhole, History, LogOut, LayoutDashboard, LogIn } from 'lucide-react';
import { supabase } from './supabaseClient';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { checkIsAdmin, ensureUserProfile } from './services/supabaseService';

const Layout: React.FC<{ 
    children: React.ReactNode, 
    user: User, 
    onLogout: () => void 
}> = ({ children, user, onLogout }) => {
    const location = useLocation();
    
    return (
        <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-50 flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2 cursor-pointer">
                            <div className="bg-brand-500 p-1.5 rounded-lg">
                                <Wifi className="text-white h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-cyan-300">
                                UnlockGlobal
                            </span>
                        </Link>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            {location.pathname === '/' && (
                                <>
                                    <span className="hidden md:flex items-center gap-1"><Shield size={14} /> Secure</span>
                                    <span className="hidden md:flex items-center gap-1"><Zap size={14} /> Instant</span>
                                </>
                            )}
                            {user.isLoggedIn ? (
                                <div className="flex items-center gap-3">
                                    {user.isAdmin && (
                                        <Link 
                                            to="/admin" 
                                            className={`flex items-center gap-1 transition-colors mr-2 font-medium ${
                                                location.pathname === '/admin' ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
                                            }`}
                                        >
                                            <LayoutDashboard size={16} />
                                            <span className="hidden sm:inline">Admin Panel</span>
                                        </Link>
                                    )}

                                    <Link 
                                      to="/orders" 
                                      className={`flex items-center gap-1 transition-colors ${
                                        location.pathname === '/orders' ? 'text-brand-400' : 'text-slate-400 hover:text-brand-300'
                                      }`}
                                    >
                                      <History size={16} />
                                      <span className="hidden sm:inline">My Orders</span>
                                    </Link>
                                    
                                    <div className="h-4 w-px bg-slate-700 mx-1"></div>
                                    
                                    <div className="hidden sm:block bg-slate-800 px-3 py-1 rounded-full text-brand-300 border border-slate-700 text-xs">
                                        {user.email}
                                    </div>
                                    
                                    <button 
                                        onClick={onLogout}
                                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/30 transition-all text-sm font-medium"
                                        title="Sign Out"
                                    >
                                        <LogOut size={14} />
                                        <span className="hidden xs:inline">Logout</span>
                                    </button>
                                </div>
                            ) : (
                                <Link 
                                    to="/login" 
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        location.pathname === '/login' 
                                            ? 'bg-slate-800 text-white border border-slate-700' 
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <LogIn size={16} />
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col py-12 px-4 sm:px-6">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-900 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} UnlockGlobal. All rights reserved.</p>
                    <div className="mt-2 text-xs">
                        <Link 
                            to="/admin"
                            className="flex items-center justify-center gap-1 mx-auto text-slate-600 hover:text-brand-400 transition-colors"
                        >
                            <LockKeyhole size={12} />
                            Admin Access
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User>({
    uid: '',
    email: null,
    isLoggedIn: false,
    isAdmin: false
  });

  // Helper to check admin status with fallback
  const verifyAdmin = async (uid: string, email: string | undefined | null) => {
    if (email === 'admin@unlockglobal.com') return true; // Hardcoded fallback for bootstrap
    return await checkIsAdmin(uid);
  };

  // Listen for Supabase Auth state changes
  useEffect(() => {
    const initAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            // Ensure profile exists on load (robustness against trigger failure)
            await ensureUserProfile(session.user);
            
            const isAdmin = await verifyAdmin(session.user.id, session.user.email);
            setUser({
                uid: session.user.id,
                email: session.user.email || null,
                isLoggedIn: true,
                isAdmin: isAdmin
            });
        }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            await ensureUserProfile(session.user);
            const isAdmin = await verifyAdmin(session.user.id, session.user.email);
            setUser({
                uid: session.user.id,
                email: session.user.email || null,
                isLoggedIn: true,
                isAdmin: isAdmin
            });
        } else {
            setUser({ uid: '', email: null, isLoggedIn: false, isAdmin: false });
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  return (
    <HashRouter>
        <Layout user={user} onLogout={handleLogout}>
            <Routes>
                {/* Home/Wizard Route */}
                <Route 
                    path="/" 
                    element={<UnlockWizard user={user} onUserLogin={handleLogin} />} 
                />

                {/* Login Route */}
                <Route 
                    path="/login" 
                    element={
                        user.isLoggedIn ? (
                            <Navigate to="/orders" replace />
                        ) : (
                            <div className="flex justify-center pt-8">
                                <div className="w-full max-w-md">
                                    <AuthForm onLogin={handleLogin} />
                                </div>
                            </div>
                        )
                    } 
                />
                
                {/* Order History Route */}
                <Route 
                    path="/orders" 
                    element={<OrderHistory user={user} />} 
                />
                
                {/* Admin Route */}
                <Route 
                    path="/admin" 
                    element={
                        user.isLoggedIn ? (
                            user.isAdmin ? (
                                <AdminPanel />
                            ) : (
                                <div className="text-center mt-20">
                                    <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
                                    <p className="text-slate-400 mb-4">Your account does not have administrative privileges.</p>
                                    <Link to="/" className="text-brand-400 underline">Return to Home</Link>
                                </div>
                            )
                        ) : (
                            <div className="max-w-md mx-auto mt-20">
                                <h2 className="text-2xl font-bold text-center mb-6 text-white">Admin Access</h2>
                                <AuthForm onLogin={handleLogin} />
                            </div>
                        )
                    } 
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    </HashRouter>
  );
};

export default App;