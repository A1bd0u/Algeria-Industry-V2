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

export default function GovTelemetry({ state }: { state: any }) {
  const { data: viewData = [], isLoading } = useQuery({
          queryKey: ['admin-GovTelemetry'],
          queryFn: async () => {
            const res = await fetch('/api/admin/telemetry', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
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
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Suivi, Traces & Télémétrie</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Données de session et interactions recueillies en temps réel sur la plateforme
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  clearLogs();
                  setNotification({ message: "Données de navigation réinitialisées.", type: "success" });
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="self-start sm:self-auto px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center space-x-2"
              >
                <Trash className="h-4 w-4" />
                <span>Effacer les Traces</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em]">Durée Session</p>
                  <p className="text-xl font-black text-primary font-mono mt-1">
                    {Math.floor(totalTimeSpentSec / 60)}m {totalTimeSpentSec % 60}s
                  </p>
                </div>
              </div>

              <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em]">Pages Consultées</p>
                  <p className="text-xl font-black text-primary font-mono mt-1">{visits.length}</p>
                </div>
              </div>

              <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <MousePointer className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em]">Interactions</p>
                  <p className="text-xl font-black text-primary font-mono mt-1">{events.length}</p>
                </div>
              </div>

              <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] text-primary/30 font-black uppercase tracking-[0.2em]">Mode Réseau</p>
                  <p className="text-sm font-black text-primary flex items-center mt-1 uppercase tracking-tight">
                    <span className={`w-2.5 h-2.5 rounded-full me-2 ${profile.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {profile.online ? 'En Ligne' : 'Hors Ligne'}
                  </p>
                </div>
              </div>
            </div>

            {/* Browser & OS Card */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 italic">Spécifications Techniques Appareil & Navigateur</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="border-r border-gray-100 last:border-0 pe-4 w-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Système d'Exploitation</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    <span className="font-bold text-sm text-primary">{profile.os}</span>
                  </div>
                </div>

                <div className="border-r border-gray-100 last:border-0 pe-4 w-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Navigateur</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <span className="font-bold text-sm text-primary">{profile.browser}</span>
                  </div>
                </div>

                <div className="border-r border-gray-100 last:border-0 pe-4 w-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Adresse IP</p>
                  <p className="font-bold text-sm text-emerald-600 mt-2 font-mono truncate" title={profile.ipAddress}>
                    {profile.ipAddress || 'Détection...'}
                  </p>
                </div>

                <div className="border-r border-gray-100 last:border-0 pe-4 w-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Langue & Résolution</p>
                  <p className="font-bold text-sm text-primary mt-2">
                    {profile.language.toUpperCase()} • {profile.screenWidth} x {profile.screenHeight} px
                  </p>
                </div>

                <div className="w-full">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date & Fuseau Horaire</p>
                  <p className="font-bold text-sm text-primary mt-2">
                    {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • (UTC{new Date().getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(new Date().getTimezoneOffset() / 60)})
                  </p>
                </div>
              </div>
            </div>

            {/* Split page details AND user interactions timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visited Page Timeline */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Pages Consultées (Session Actuelle)</h4>
                  <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1 rounded-full uppercase">Total ({visits.length})</span>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pe-2 custom-scrollbar">
                  {visits.slice().reverse().map((visit, index) => (
                    <div key={index} className="p-4 bg-gray-50 hover:bg-gray-100/50 rounded-2xl border-l-4 border-secondary transition-all">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-xs text-primary truncate max-w-[200px] sm:max-w-xs">{visit.title}</p>
                        <span className="text-[9px] font-mono text-gray-400 font-bold">
                          {new Date(visit.enterTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-secondary font-mono tracking-tight mt-1 truncate">{visit.path}</p>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Défilement Max: {visit.scrollDepth}%</span>
                        <span>
                          {visit.durationMs ? `Durée: ${Math.round(visit.durationMs / 1000)}s` : 'Page Actuelle'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {visits.length === 0 && (
                    <div className="text-center py-12 opacity-40">
                      <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Aucune visite enregistrée</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interaction Details Timeline */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Derniers Événements Physiques</h4>
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">En Direct ({events.length})</span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pe-2 custom-scrollbar">
                  {events.map((ev, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-all">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <MousePointer className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Clic sur &lt;{ev.targetTag}&gt;</p>
                          <span className="text-[9px] font-mono text-gray-400 font-bold">
                            {new Date(ev.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-primary truncate mt-1">"{ev.targetText || 'Sans texte'}"</p>
                        <p className="text-[9px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                          Cible: {ev.currentPath} {ev.targetId && `• ID: ${ev.targetId}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-12 opacity-40">
                      <MousePointer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Effectuez des clics sur l'application pour voir les métriques s'actualiser.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
