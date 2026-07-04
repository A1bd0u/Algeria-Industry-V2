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

export default function GovRoles({ state }: { state: any }) {
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
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Rôles & Permissions</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Définissez les niveaux d'accès pour votre équipe interne</p>
               </div>
               <button onClick={() => showNotify("Création de rôle...", "success")} className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nouveau Rôle</span>
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { role: 'Super Admin', users: 2, access: 'Total', color: 'bg-primary' },
                 { role: 'Modérateur Content', users: 5, access: 'Catalogue & Articles', color: 'bg-emerald-500' },
                 { role: 'Agent Support', users: 3, access: 'Tickets & Messages', color: 'bg-blue-500' },
                 { role: 'Analyste Data', users: 1, access: 'Indicateurs & Stats', color: 'bg-orange-500' },
               ].map((role, i) => (
                 <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:border-secondary transition-all">
                    <div className="flex items-center justify-between mb-6">
                       <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest", role.color)}>{role.role}</div>
                       <Settings className="h-4 w-4 text-gray-200 group-hover:text-secondary transition-all" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-400 uppercase">Accès :</span>
                          <span className="font-black text-primary uppercase">{role.access}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-400 uppercase">Utilisateurs :</span>
                          <span className="font-black text-primary">{role.users} Membres</span>
                       </div>
                    </div>
                    <button onClick={() => showNotify("Redirection vers la matrice des droits d'accès", "success")} className="w-full mt-6 py-3 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Configurer les droits</button>
                 </div>
               ))}
            </div>
          </motion.div>
        );

      
}
