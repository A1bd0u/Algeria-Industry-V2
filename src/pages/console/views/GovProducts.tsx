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

export default function GovProducts({ state }: { state: any }) {
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
             <div className="flex justify-between items-end">
               <div>
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Base de Données Produits</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{filteredProducts.length} Produits référencés sur la plateforme</p>
               </div>
             </div>

             <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
               <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Rechercher par nom, référence ou exposant..." 
                   value={productSearch}
                   onChange={(e) => setProductSearch(e.target.value)}
                   className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-primary focus:border-secondary transition-all outline-none"
                 />
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                 <div className="relative">
                   <select 
                     value={productRegionFilter}
                     onChange={(e) => setProductRegionFilter(e.target.value)}
                     className="appearance-none bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl pl-4 pr-10 py-3 outline-none focus:border-secondary cursor-pointer"
                   >
                     <option value="Tous">Régions: Toutes</option>
                     <option value="Alger">Alger</option>
                     <option value="Oran">Oran</option>
                     <option value="Setif">Setif</option>
                   </select>
                   <SlidersHorizontal className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                 </div>

                 <div className="relative">
                   <select 
                     value={productStatusFilter}
                     onChange={(e) => setProductStatusFilter(e.target.value)}
                     className="appearance-none bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl pl-4 pr-10 py-3 outline-none focus:border-secondary cursor-pointer"
                   >
                     <option value="Tous">Status: Tous</option>
                     <option value="Certifié">Certifié</option>
                     <option value="En attente">En attente</option>
                     <option value="Rejeté">Rejeté</option>
                   </select>
                   <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                 </div>

                 <div className="relative">
                   <select 
                     value={productSortOrder}
                     onChange={(e) => setProductSortOrder(e.target.value as any)}
                     className="appearance-none bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl pl-4 pr-10 py-3 outline-none focus:border-secondary cursor-pointer"
                   >
                     <option value="date-desc">Tri: Plus récent</option>
                     <option value="date-asc">Tri: Plus ancien</option>
                     <option value="status">Tri: Statut</option>
                   </select>
                   <ArrowUpDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead className="bg-gray-50/50 border-b border-gray-100 font-sans">
                      <tr>
                         <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase">Produit</th>
                         <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase">Exposant</th>
                         <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase">Région</th>
                         <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase">Status</th>
                         <th className="p-6 text-right text-[10px] font-black text-gray-400 uppercase">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredProducts.length === 0 && (
                        <tr>
                           <td colSpan={5} className="p-12 text-center text-sm font-bold text-gray-400 italic">
                             Aucun produit ne correspond à vos critères de recherche.
                           </td>
                        </tr>
                      )}
                      {filteredProducts.map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                           <td className="p-6">
                              <div>
                                 <p className="text-xs font-black text-primary uppercase">{p.name}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase">Ref: {p.ref} • Ajouté le {p.dateAdded}</p>
                              </div>
                           </td>
                           <td className="p-6 text-[10px] font-black text-gray-500 uppercase">{p.company}</td>
                           <td className="p-6 text-[10px] font-black text-gray-500 uppercase">{p.region}</td>
                           <td className="p-6">
                              <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", 
                                p.status === 'Certifié' ? "bg-emerald-50 text-emerald-500" : 
                                p.status === 'Rejeté' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500")}>
                                 {p.status}
                              </span>
                           </td>
                           <td className="p-6 text-right">
                              <div className="flex justify-end space-x-2">
                                 {p.status === 'En attente' && (
                                   <>
                                     <button onClick={() => handleApproveProduct(p.id)} className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-all" title="Approuver"><CheckCircle className="h-4 w-4" /></button>
                                     <button onClick={() => handleRejectProduct(p.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all" title="Rejeter"><X className="h-4 w-4" /></button>
                                   </>
                                 )}
                                 <button onClick={() => showNotify("Redirection vers la page produit...", "success")} className="p-2 bg-gray-50 text-gray-400 hover:text-primary rounded-lg transition-all"><Eye className="h-4 w-4" /></button>
                                 <button onClick={() => showNotify("Ouverture de l'éditeur de produit...", "success")} className="p-2 bg-gray-50 text-gray-400 hover:text-secondary rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </motion.div>
        );


      
}
