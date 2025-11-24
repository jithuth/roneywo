import React, { useState, useEffect } from 'react';
import { fetchWallets } from '../services/supabaseService';
import { WalletInfo } from '../types';
import { Copy, Check, Wallet, AlertTriangle } from 'lucide-react';

interface Props {
  onNext: (wallet: WalletInfo) => void;
}

export const PaymentDisplay: React.FC<Props> = ({ onNext }) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallets = async () => {
      const data = await fetchWallets();
      setWallets(data);
      if (data.length > 0) setSelectedWallet(data[0]);
      setLoading(false);
    };
    loadWallets();
  }, []);

  const handleCopy = () => {
    if (selectedWallet) {
      navigator.clipboard.writeText(selectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedWallet) return <div className="text-center text-slate-400">No payment methods available.</div>;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Wallet className="text-brand-400" />
          Secure Payment
        </h2>
        <p className="text-slate-400 mb-6">Select your preferred cryptocurrency to complete the unlock order.</p>

        {/* Currency Tabs */}
        <div className="flex gap-2 mb-6">
          {wallets.map((w) => (
            <button
              key={w.currency}
              onClick={() => setSelectedWallet(w)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
                selectedWallet.currency === w.currency
                  ? 'bg-brand-600/20 border-brand-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {w.currency}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* QR Code Area */}
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl max-w-xs mx-auto w-full">
            <img 
              src={selectedWallet.qrCodeUrl} 
              alt="Payment QR" 
              className="w-full h-auto aspect-square object-cover"
            />
            <p className="mt-2 text-slate-900 font-mono font-bold text-lg">
              ${selectedWallet.price.toFixed(2)} USD
            </p>
          </div>

          {/* Details Area */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network</label>
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-3 text-brand-300 font-semibold">
                {selectedWallet.network}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deposit Address</label>
              <div className="relative group">
                <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4 pr-12 font-mono text-sm text-slate-300 break-all">
                  {selectedWallet.address}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 p-2 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
              <p className="text-xs text-yellow-200/80">
                Please ensure you are sending <strong>{selectedWallet.network}</strong> compatible tokens. 
                Sending to the wrong network may result in permanent loss of funds.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNext(selectedWallet)}
        className="w-full bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 transition-all"
      >
        I Have Made The Payment
      </button>
    </div>
  );
};