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

export default function SiteCms({ state }: { state: any }) {
  const { data: viewData = [], isLoading } = useQuery({
          queryKey: ['admin-SiteCms'],
          queryFn: async () => {
            const res = await fetch('/api/admin/cms', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
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

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
             <div className="flex justify-between items-end mb-8">
               <div>
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Gestion du Contenu</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Publiez les actualités et l'encyclopédie industrielle</p>
               </div>
               <div className="flex space-x-3">
                  <button onClick={() => showNotify("Création de catégorie en cours...", "success")} className="bg-white border border-gray-100 text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Nouv. Catégorie</button>
                  <button 
                    onClick={() => setShowArticleForm(true)}
                    className="bg-secondary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:scale-105 transition-all shadow-lg"
                  >
                     <Plus className="h-4 w-4" />
                     <span>Rédiger Article</span>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { title: "Transition Industrie 4.0", type: "Blog", status: "Publié", views: "1.2k" },
                 { title: "Guide de la Maintenance 2026", type: "Ressource", status: "Publié", views: "4.5k" },
                 { title: "E-procurement en Algérie", type: "Actualité", status: "Brouillon", views: "0" },
               ].map((item, i) => (
                 <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                    <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-secondary/5 transition-colors">
                       <Newspaper className="h-10 w-10" />
                    </div>
                    <div className="p-6">
                       <div className="flex justify-between items-start mb-4">
                          <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{item.type}</span>
                          <span className={cn("text-[9px] font-black px-2 py-1 rounded-md uppercase", item.status === 'Publié' ? "bg-emerald-50 text-emerald-500" : "bg-gray-100 text-gray-400")}>{item.status}</span>
                       </div>
                       <h4 className="text-sm font-black text-primary uppercase tracking-tight mb-4 group-hover:text-secondary transition-colors line-clamp-2 italic">{item.title}</h4>
                       <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400">
                             <Eye className="h-3 w-3" />
                             <span>{item.views}</span>
                          </div>
                          <div className="flex space-x-1">
                             <button onClick={() => showNotify("Ouverture de l'article pour édition...", "success")} className="p-2 text-gray-400 hover:text-primary transition-all"><Edit2 className="h-3.5 w-3.5" /></button>
                             <button onClick={() => showNotify("Article supprimé de la base de données", "error")} className="p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        );

      
}
