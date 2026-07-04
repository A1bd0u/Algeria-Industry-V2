/* eslint-disable */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { 
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Bell, 
  Building2, CheckCircle, ChevronRight, Clock, CreditCard, Edit2, Eye, 
  FileText, Filter, Globe, History, LayoutDashboard, LayoutList, Lock, 
  MessageSquare, Monitor, MoreVertical, MousePointer, Newspaper, 
  PackagePlus, Plus, Search, SlidersHorizontal, ArrowUpDown, Settings, 
  ShieldCheck, Trash, Trash2, TrendingUp, Users, X, Zap, Store
} from 'lucide-react';

import GovRoles from './views/GovRoles';
import GovAnalytics from './views/GovAnalytics';
import GovRevenue from './views/GovRevenue';
import GovAds from './views/GovAds';
import GovSecurity from './views/GovSecurity';
import GovOverview from './views/GovOverview';
import GovExhibitors from './views/GovExhibitors';
import GovCompanies from './views/GovCompanies';
import GovModeration from './views/GovModeration';
import GovSupport from './views/GovSupport';
import GovUsers from './views/GovUsers';
import GovCategories from './views/GovCategories';
import GovProducts from './views/GovProducts';
import SiteCms from './views/SiteCms';
import SiteSettings from './views/SiteSettings';
import GovTelemetry from './views/GovTelemetry';

