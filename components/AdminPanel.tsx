import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, getAllUsers, getAdmins, addAdmin, removeAdmin } from '../services/supabaseService';
import { Order, UserProfile } from '../types';
import { ExternalLink, CheckCircle, XCircle, Clock, RefreshCw, Smartphone, Search, Filter, X, Users, ShoppingBag, Mail, Calendar, Shield, ShieldCheck, ShieldAlert, Globe, Cpu } from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal';
import { DataManagementTab } from './DataManagementTab';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'countries' | 'brands'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    const data = await getAllOrders();
    setOrders(data);
    setIsOrdersLoading(false);
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    const data = await getAllUsers();
    const adminList = await getAdmins();
    setUsers(data);
    setAdmins(adminList);
    setIsUsersLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'orders') {
        fetchOrders();
    } else if (activeTab === 'users') {
        fetchUsers();
    }
  }, [activeTab]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status'], unlockCode?: string) => {
    if (!orderId) return;
    try {
      await updateOrderStatus(orderId, newStatus, unlockCode);
      // Update local state for both the list and the selected modal view
      const updateOrder = (o: Order) => 
        o.id === orderId 
            ? { ...o, status: newStatus, unlockCode: unlockCode || o.unlockCode } 
            : o;
      
      setOrders(prev => prev.map(updateOrder));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, unlockCode: unlockCode || prev.unlockCode } : null);
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handlePromoteAdmin = async (email: string) => {
    if (!window.confirm(`Are you sure you want to promote ${email} to Admin?`)) return;
    try {
        await addAdmin(email);
        fetchUsers(); // Refresh list
    } catch (error: any) {
        alert("Failed to promote user: " + error.message);
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to revoke Admin rights from this user?`)) return;
    try {
        await removeAdmin(userId);
        fetchUsers(); // Refresh list
    } catch (error: any) {
        alert("Failed to revoke admin: " + error.message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEmailFilter('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Order Filtering Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      (order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.router?.imei?.includes(searchTerm) ?? false);
    const matchesEmail = emailFilter === '' || 
      (order.userEmail?.toLowerCase().includes(emailFilter.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    let matchesDate = true;
    if ((startDate || endDate) && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      if (startDate && orderDate < new Date(startDate)) matchesDate = false;
      if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) matchesDate = false;
      }
    }
    return matchesSearch && matchesEmail && matchesStatus && matchesDate;
  });

  // User Filtering Logic (Simpler)
  const filteredUsers = users.filter(user => {
      const matchesEmail = searchTerm === '' || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesEmail;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'verified': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Manage unlock requests and users</p>
        </div>
        <button 
          onClick={
            activeTab === 'orders' ? fetchOrders : 
            activeTab === 'users' ? fetchUsers :
            undefined // Let sub-components handle their own refresh via props if needed, or simple no-op here for simplicity
          }
          className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={20} className={isOrdersLoading || isUsersLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
        <button
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'orders' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
            <ShoppingBag size={18} />
            Orders
        </button>
        <button
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'users' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
            <Users size={18} />
            Users
        </button>
        <button
            onClick={() => { setActiveTab('countries'); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'countries' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
            <Globe size={18} />
            Countries
        </button>
        <button
            onClick={() => { setActiveTab('brands'); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'brands' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
            <Cpu size={18} />
            Brands
        </button>
      </div>

      {activeTab === 'orders' && (
        /* --- ORDERS VIEW --- */
        <>
            {/* Filters Section */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-300">
                    <Filter size={18} className="text-brand-400" />
                    <span className="font-medium">Filter & Search Orders</span>
                </div>
                {(searchTerm || emailFilter || statusFilter !== 'all' || startDate || endDate) && (
                    <button 
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded transition-colors"
                    >
                    <X size={14} /> Clear Filters
                    </button>
                )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search ID/IMEI */}
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                    <input 
                    type="text" 
                    placeholder="Search ID or IMEI..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Email Filter */}
                <div className="relative">
                    <input 
                    type="text" 
                    placeholder="Filter by Email..." 
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none appearance-none cursor-pointer transition-all"
                    >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    </select>
                </div>

                {/* Date Range Start */}
                <div className="relative group">
                    <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all [color-scheme:dark]"
                    />
                </div>
                
                {/* Date Range End */}
                <div className="relative group">
                    <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all [color-scheme:dark]"
                    />
                </div>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm uppercase">
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Device Details</th>
                        <th className="p-4 font-medium">Payment</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                    {isOrdersLoading ? (
                        <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading orders...
                            </div>
                        </td>
                        </tr>
                    ) : filteredOrders.length === 0 ? (
                        <tr>
                        <td colSpan={6} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-500">
                            <Search size={32} className="mb-2 opacity-50" />
                            <p className="text-lg font-medium">No orders found</p>
                            <p className="text-sm opacity-70">Try adjusting your search or filters</p>
                            </div>
                        </td>
                        </tr>
                    ) : (
                        filteredOrders.map((order) => (
                        <tr 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                            <td className="p-4 text-slate-300 whitespace-nowrap text-sm">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            <div className="text-xs text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}</div>
                            </td>
                            <td className="p-4">
                            <div className="text-white font-medium group-hover:text-brand-400 transition-colors">{order.userEmail}</div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-1" title={order.userId}>
                                ID: {order.userId?.substring(0, 8)}...
                            </div>
                            </td>
                            <td className="p-4">
                            <div className="flex items-center gap-2 text-white">
                                <Smartphone size={16} className="text-brand-400" />
                                {order.router?.brand || 'Unknown'} {order.router?.model || 'Device'}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1 bg-slate-900/50 inline-block px-1 rounded">IMEI: {order.router?.imei || 'N/A'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{order.router?.country || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                            <div className="text-slate-300 font-medium">
                                {order.currency} {order.amount}
                            </div>
                            {order.paymentProofUrl && (
                                <a 
                                href={order.paymentProofUrl} 
                                onClick={(e) => e.stopPropagation()}
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-1 font-medium transition-colors"
                                >
                                <ExternalLink size={12} />
                                View Proof
                                </a>
                            )}
                            </td>
                            <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                            </td>
                            <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            {order.status !== 'completed' && (
                                <button 
                                onClick={() => setSelectedOrder(order)} // Open modal to complete
                                className="text-green-500 hover:bg-green-500/10 p-2 rounded-lg transition-colors"
                                title="Complete"
                                >
                                <CheckCircle size={18} />
                                </button>
                            )}
                            {order.status !== 'failed' && (
                                <button 
                                onClick={() => handleStatusChange(order.id!, 'failed')}
                                className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                title="Mark Failed"
                                >
                                <XCircle size={18} />
                                </button>
                            )}
                            {order.status === 'pending' && (
                                <button 
                                onClick={() => handleStatusChange(order.id!, 'verified')}
                                className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                                title="Verify Payment"
                                >
                                <Clock size={18} />
                                </button>
                            )}
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </>
      )}

      {activeTab === 'users' && (
        /* --- USERS VIEW --- */
        <>
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5 mb-6 backdrop-blur-sm">
                 <div className="relative group max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                    <input 
                    type="text" 
                    placeholder="Search users by email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm uppercase">
                        <th className="p-4 font-medium">User Email</th>
                        <th className="p-4 font-medium">Provider</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Joined Date</th>
                        <th className="p-4 font-medium">User ID</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                    {isUsersLoading ? (
                        <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                             <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading users...
                            </div>
                        </td>
                        </tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">No users found</td>
                        </tr>
                    ) : (
                        filteredUsers.map((user) => {
                            const isAdmin = admins.includes(user.id) || user.email === 'admin@unlockglobal.com';
                            return (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="text-slate-500" />
                                            <span className="text-white font-medium">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="capitalize bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                                            {user.provider}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {isAdmin ? (
                                            <span className="flex items-center gap-1 w-fit text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                                                <ShieldCheck size={12} />
                                                ADMIN
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500">User</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {user.id}
                                    </td>
                                    <td className="p-4 text-right">
                                        {user.email !== 'admin@unlockglobal.com' && (
                                            isAdmin ? (
                                                <button 
                                                    onClick={() => handleRevokeAdmin(user.id)}
                                                    className="text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded text-xs border border-red-500/30 transition-colors flex items-center gap-1 ml-auto"
                                                >
                                                    <ShieldAlert size={12} /> Revoke Admin
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handlePromoteAdmin(user.email)}
                                                    className="text-brand-400 hover:bg-brand-500/10 px-3 py-1.5 rounded text-xs border border-brand-500/30 transition-colors flex items-center gap-1 ml-auto"
                                                >
                                                    <Shield size={12} /> Promote to Admin
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
                </div>
                 <div className="bg-slate-900/50 p-3 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
                    <span>Showing {filteredUsers.length} users</span>
                </div>
            </div>
        </>
      )}

      {activeTab === 'countries' && (
        <DataManagementTab type="countries" />
      )}

      {activeTab === 'brands' && (
        <DataManagementTab type="brands" />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusChange={handleStatusChange} 
        />
      )}
    </div>
  );
};