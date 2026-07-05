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
  ShieldCheck, Trash, Trash2, TrendingUp, Users, X, Zap, Store,
  Download
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';

export default function GovOverview({ state }: { state: any }) {
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
    handleApproveKYC, handleRejectKYC, statsAdmin, revenueData, registrationsData, profile, visits, events,
    totalTimeSpentSec, clearLogs, logout, navigate, isDashboardLoading
  } = state;

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-black uppercase italic tracking-widest text-primary">Vue d'Ensemble</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-secondary text-primary rounded-2xl hover:bg-secondary/90 transition-all font-bold text-xs uppercase tracking-wider"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter rapport
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {statsAdmin.map((stat: any, i: number) => {
          const isPositive = String(stat.trend).includes('+');
          const isNegative = String(stat.trend).includes('-');
          return (
          <div 
            key={i} 
            onClick={() => stat.link && setActiveTab(stat.link)}
            className="bg-white/70 backdrop-blur-md p-7 rounded-[32px] border border-white shadow-sm hover:shadow-xl transition-all group cursor-pointer relative"
            title={stat.tooltip}
          >
            {isDashboardLoading ? (
              <div className="animate-pulse flex flex-col h-full justify-between gap-4">
                 <div className="flex justify-between items-center w-full">
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                    <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
                 </div>
                 <div>
                    <div className="w-24 h-3 bg-gray-200 rounded-md mb-2"></div>
                    <div className="w-32 h-8 bg-gray-200 rounded-lg"></div>
                 </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className={cn("flex items-center text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest", 
                    isPositive ? "bg-green-100 text-green-700" : isNegative ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
                    {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                    {isNegative && <ArrowUpDown className="w-3 h-3 mr-1" />}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em] leading-none mb-3">{stat.label}</p>
                <h3 className="text-3xl font-black text-primary leading-none tracking-tight">{stat.value}</h3>
              </>
            )}
          </div>
        )})}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 text-primary">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest italic">Inscriptions</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Nouveaux utilisateurs et entreprises</p>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-1 border border-white shadow-sm flex items-center">
                {[
                  { id: '7', label: '7 Jours' },
                  { id: '30', label: '30 Jours' },
                  { id: '90', label: '3 Mois' },
                  { id: '365', label: '1 An' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setChartTimeframe(tf.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                      chartTimeframe === tf.id ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              {isDashboardLoading ? (
                 <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationsData}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="inscriptions" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorReg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 text-primary">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest italic">Revenus</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Évolution des transactions sur la plateforme</p>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-1 border border-white shadow-sm flex items-center">
                {[
                  { id: '7', label: '7 Jours' },
                  { id: '30', label: '30 Jours' },
                  { id: '90', label: '3 Mois' },
                  { id: '365', label: '1 An' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setChartTimeframe(tf.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                      chartTimeframe === tf.id ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              {isDashboardLoading ? (
                 <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm text-primary">
            <h3 className="text-sm font-black uppercase mb-6 flex items-center italic">
              <Activity className="h-4 w-4 mr-2 text-secondary" />
              Flux d'activité
            </h3>
            <div className="space-y-6">
              {[
                { icon: Users, title: 'Nouvelle Inscription', desc: 'Sonelgaz (Acheteur)', time: 'À l\'instant' },
                { icon: ShieldCheck, title: 'KYC Validé', desc: 'Algeria Tech Solutions', time: '2 min' },
              ].map((activity, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase italic">{activity.title}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
