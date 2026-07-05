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

export default function GovSecurity({ state }: { state: any }) {
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
             <div className="bg-primary p-12 rounded-[48px] text-white overflow-hidden relative">
                <div className="relative z-10 max-w-2xl">
                   <h3 className="text-3xl font-black uppercase italic mb-4">Protocole de Sécurité Actif</h3>
                   <p className="text-sm font-medium text-white/60 mb-8">Nous utilisons un chiffrement de bout en bout pour les communications et un système de vérification d'identité en 3 étapes pour chaque entreprise.</p>
                   <div className="flex space-x-8">
                      <div className="flex items-center space-x-3">
                         <div className="w-2 h-2 bg-success rounded-full" />
                         <span className="text-[10px] font-black uppercase">Pare-feu B2B Actif</span>
                      </div>
                      <div className="flex items-center space-x-3">
                         <div className="w-2 h-2 bg-success rounded-full" />
                         <span className="text-[10px] font-black uppercase">KYC Automatisé</span>
                      </div>
                   </div>
                </div>
                <ShieldCheck className="absolute -end-20 -bottom-20 h-80 w-80 text-white/5 -rotate-12" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                   <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-6 italic">Tentatives d'accès suspectes</h4>
                   <div className="space-y-4">
                      {[
                        { ip: '192.168.1.45', location: 'Alger', method: 'Brute force', status: 'Bloqué' },
                        { ip: '45.22.10.8', location: 'Unknown', method: 'Proxy/VPN', status: 'Flagged' },
                      ].map((log, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                           <div>
                              <p className="text-[10px] font-black text-primary">{log.ip}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{log.location} • {log.method}</p>
                           </div>
                           <span className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest">{log.status}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                   <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-6 italic">Audit des Actions Staff</h4>
                   <div className="space-y-4">
                      {[
                        { user: 'Abdallah S.', action: 'Validation KYC #492', time: '10 min' },
                        { user: 'Salim R.', action: 'Modération AO #221', time: '1h' },
                      ].map((action, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                           <div>
                              <p className="text-[10px] font-black text-primary uppercase leading-tight italic">{action.action}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{action.user}</p>
                           </div>
                           <span className="text-[8px] font-black text-gray-300 uppercase italic">{action.time}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </motion.div>
        );

      
}
