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

export default function GovSupport({ state }: { state: any }) {
  const { data: viewData = [], isLoading } = useQuery({
          queryKey: ['admin-GovSupport'],
          queryFn: async () => {
            const res = await fetch('/api/admin/support/tickets', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
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
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight">Support & Assistance Technique</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gérez les demandes d'assistance des exposants et utilisateurs</p>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-xl">
                    <button className="px-4 py-2 bg-white rounded-lg text-[10px] font-black text-primary shadow-sm uppercase tracking-widest" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>Ouverts (5)</button>
                    <button className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>Fermés</button>
                  </div>
               </div>
               <div className="p-8 space-y-4">
                  {[
                    { user: "Sarl Algeria Tech", subject: "Problème upload PDF catalogue", priority: "Haute", status: "Nouveau" },
                    { user: "Mecanique Plus", subject: "Question sur le badge de certification", priority: "Moyenne", status: "En cours" },
                    { user: "Karim Benali", subject: "Accès console restreint", priority: "Haute", status: "Nouveau" },
                  ].map((ticket, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-secondary transition-all group">
                       <div className="flex items-center space-x-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary shadow-sm">{ticket.user.charAt(0)}</div>
                          <div>
                             <h4 className="text-xs font-black text-primary uppercase mb-1">{ticket.subject}</h4>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{ticket.user} • Priorité {ticket.priority}</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            ticket.status === 'Nouveau' ? "bg-secondary text-white shadow-lg" : "bg-primary text-white"
                          )}>{ticket.status}</span>
                          <button className="p-3 bg-white text-gray-400 rounded-xl hover:text-primary transition-all shadow-sm" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        );

      
}
