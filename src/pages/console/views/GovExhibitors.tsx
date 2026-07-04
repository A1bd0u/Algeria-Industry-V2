/* eslint-disable */
import React from 'react';
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

export default function GovExhibitors({ state }: { state: any }) {
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

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Gestion des Exposants</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gérez manuellement les grandes entreprises et exposants du salon virtuel</p>
              </div>
              <button onClick={() => setShowExhibitorForm(true)} className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-secondary transition-all">
                <Plus className="h-4 w-4" />
                <span>Nouv. Exposant</span>
              </button>
            </div>
            
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/30">
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entreprise</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Région</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date d'ajout</th>
                         <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {exhibitors.map((ex) => (
                       <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-8 py-5">
                            <span className="text-sm font-black text-primary uppercase tracking-wider">{ex.name}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{ex.category}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{ex.region}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{ex.type}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", ex.status === 'Premium' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary")}>{ex.status}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ex.added}</span>
                         </td>
                         <td className="px-8 py-5 text-right space-x-2">
                           <button className="p-2 bg-gray-50 text-gray-400 hover:text-primary rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                           <button onClick={() => {
                             if(window.confirm('Supprimer cet exposant ?')) {
                               setExhibitors(exhibitors.filter(e => e.id !== ex.id));
                               showNotify("Exposant supprimé", "success");
                             }
                           }} className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        );

      
}
