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
    handleApproveKYC, handleRejectKYC, statsAdmin, revenueData, profile, visits, events,
    totalTimeSpentSec, clearLogs, logout, navigate
  } = state;

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsAdmin.map((stat, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-md p-7 rounded-[32px] border border-white shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-5">
                    <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}><stat.icon className="h-6 w-6" /></div>
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-success/10 text-success">{stat.trend}</span>
                  </div>
                  <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em] leading-none mb-3">{stat.label}</p>
                  <h3 className="text-3xl font-black text-primary leading-none tracking-tight">{stat.value}</h3>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 text-primary">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest italic">Performance du Business Model</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Revenus directs & croissance de l'écosystème</p>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
