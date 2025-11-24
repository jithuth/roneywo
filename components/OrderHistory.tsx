import React, { useEffect, useState } from 'react';
import { getUserOrders } from '../services/supabaseService';
import { Order, User } from '../types';
import { Clock, CheckCircle, XCircle, Loader, Smartphone, ExternalLink, Calendar, Copy, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  user: User;
}

export const OrderHistory: React.FC<Props> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (user.uid) {
        setIsLoading(true);
        const data = await getUserOrders(user.uid);
        setOrders(data);
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [user.uid]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'verified': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (!user.isLoggedIn) {
    return (
      <div className="text-center py-20 px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
        <p className="text-slate-400 mb-8">Please log in to view your order history.</p>
        <Link to="/" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Orders</h1>
        <Link to="/" className="text-brand-400 hover:text-brand-300 text-sm">
          + New Unlock Request
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-brand-500" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-10 text-center">
          <Smartphone className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-medium text-white mb-2">No orders yet</h3>
          <p className="text-slate-400 mb-6">You haven't placed any unlock requests yet.</p>
          <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Start Unlock Process
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="uppercase tracking-wider">{order.status}</span>
                  </div>
                  <span className="text-slate-500 text-xs font-mono uppercase">#{order.id?.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar size={14} />
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {order.router.brand} {order.router.model}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm text-slate-400">
                    <span>IMEI: <span className="font-mono text-slate-300">{order.router.imei}</span></span>
                    <span>Country: {order.router.country}</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-center">
                  <div className="text-lg font-bold text-white">
                    {order.amount} <span className="text-sm font-normal text-slate-400">{order.currency}</span>
                  </div>
                  {order.paymentProofUrl && (
                    <a 
                      href={order.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 mt-1"
                    >
                      View Receipt <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Unlock Code Section */}
              {order.unlockCode && order.status === 'completed' && (
                <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 animate-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <Key size={20} />
                      <span className="font-semibold text-sm uppercase tracking-wide">Your Unlock Code</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <code className="flex-1 sm:flex-none bg-slate-900 border border-green-500/30 text-white font-mono text-lg px-4 py-2 rounded-lg text-center tracking-widest shadow-inner">
                        {order.unlockCode}
                      </code>
                      <button 
                        onClick={() => handleCopyCode(order.unlockCode!, order.id!)}
                        className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors"
                        title="Copy Code"
                      >
                        {copiedId === order.id ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};