export default function ConsoleLayout({ state }: { state: any }) {
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

  const renderContent = () => {
    switch(activeTab) {
      case 'gov-roles': return <GovRoles state={state} />;
      case 'gov-analytics': return <GovAnalytics state={state} />;
      case 'gov-revenue': return <GovRevenue state={state} />;
      case 'gov-ads': return <GovAds state={state} />;
      case 'gov-security': return <GovSecurity state={state} />;
      case 'gov-overview': return <GovOverview state={state} />;
      case 'gov-exhibitors': return <GovExhibitors state={state} />;
      case 'gov-companies': return <GovCompanies state={state} />;
            case 'gov-moderation': return <GovModeration state={state} />;
case 'gov-support': return <GovSupport state={state} />;
      case 'gov-users': return <GovUsers state={state} />;
      case 'gov-categories': return <GovCategories state={state} />;
      case 'gov-products': return <GovProducts state={state} />;
      case 'site-cms': return <SiteCms state={state} />;
      case 'site-settings': return <SiteSettings state={state} />;
      case 'gov-telemetry': return <GovTelemetry state={state} />;
      default: return null;
    }
  };

  const menuSections = [
    {
      title: "Pilotage Stratégique",
      items: [
        { id: 'gov-overview', name: 'Vue d\'Ensemble', icon: LayoutDashboard },
        { id: 'gov-analytics', name: 'Analytique Avancée', icon: BarChart3 },
        { id: 'gov-telemetry', name: 'Suivi & Télémétrie', icon: Zap },
        { id: 'gov-revenue', name: 'Gestion Revenus', icon: CreditCard },
        { id: 'gov-ads', name: 'Gestion Publicités', icon: Zap },
      ]
    },
    {
      title: "Gestion Catalogue",
      items: [
        { id: 'gov-products', name: 'Produits & Services', icon: PackagePlus },
        { id: 'gov-categories', name: 'Catégories', icon: LayoutList },
      ]
    },
    {
      title: "Opérations Plateforme",
      items: [
        { id: 'gov-users', name: 'Comptes & Accès', icon: Users },
        { id: 'gov-roles', name: 'Rôles & Staff', icon: ShieldCheck },
        { id: 'gov-security', name: 'Centre de Sécurité', icon: Lock },
        { id: 'gov-companies', name: 'KYC & Entreprises', icon: Building2 },
        { id: 'gov-exhibitors', name: 'Exposants & Grandes Ent.', icon: Store },
                { id: 'gov-moderation', name: 'Modération', icon: AlertTriangle },
{ id: 'gov-support', name: 'Support Technique', icon: MessageSquare },
      ]
    },
    {
      title: "Administration Site",
      items: [
        { id: 'site-cms', name: 'Gestion Contenu', icon: Newspaper },
        { id: 'site-settings', name: 'Config. Système', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Sidebar Unifiée - Ultra Pro Dark Edition */}
      <aside className="w-80 bg-[#0a0a0a] border-r border-white/5 flex flex-col sticky top-0 h-screen z-50 transition-all">
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="mb-10 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] text-white rounded-[32px] border border-white/5 shadow-2xl">
             <div className="flex items-center space-x-3 mb-6">
               <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
                 <ShieldCheck className="h-6 w-6 text-secondary" />
               </div>
               <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 leading-none">Console Pro</span>
                  <p className="text-xs font-black uppercase tracking-tight mt-1 text-white">Espace Unifié</p>
               </div>
             </div>
             <div className="h-px w-full bg-white/5 mb-6" />
             <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">ID: RO-DZ-9210</p>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </div>
          </div>

          <div className="space-y-10">
            {menuSections.map((section, idx) => (
              <div key={idx}>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.35em] px-4 mb-6">{section.title}</p>
                <div className="space-y-1.5">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 text-left group relative overflow-hidden",
                        activeTab === item.id 
                          ? "bg-secondary text-white shadow-xl" 
                          : "text-white/40 hover:bg-white/[0.03] hover:text-white"
                      )}
                    >
                      {activeTab === item.id && (
                        <motion.div 
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/80"
                        />
                      )}
                      <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-all duration-300 relative z-10", activeTab === item.id ? "text-white scale-110" : "text-white/20 group-hover:text-secondary group-hover:rotate-12")} />
                      <span className="relative z-10 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02]">
           <button className="w-full flex items-center justify-center space-x-3 py-4 text-white/40 hover:text-error transition-all text-[11px] font-black uppercase tracking-widest border border-white/5 rounded-2xl bg-white/[0.03] hover:bg-error/10 hover:border-error/20" onClick={async (e) => { 
                e.preventDefault(); 
                try {
                  await logout();
                  navigate('/');
                } catch (error) {
                  console.error("Erreur déconnexion:", error);
                }
              }}>
              <Globe className="h-4 w-4" />
              <span>DÉCONNEXION</span>
           </button>
        </div>
      </aside>

      {/* Main Container - Ultra Professional Layout */}
      <main className="flex-1 p-10 overflow-y-auto bg-neutral-bg/50">
        <div className="max-w-6xl mx-auto">
           {/* Section Header - Glassmorphism Edition */}
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-10 gap-6 bg-white/[0.8] backdrop-blur-xl p-6 rounded-[32px] border border-white/40 shadow-sm sticky top-0 z-40">
             <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-10">
                <Link to="/" className="flex items-center space-x-3 group">
                   <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg] shadow-lg">
                      <Globe className="h-6 w-6 text-white" />
                   </div>
                   <div className="hidden md:block leading-tight">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 leading-none">REGIONAL</span>
                      <p className="text-sm font-black uppercase tracking-tight text-primary leading-none mt-0.5">EXPO CONSOLE</p>
                   </div>
                </Link>
             </div>
             
             <div className="flex items-center space-x-3">
                <div className="hidden xl:flex items-center space-x-4 pr-6 border-r border-primary/5">
                    <div className="text-right">
                       <p className="text-[8px] text-primary/30 font-black uppercase tracking-widest">Network Status</p>
                       <div className="flex items-center justify-end space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_#10b981]" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Algeria North</p>
                       </div>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-primary/[0.03] p-1.5 rounded-2xl border border-primary/5">
                   <button className="relative p-2.5 text-primary/40 hover:text-secondary hover:bg-white rounded-xl transition-all duration-300" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white" />
                   </button>
                   <div className="h-8 w-px bg-primary/5 mx-1" />
                   <div className="flex items-center space-x-3 pl-1 pr-3 py-1 group cursor-pointer hover:bg-white rounded-xl transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-white flex items-center justify-center font-black text-sm uppercase shadow-lg group-hover:scale-105 transition-transform">
                        AS
                      </div>
                      <div className="hidden sm:block text-left leading-none">
                        <p className="text-[10px] font-black text-primary uppercase">Abdallah S.</p>
                        <p className="text-[8px] text-primary/40 font-bold uppercase mt-1 tracking-widest">Verified Admin</p>
                      </div>
                   </div>
                </div>
             </div>
           </div>

           {/* Tab Content Rendering */}
           <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab}
               initial={{ opacity: 0, scale: 0.99 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.01 }}
               transition={{ duration: 0.2 }}
             >
               {renderContent()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      {/* Exhibitor Form Modal */}
      <AnimatePresence>
        {showExhibitorForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button onClick={() => setShowExhibitorForm(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="text-2xl font-black text-primary uppercase tracking-tighter mb-8 italic">Ajouter un Exposant</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newEx = {
                  id: Date.now(),
                  name: formData.get('name'),
                  category: formData.get('category'),
                  type: formData.get('type'),
                  region: formData.get('region'),
                  status: formData.get('status'),
                  added: new Date().toISOString().split('T')[0]
                };
                setExhibitors([newEx, ...exhibitors]);
                setShowExhibitorForm(false);
                showNotify("Exposant ajouté avec succès", "success");
              }} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Nom de l'entreprise</label>
                  <input name="name" type="text" required className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all outline-none" placeholder="Ex: Sonatrach" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">Secteur / Catégorie</label>
                    <select name="category" className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary/20 outline-none">
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">Type d'entreprise</label>
                    <select name="type" className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary/20 outline-none">
                      <option value="Grande Entreprise">Grande Entreprise</option>
                      <option value="Moyenne Entreprise">Moyenne Entreprise</option>
                      <option value="Start-up / PME">Start-up / PME</option>
                      <option value="Institutionnel">Institutionnel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">Région (Wilaya)</label>
                    <input name="region" type="text" required className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all outline-none" placeholder="Ex: Alger" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">Statut (Abonnement)</label>
                    <select name="status" className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary/20 outline-none">
                      <option value="Premium">Premium</option>
                      <option value="Standard">Standard</option>
                      <option value="Basique">Basique</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-6">
                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all">Enregistrer l'exposant</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Article Form Modal */}
      <AnimatePresence>
        {showArticleForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-[80vh]">
                <div className="w-80 bg-gray-50 p-10 border-r border-gray-100 hidden md:block">
                  <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-8 italic">Nouvel Article</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Image de Couverture</label>
                      <div className="aspect-video bg-white border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-300 hover:border-secondary hover:text-secondary cursor-pointer transition-all">
                        <Plus className="h-6 w-6 mb-2" />
                        <span className="text-[8px] font-black uppercase">Upload Image</span>
                      </div>
                    </div>
                    <div className="p-6 bg-secondary/10 rounded-3xl">
                      <p className="text-[9px] font-bold text-secondary leading-relaxed uppercase">
                        Les articles sont publiés dans la section "Actualités & Blog" et notifiés aux utilisateurs abonnés.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
                  <div className="flex justify-end mb-6">
                    <button onClick={() => setShowArticleForm(false)} className="p-2 text-gray-400 hover:text-primary transition-all">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest">Titre de l'article</label>
                      <input 
                        type="text" 
                        placeholder="Ex: La transition énergétique en Algérie..."
                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest">Catégorie</label>
                        <select className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary/20 outline-none">
                          <option>Actualité</option>
                          <option>Blog</option>
                          <option>Ressource</option>
                          <option>Étude de Cas</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest">Temps de lecture</label>
                        <input type="text" placeholder="5 min" className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-xs font-bold outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest">Contenu (Markdown)</label>
                      <textarea 
                        rows={10}
                        placeholder="Rédigez votre contenu ici..."
                        className="w-full bg-gray-50 border-none px-6 py-6 rounded-3xl text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all outline-none resize-none"
                      />
                    </div>
                    <div className="flex space-x-4 pt-4">
                      <button onClick={() => { showNotify("Article publié avec succès", "success"); setShowArticleForm(false); }} className="flex-1 bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Publier Maintenant</button>
                      <button 
                        onClick={() => setShowArticleForm(false)}
                        className="px-8 border border-gray-100 text-gray-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notification Feedback */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[100] flex items-center space-x-4 border",
              notification.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-[11px] font-black uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



