import React, { useState } from 'react';
import { Order } from '../types';
import { X, Smartphone, MapPin, Hash, User, Calendar, CreditCard, ExternalLink, FileText, Clock, CheckCircle, XCircle, Key } from 'lucide-react';

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, status: Order['status'], unlockCode?: string) => Promise<void>;
}

export const OrderDetailsModal: React.FC<Props> = ({ order, onClose, onStatusChange }) => {
  const [unlockCode, setUnlockCode] = useState(order.unlockCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'verified': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const handleComplete = async () => {
    if (!unlockCode.trim()) {
        alert("Please enter the Unlock Code before marking as completed.");
        return;
    }
    setIsSubmitting(true);
    await onStatusChange(order.id!, 'completed', unlockCode);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Order Details
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">ID: {order.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-slate-700/50 hover:bg-slate-700 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Grid Layout for Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Device Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Smartphone size={16} className="text-brand-400" />
                Device Information
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Brand:</span>
                  <span className="text-white font-medium">{order.router?.brand || 'N/A'}</span>
                  
                  <span className="text-slate-500">Model:</span>
                  <span className="text-white font-medium">{order.router?.model || 'N/A'}</span>
                  
                  <span className="text-slate-500">Country:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <MapPin size={12} /> {order.router?.country || 'N/A'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700/50">
                  <span className="text-slate-500 text-xs block mb-1">IMEI Number</span>
                  <div className="bg-slate-800 p-2 rounded font-mono text-white text-sm tracking-wide flex items-center justify-between">
                    {order.router?.imei || 'N/A'}
                    <Hash size={14} className="text-slate-600" />
                  </div>
                </div>
                {order.router?.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 text-xs block mb-1">Notes</span>
                    <p className="text-slate-300 text-sm bg-slate-800/50 p-2 rounded italic">
                      "{order.router.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-brand-400" />
                Customer Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5">Email Address</span>
                  <a href={`mailto:${order.userEmail}`} className="text-brand-400 hover:underline font-medium text-base">
                    {order.userEmail}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5">User ID</span>
                  <span className="text-slate-300 font-mono text-xs">{order.userId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5">Order Date</span>
                  <span className="text-white flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-5 rounded-xl space-y-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-brand-400" />
                Payment Verification
              </h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Total Amount</span>
                    <span className="text-xl font-bold text-white">
                      {order.amount} <span className="text-sm font-normal text-slate-400">{order.currency}</span>
                    </span>
                  </div>
                  
                  {order.paymentProofUrl ? (
                      <div className="space-y-2">
                        <span className="text-sm text-slate-400">Payment Proof</span>
                        <a 
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block group relative rounded-lg overflow-hidden border border-slate-700"
                        >
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm">
                              <ExternalLink size={16} /> Open Full Size
                            </span>
                          </div>
                          {/* Check if likely an image based on extensions common in URLs, otherwise generic placeholder */}
                          {['jpg', 'jpeg', 'png', 'webp'].some(ext => order.paymentProofUrl.toLowerCase().includes(ext)) ? (
                            <img 
                              src={order.paymentProofUrl} 
                              alt="Payment Proof" 
                              className="w-full h-48 object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-24 bg-slate-800 flex flex-col items-center justify-center text-slate-500">
                              <FileText size={32} className="mb-2" />
                              <span className="text-xs">Document File</span>
                            </div>
                          )}
                        </a>
                      </div>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <XCircle size={16} /> No payment proof uploaded
                    </div>
                  )}
                </div>
                
                <div className="flex-1 bg-slate-800/50 rounded-lg p-4 flex flex-col justify-center space-y-3">
                  <h4 className="text-sm font-medium text-white mb-2">Update Order Status</h4>
                  
                  <button
                    onClick={() => onStatusChange(order.id!, 'verified')}
                    disabled={order.status === 'verified' || order.status === 'completed'}
                    className={`w-full p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      order.status === 'verified' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 cursor-default'
                        : 'bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-300'
                    }`}
                  >
                    <Clock size={16} />
                    Mark as Verified
                  </button>

                  <div className="border-t border-slate-700 my-2 pt-3">
                      <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                          <Key size={12} />
                          Unlock Code / Result
                      </label>
                      <input 
                        type="text" 
                        value={unlockCode}
                        onChange={(e) => setUnlockCode(e.target.value)}
                        placeholder="Enter generated unlock code"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white mb-2 font-mono"
                      />
                      <button
                        onClick={handleComplete}
                        disabled={isSubmitting || order.status === 'completed'}
                        className={`w-full p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        order.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
                        }`}
                    >
                        {isSubmitting ? (
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                             <CheckCircle size={16} />
                        )}
                        Complete & Send Code
                    </button>
                  </div>

                  <button
                    onClick={() => onStatusChange(order.id!, 'failed')}
                    disabled={order.status === 'failed'}
                    className={`w-full p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      order.status === 'failed' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 cursor-default'
                        : 'bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300'
                    }`}
                  >
                    <XCircle size={16} />
                    Mark as Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};