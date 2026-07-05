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

export default function GovRevenue({ state }: { state: any }) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Revenu Mensuel (MRR)</p>
                  <h4 className="text-3xl font-black text-primary">2.4M <span className="text-sm font-bold text-gray-300">DZD</span></h4>
                  <div className="mt-4 flex items-center text-success text-[10px] font-black uppercase tracking-widest">
                    <ArrowUpRight className="h-4 w-4 me-1" />
                    +15.4% vs Mai
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Dépenses Marketing (GADS)</p>
                  <h4 className="text-3xl font-black text-primary">450k <span className="text-sm font-bold text-gray-300">DZD</span></h4>
                  <div className="mt-4 flex items-center text-primary text-[10px] font-black uppercase tracking-widest">
                    <Activity className="h-4 w-4 me-1" />
                    ROI : 5.3x
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Frais de Transaction</p>
                  <h4 className="text-3xl font-black text-primary">1.2M <span className="text-sm font-bold text-gray-300">DZD</span></h4>
                  <div className="mt-4 flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <Clock className="h-4 w-4 me-1" />
                    Stabilité : 98%
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest">Derniers Paiements Bancaires</h3>
                  <button onClick={() => showNotify("Génération de l'export en cours...", "success")} className="text-[10px] font-black text-secondary uppercase tracking-widest underline decoration-2 underline-offset-4">Exporter le grand livre</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-start">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Client / Entreprise</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Offre</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Montant</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[10px]">
                       {[
                         { name: 'Sarl Mecanique plus', plan: 'Gold Annual', amount: '29,900 DZD', method: 'CIB', status: 'Validé' },
                         { name: 'Global Tech DZ', plan: 'Silver Monthly', amount: '4,500 DZD', method: 'Virement', status: 'Attente' },
                         { name: 'Algeria Filtration', plan: 'Gold Annual', amount: '29,900 DZD', method: 'CIB', status: 'Validé' },
                         { name: 'Karim Benali (Pro)', plan: 'Consultant', amount: '12,000 DZD', method: 'Paypal', status: 'Validé' },
                       ].map((pay, i) => (
                         <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-6 font-black text-primary uppercase">{pay.name}</td>
                           <td className="px-8 py-6 font-bold text-gray-500 uppercase">{pay.plan}</td>
                           <td className="px-8 py-6 font-black text-primary">{pay.amount}</td>
                           <td className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest italic">{pay.method}</td>
                           <td className="px-8 py-6">
                              <span className={cn("px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", pay.status === 'Validé' ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500")}>{pay.status}</span>
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
