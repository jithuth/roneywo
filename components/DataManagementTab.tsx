import React, { useState, useEffect } from 'react';
import { getManagementData, addManagementItem, updateManagementItem, toggleManagementItemStatus, softDeleteManagementItem } from '../services/supabaseService';
import { ManagementItem } from '../types';
import { Plus, Edit2, Trash2, Power, Check, X, Search, Loader } from 'lucide-react';

interface Props {
  type: 'countries' | 'brands';
}

export const DataManagementTab: React.FC<Props> = ({ type }) => {
  const [data, setData] = useState<ManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagementItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = type === 'countries' ? 'Countries' : 'Brands';

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getManagementData(type);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateManagementItem(type, editingItem.id, itemName.trim());
      } else {
        await addManagementItem(type, itemName.trim());
      }
      setIsModalOpen(false);
      setItemName('');
      setEditingItem(null);
      fetchData();
    } catch (error) {
      alert("Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ManagementItem) => {
    try {
      await toggleManagementItemStatus(type, item.id, item.is_active);
      setData(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to remove this ${type === 'countries' ? 'country' : 'brand'}? It will be hidden from the selection list.`)) return;
    
    try {
      await softDeleteManagementItem(type, id);
      setData(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ManagementItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setIsModalOpen(true);
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5 backdrop-blur-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative group w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder={`Search ${title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 p-2 text-sm text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add {title === 'Countries' ? 'Country' : 'Brand'}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm uppercase">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin" />
                      Loading {title}...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No {title.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-white">{item.name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        item.is_active 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                        {item.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(item)}
                        className={`p-1.5 rounded transition-colors ${item.is_active ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                        title={item.is_active ? "Disable" : "Enable"}
                      >
                        <Power size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingItem ? 'Edit' : 'Add New'} {type === 'countries' ? 'Country' : 'Brand'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder={`Enter ${type === 'countries' ? 'country' : 'brand'} name`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white p-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader size={16} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
