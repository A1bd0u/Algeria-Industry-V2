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

export default function SiteSettings({ state }: { state: any }) {
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
            <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic mb-8">Configuration Système</h3>
            <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl p-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                        <div>
                           <p className="text-xs font-black text-primary uppercase">Mode Maintenance</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Suspendre l'accès public au portail</p>
                        </div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                           <div className="absolute start-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest italic flex items-center">
                           <ShieldCheck className="h-4 w-4 me-2 text-secondary" />
                           Niveau de sécurité API
                        </label>
                        <select className="w-full bg-gray-50 border border-gray-100 px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl outline-none focus:border-secondary transition-all">
                           <option>Standard (Filtres B2B)</option>
                           <option>Renforcé (Strict KYC)</option>
                           <option>Critique (Mode Audit)</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Commission Globale (%)</label>
                        <div className="flex items-center space-x-4">
                           <input type="range" className="flex-1 accent-secondary" />
                           <span className="text-xl font-black text-secondary">2.5%</span>
                        </div>
                     </div>

                     <div className="p-8 bg-primary rounded-[32px] text-white">
                        <h4 className="text-sm font-black uppercase tracking-tighter mb-4 italic">Sauvegarde Système</h4>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed mb-6">Dernière sauvegarde effectuée aujourd'hui à 04:00 AM sur serveurs Cloud Algeria.</p>
                        <button onClick={() => showNotify("Sauvegarde en cours...", "success")} className="w-full bg-secondary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Lancer Backup Manuel</button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        );

      
}
