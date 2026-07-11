/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Bell, 
  Building2, CheckCircle, ChevronRight, Clock, CreditCard, Edit2, Eye, 
  FileText, Filter, Globe, History, LayoutDashboard, LayoutList, Lock, 
  MessageSquare, Monitor, MoreVertical, MousePointer, Newspaper, 
  PackagePlus, Plus, Search, SlidersHorizontal, ArrowUpDown, Settings, 
  ShieldCheck, Trash, Trash2, TrendingUp, Users, X, Zap, Store
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action: string;
  ip_address: string;
  details: any;
  created_at: string;
}

export default function GovSecurity({ state }: { state: any }) {
  const { showNotify } = state;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data || []);
        } else {
          showNotify("Impossible de charger les journaux d'audit", "error");
        }
      } else {
        showNotify("Erreur de communication avec le serveur", "error");
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      showNotify("Erreur de connexion", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    let result = [...logs];

    // Filter by action type
    if (selectedAction !== 'all') {
      result = result.filter(log => log.action === selectedAction);
    }

    // Filter by search term (admin email or target in details)
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(log => {
        const emailMatch = log.admin_email?.toLowerCase().includes(lowerSearch);
        const actionMatch = log.action?.toLowerCase().includes(lowerSearch);
        const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(lowerSearch);
        const ipMatch = log.ip_address?.toLowerCase().includes(lowerSearch);
        return emailMatch || actionMatch || detailsMatch || ipMatch;
      });
    }

    setFilteredLogs(result);
  }, [logs, selectedAction, searchTerm]);

  const getActionInfo = (action: string) => {
    switch(action) {
      case 'suspension':
        return { 
          label: 'Compte Suspendu', 
          color: 'text-red-600 bg-red-50 border-red-100', 
          icon: AlertTriangle 
        };
      case 'reactivation':
        return { 
          label: 'Compte Réactivé', 
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
          icon: CheckCircle 
        };
      case 'user_delete':
        return { 
          label: 'Utilisateur Supprimé', 
          color: 'text-rose-600 bg-rose-50 border-rose-100', 
          icon: Trash2 
        };
      case 'role_change':
        return { 
          label: 'Rôle Modifié', 
          color: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
          icon: ShieldCheck 
        };
      case 'kyc_approve':
        return { 
          label: 'Dossier KYC Approuvé', 
          color: 'text-teal-600 bg-teal-50 border-teal-100', 
          icon: Building2 
        };
      case 'kyc_reject':
        return { 
          label: 'Dossier KYC Rejeté', 
          color: 'text-amber-600 bg-amber-50 border-amber-100', 
          icon: AlertTriangle 
        };
      case 'dashboard_consultation':
        return { label: 'Consultation Dashboard', color: 'text-gray-600 bg-gray-50 border-gray-100', icon: LayoutDashboard };
      case 'product_delete':
        return { label: 'Produit Supprimé', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: Trash2 };
      case 'company_delete':
        return { label: 'Entreprise Supprimée', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: Trash2 };
      case 'content_approve':
        return { label: 'Contenu Approuvé', color: 'text-teal-600 bg-teal-50 border-teal-100', icon: CheckCircle };
      case 'content_reject':
        return { label: 'Contenu Rejeté', color: 'text-red-600 bg-red-50 border-red-100', icon: AlertTriangle };
      default:
        return { 
          label: action, 
          color: 'text-gray-600 bg-gray-50 border-gray-100', 
          icon: Clock 
        };
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Banner */}
      <div className="bg-primary p-12 rounded-[48px] text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-black uppercase italic mb-4">Protocole de Sécurité Actif</h3>
          <p className="text-sm font-medium text-white/60 mb-8">
            Nous assurons une traçabilité totale sur les actions sensibles. Toutes les opérations administratives et de KYC sont auditées de façon immuable.
          </p>
          <div className="flex space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-[10px] font-black uppercase">Pare-feu B2B Actif</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-[10px] font-black uppercase">Audit Logs Temps Réel</span>
            </div>
          </div>
        </div>
        <ShieldCheck className="absolute -end-20 -bottom-20 h-80 w-80 text-white/5 -rotate-12" />
      </div>

      {/* Main Logs View */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-black text-primary uppercase italic">Journalisation Administrative (Audit logs)</h4>
            <p className="text-xs font-medium text-gray-400 mt-1">Consultez l'historique complet des actions de sécurité et de modération du staff.</p>
          </div>

          <button 
            onClick={fetchAuditLogs}
            className="self-start md:self-auto px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-gray-200"
          >
            <History className="h-3.5 w-3.5" />
            Actualiser
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher par administrateur, IP, cible..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-xs font-medium text-primary placeholder-gray-400 outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-primary outline-none focus:border-secondary transition-colors cursor-pointer"
            >
              <option value="all">Toutes les actions</option>
              <option value="suspension">Suspension de compte</option>
              <option value="reactivation">Réactivation de compte</option>
              <option value="user_delete">Suppression d'utilisateur</option>
              <option value="role_change">Changement de rôle</option>
              <option value="kyc_approve">Approbation KYC</option>
              <option value="kyc_reject">Rejet KYC</option>
              <option value="dashboard_consultation">Consultation Dashboard</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white px-4 py-3 rounded-2xl border border-gray-200 w-full text-center md:text-right">
              {filteredLogs.length} Résultat{filteredLogs.length !== 1 ? 's' : ''} trouvé{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Récupération des logs sécurisés...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-100 rounded-[32px] bg-gray-50/20">
            <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Aucun log d'audit trouvé</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Aucune action ne correspond à vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-100 rounded-3xl divide-y divide-gray-100 bg-white">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const info = getActionInfo(log.action);
                const Icon = info.icon;
                return (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn("p-3 rounded-2xl border shrink-0 transition-transform group-hover:scale-105", info.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", info.color)}>
                            {info.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            IP: {log.ip_address}
                          </span>
                        </div>
                        <p className="text-xs font-black text-primary mt-1.5 uppercase leading-none">
                          {log.admin_email}
                        </p>
                        {/* Summary of target */}
                        <p className="text-[10px] font-medium text-gray-400 mt-1">
                          {log.action === 'suspension' || log.action === 'reactivation' || log.action === 'role_change' || log.action === 'user_delete' ? (
                            <span>Cible: <strong className="text-gray-600">{log.details?.targetUserEmail || log.details?.targetUserId}</strong></span>
                          ) : log.action === 'kyc_approve' || log.action === 'kyc_reject' ? (
                            <span>Entreprise: <strong className="text-gray-600">{log.details?.targetCompanyName || log.details?.kycRequestId}</strong></span>
                          ) : (
                            <span>Consultation du panneau d'administration</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 text-left md:text-right shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 mt-1">
                        {new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Page {page} sur {totalPages}</p>
                <div className="flex gap-2">
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                    >
                        Précédent
                    </button>
                    <button 
                        disabled={page >= totalPages} 
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                    >
                        Suivant
                    </button>
                </div>
            </div>

          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setSelectedLog(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className={cn("p-3 rounded-2xl border", getActionInfo(selectedLog.action).color)}>
                  {React.createElement(getActionInfo(selectedLog.action).icon, { className: "h-5 w-5" })}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Détails d'Action Auditée</span>
                  <h3 className="text-lg font-black text-primary uppercase italic leading-tight">
                    {getActionInfo(selectedLog.action).label}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Administrateur</span>
                      <p className="text-xs font-black text-primary uppercase truncate">{selectedLog.admin_email}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Adresse IP</span>
                      <p className="text-xs font-black text-primary truncate">{selectedLog.ip_address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Date</span>
                      <p className="text-xs font-medium text-primary">
                        {new Date(selectedLog.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Heure</span>
                      <p className="text-xs font-medium text-primary">
                        {new Date(selectedLog.created_at).toLocaleTimeString('fr-FR')} (UTC)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-2 block">Détails techniques (Données)</span>
                  <div className="bg-gray-900 text-gray-300 p-5 rounded-2xl font-mono text-[10px] overflow-x-auto border border-gray-800 shadow-inner max-h-60 overflow-y-auto">
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-6 py-3 bg-primary text-white font-black uppercase text-xs rounded-xl hover:bg-primary/90 transition-colors w-full"
                  >
                    Fermer l'Aperçu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
