import React, { useState } from 'react';
import { Upload, X, CheckCircle, FileImage, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, RouterData, WalletInfo } from '../types';
import { createOrder } from '../services/supabaseService';

interface Props {
  user: User;
  routerData: RouterData;
  selectedWallet: WalletInfo | null;
  onComplete: () => void;
}

export const UploadConfirmation: React.FC<Props> = ({ user, routerData, selectedWallet, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size too large (Max 5MB)");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !user.email || !selectedWallet) return;
    setIsUploading(true);
    setError(null);
    
    try {
      await createOrder(user.uid, user.email, routerData, file, selectedWallet);
      onComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload order. Please try again. Check database configuration.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
       <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="text-brand-400" />
          Verify Transaction
        </h2>
        <p className="text-slate-400 mb-8">
          Please upload a screenshot of your transaction confirmation. 
          This helps us verify your payment quickly.
        </p>

        <div className="border-2 border-dashed border-slate-600 hover:border-brand-500 rounded-xl p-8 transition-colors bg-slate-900/30">
          {!file ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Upload className="text-slate-400" size={32} />
              </div>
              <label 
                htmlFor="proof-upload" 
                className="cursor-pointer text-lg font-medium text-white hover:text-brand-400 transition-colors"
              >
                Click to upload screenshot
              </label>
              <p className="text-sm text-slate-500 mt-2">JPG, PNG or PDF (Max 5MB)</p>
              <input 
                id="proof-upload" 
                type="file" 
                accept="image/*,.pdf" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-lg flex items-center justify-center text-brand-400">
                  <FileImage size={24} />
                </div>
                <div>
                  <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-400 p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
        )}

        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
           <p className="text-sm text-blue-200/80">
             <strong>What happens next?</strong> After uploading, our admin team will verify the blockchain transaction. 
             Once confirmed (typically 15-30 mins), you will receive the unlock code and instructions via email.
           </p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || isUploading}
        className={`w-full p-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
          ${!file || isUploading 
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20 hover:scale-[1.01]'
          }
        `}
      >
        {isUploading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Uploading Proof...
          </>
        ) : (
          <>
            Complete Order
            <CheckCircle size={20} />
          </>
        )}
      </button>
    </div>
  );
};