/* eslint-disable */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { 
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Bell, 
  Building2, CheckCircle, ChevronRight, Clock, CreditCard, Edit2, Eye, 
  FileText, Filter, Globe, History, LayoutDashboard, LayoutList, Lock, 
  MessageSquare, Monitor, MoreVertical, MousePointer, Newspaper, 
  PackagePlus, Plus, Search, SlidersHorizontal, ArrowUpDown, Settings, 
  ShieldCheck, Trash, Trash2, TrendingUp, Users, X, Zap, Store
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';

export default function GovCategories({ state }: { state: any }) {
  const { data: viewData = [], isLoading } = useQuery({
          queryKey: ['admin-GovCategories'],
          queryFn: async () => {
            const res = await fetch('/api/admin/categories', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
            const json = await res.json();
            return json.data || [];
          }
        });
  const {
    activeTab, setActiveTab, chartTimeframe, setChartTimeframe, showArticleForm, setShowArticleForm,
    exhibitors, setExhibitors, showExhibitorForm, setShowExhibitorForm, pendingKYC, setPendingKYC,
    approvedKYC, setApprovedKYC, notification, setNotification, products, setProducts, ads, setAds,
    productSearch, setProductSearch, productRegionFilter, setProductRegionFilter, productStatusFilter,
    setProductStatusFilter, productSortOrder, setProductSortOrder, filteredProducts, categories,
    setCategories, selectedCategory, setSelectedCategory, newSubCatName, setNewSubCatName,
    editingCategoryName, setEditingCategoryName, handleApproveProduct, handleRejectProduct,
    handleApproveAd, handleRejectAd, handleAddCategory, handleOpenCategorySettings,
    handleSaveCategorySettings, handleAddSubCategory, handleRemoveSubCategory, showNotify,
    handleApproveKYC, handleRejectKYC, statsAdmin, revenueData, profile, visits, events,
    totalTimeSpentSec, clearLogs, logout, navigate
  } = state;

        if (selectedCategory) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="flex justify-between items-end mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Paramètres de la Catégorie</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gérer le nom et les sous-catégories</p>
                 </div>
                 <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-primary transition-all px-4 py-2 font-bold text-[10px] uppercase flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-180" />
                    <span>Retour aux catégories</span>
                 </button>
               </div>
               
               <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de la catégorie principale</label>
                    <input 
                      type="text" 
                      value={editingCategoryName} 
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-primary uppercase focus:border-secondary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sous-catégories ({selectedCategory.subCategories.length})</label>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {selectedCategory.subCategories.map((sub: any) => (
                        <div key={sub.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                          <span className="text-sm font-bold text-gray-600">{sub.name}</span>
                          <button onClick={() => handleRemoveSubCategory(sub.id)} className="text-gray-400 hover:text-red-500 transition-all p-1"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      {selectedCategory.subCategories.length === 0 && <p className="text-xs text-gray-400 italic">Aucune sous-catégorie configurée.</p>}
                     </div>

                    <div className="flex space-x-3">
                      <input 
                        type="text" 
                        value={newSubCatName} 
                        onChange={(e) => setNewSubCatName(e.target.value)}
                        placeholder="Nouveau nom de sous-catégorie..."
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-secondary outline-none transition-all"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubCategory(); } }}
                      />
                      <button onClick={handleAddSubCategory} className="bg-gray-100 text-primary px-6 py-3 rounded-xl hover:bg-gray-200 transition-all text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
                         <Plus className="h-4 w-4" />
                         <span>Ajouter</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex justify-end">
                    <button onClick={handleSaveCategorySettings} className="bg-primary text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 transition-all">
                       Sauvegarder les modifications
                    </button>
                  </div>
               </div>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
             <div className="flex justify-between items-end mb-8">
               <div>
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Secteurs & Catégories</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organisez la hiérarchie du catalogue industriel</p>
               </div>
               <button onClick={handleAddCategory} className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle Catégorie</span>
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {categories.map((cat, i) => (
                 <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:border-secondary transition-all">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-secondary group-hover:text-white transition-all"><LayoutList className="h-4 w-4" /></div>
                       <div>
                          <p className="text-xs font-black text-primary uppercase">{cat.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cat.subCategories.length} Sous-catégories</p>
                       </div>
                    </div>
                    <button className="p-2 text-gray-300 hover:text-primary transition-all" onClick={(e) => { e.preventDefault(); handleOpenCategorySettings(cat); }}><Settings className="h-4 w-4" /></button>
                 </div>
               ))}
            </div>
          </motion.div>
        );

      
}
