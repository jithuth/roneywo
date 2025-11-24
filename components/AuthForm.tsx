import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { checkIsAdmin, ensureUserProfile } from '../services/supabaseService';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processLogin = async (uid: string, userEmail: string | undefined, userObject: any) => {
      // 1. Ensure Profile Exists (Fix for missing trigger issues)
      await ensureUserProfile(userObject);

      // 2. Check admin status
      const isDbAdmin = await checkIsAdmin(uid);
      // Fallback check for bootstrap admin email or if DB check passed
      const finalIsAdmin = isDbAdmin || userEmail === 'admin@unlockglobal.com';
      
      onLogin({
        uid: uid,
        email: userEmail || null,
        isLoggedIn: true,
        isAdmin: finalIsAdmin
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user && data.session) {
          await processLogin(data.user.id, data.user.email, data.user);
        }
      } else {
        // SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data.user && !data.session) {
          // User created but needs email verification
          setSuccessMessage("Account created! Please check your email to confirm your registration.");
          setIsLogin(true); // Switch back to login view
        } else if (data.user && data.session) {
          // User created and auto-logged in
          await processLogin(data.user.id, data.user.email, data.user);
        }
      }

    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "An authentication error occurred.";
      
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("invalid login credentials")) {
        msg = "Incorrect email or password.";
      } else if (lowerMsg.includes("email not confirmed")) {
        msg = "Please check your inbox to confirm your email address.";
      } else if (lowerMsg.includes("user already registered")) {
        msg = "This email is already registered. Please login instead.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Social Auth Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900/50 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-sm text-center mt-1">
            {isLogin ? 'Login to continue your unlock request' : 'Register to track your order'}
          </p>
        </div>

        <div className="p-8 space-y-6">
           {/* Social Logins */}
           <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 bg-white text-slate-800 p-2.5 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center gap-2 bg-[#1877F2] text-white p-2.5 rounded-lg font-medium text-sm hover:bg-[#1864D9] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.603-2.797 2.898v1.074h5.37l-.75 3.667h-4.62v7.98H9.101Z" />
              </svg>
              Facebook
            </button>
           </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
               <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg flex items-start gap-2 text-sm">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white p-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Sign Up'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccessMessage(null);
                  setEmail('');
                  setPassword('');
              }}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};