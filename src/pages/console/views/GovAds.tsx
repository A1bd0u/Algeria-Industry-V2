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

export default function GovAds({ state }: { state: any }) {
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase italic">Gestion des Publicités</h3>
                <p className="text-gray-500 mt-2">Suivi et administration des espaces publicitaires clients.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-primary mb-6">Demandes en attente</h4>
                  <div className="space-y-4">
                    {ads.filter((a: any) => a.status === 'en_attente').length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Aucune demande en attente.</p>
                    ) : (
                      ads.filter((a: any) => a.status === 'en_attente').map((ad: any) => (
                        <div key={ad.id} className="p-4 border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                             <p className="font-bold text-gray-900">{ad.title}</p>
                             <p className="text-xs text-gray-500 mt-1">Objectif: {ad.objective || 'Non spécifié'} • Durée: {ad.duration || 'Non spécifiée'}</p>
                           </div>
                           <div className="flex space-x-2 shrink-0">
                              <button onClick={() => handleApproveAd(ad.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">Approuver</button>
                              <button onClick={() => handleRejectAd(ad.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Refuser</button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-primary mb-6">Campagnes Actives</h4>
                   {ads.filter((a: any) => ['Actif', 'published', 'approuvée', 'Approuvé'].includes(a.status)).length === 0 ? (
                     <div className="bg-gray-50 p-8 text-center rounded-3xl border border-dashed border-gray-200">
                       <Zap className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                       <p className="font-bold text-gray-900">Aucune campagne active</p>
                       <p className="text-xs text-gray-500 mt-1">Les campagnes approuvées apparaîtront ici.</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {ads.filter((a: any) => ['Actif', 'published', 'approuvée', 'Approuvé'].includes(a.status)).map((ad: any) => (
                         <div key={ad.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">{ad.title}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Actif</span>
                                <span className="text-xs text-gray-500">Objectif: {ad.objective || 'N/A'}</span>
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                   <h4 className="font-bold text-primary mb-6">Statistiques Pubs</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                         <span className="text-sm text-gray-500 font-bold">Revenus Pubs (Mois)</span>
                         <span className="font-black text-secondary">0 DZD</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                         <span className="text-sm text-gray-500 font-bold">Impressions Totales</span>
                         <span className="font-black text-primary">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-500 font-bold">Clics Totaux</span>
                         <span className="font-black text-primary">0</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      
}
