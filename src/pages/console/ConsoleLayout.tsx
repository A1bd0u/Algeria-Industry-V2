import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, Building2, CheckCircle, CreditCard, ExternalLink,
  LayoutDashboard, Lock, LogOut, Menu, MessageSquare, Newspaper, PackagePlus,
  ShieldCheck, Users, X, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from './adminApi';

import GovAnalytics from './views/GovAnalytics';
import GovRevenue from './views/GovRevenue';
import GovAds from './views/GovAds';
import GovSecurity from './views/GovSecurity';
import GovOverview from './views/GovOverview';
import GovCompanies from './views/GovCompanies';
import GovModeration from './views/GovModeration';
import GovSupport from './views/GovSupport';
import GovUsers from './views/GovUsers';
import GovProducts from './views/GovProducts';
import SiteCms from './views/SiteCms';

type PendingKey = 'kyc' | 'support' | 'ads' | 'reports' | 'invoices';

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  pendingKey?: PendingKey;
}

const MENU: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { id: 'gov-overview', name: "Vue d'ensemble", icon: LayoutDashboard },
      { id: 'gov-analytics', name: 'Analytique', icon: BarChart3 },
      { id: 'gov-revenue', name: 'Abonnements', icon: CreditCard, pendingKey: 'invoices' },
    ],
  },
  {
    title: 'Validation',
    items: [
      { id: 'gov-companies', name: 'KYC & entreprises', icon: Building2, pendingKey: 'kyc' },
      { id: 'gov-moderation', name: 'Signalements', icon: AlertTriangle, pendingKey: 'reports' },
      { id: 'gov-ads', name: 'Publicités', icon: Zap, pendingKey: 'ads' },
      { id: 'gov-support', name: 'Support', icon: MessageSquare, pendingKey: 'support' },
    ],
  },
  {
    title: 'Plateforme',
    items: [
      { id: 'gov-users', name: 'Comptes & accès', icon: Users },
      { id: 'gov-products', name: 'Catalogue produits', icon: PackagePlus },
      { id: 'site-cms', name: 'Blog', icon: Newspaper },
      { id: 'gov-security', name: "Journal d'audit", icon: Lock },
    ],
  },
];

export default function ConsoleLayout({ state }: { state: any }) {
  const { activeTab, setActiveTab, notification, logout, navigate } = state;
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Compteurs rafraîchis toutes les minutes : ce qui attend une action admin.
  const { data: pending } = useQuery<Record<PendingKey, number>>({
    queryKey: ['admin-pending-counts', activeTab],
    queryFn: () => adminFetch('/api/admin/pending-counts'),
    refetchInterval: 60000,
  });

  const totalPending = pending ? Object.values(pending).reduce((a, b) => a + Number(b || 0), 0) : 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'gov-overview': return <GovOverview state={state} />;
      case 'gov-analytics': return <GovAnalytics state={state} />;
      case 'gov-revenue': return <GovRevenue state={state} />;
      case 'gov-companies': return <GovCompanies state={state} />;
      case 'gov-moderation': return <GovModeration state={state} />;
      case 'gov-ads': return <GovAds state={state} />;
      case 'gov-support': return <GovSupport state={state} />;
      case 'gov-users': return <GovUsers state={state} />;
      case 'gov-products': return <GovProducts state={state} />;
      case 'site-cms': return <SiteCms state={state} />;
      case 'gov-security': return <GovSecurity state={state} />;
      default: return <GovOverview state={state} />;
    }
  };

  const activeItem = MENU.flatMap((s) => s.items).find((i) => i.id === activeTab);
  const initials = (user?.name || 'A').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const sidebar = (
    <nav aria-label="Menu de la console" className="flex flex-col h-full">
      <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="mb-8 p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
            <ShieldCheck className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Console admin</p>
            <p className="text-xs font-black uppercase text-white">Algeria Industry</p>
          </div>
        </div>

        <div className="space-y-8">
          {MENU.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4 mb-3">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const count = item.pendingKey && pending ? Number(pending[item.pendingKey] || 0) : 0;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-start',
                        active ? 'bg-secondary text-white shadow-lg' : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-white/30')} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {count > 0 && (
                        <span className={cn('min-w-[20px] h-5 px-1.5 rounded-full text-[10px] flex items-center justify-center', active ? 'bg-white text-secondary' : 'bg-secondary text-white')}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-white/5 space-y-3">
        <Link to="/" className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5">
          <ExternalLink className="h-4 w-4" /> Voir le site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-error text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 hover:bg-error/10"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Menu latéral : fixe sur grand écran, tiroir sur mobile */}
      <aside className="hidden lg:block w-72 bg-[#0a0a0a] sticky top-0 h-screen shrink-0">{sidebar}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 start-0 w-72 bg-[#0a0a0a] z-50 lg:hidden">
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between gap-4 mb-8 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-4 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg bg-gray-50" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Console admin</p>
                <h1 className="text-sm font-black uppercase text-primary truncate">{activeItem?.name || "Vue d'ensemble"}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {totalPending > 0 && (
                <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                  {totalPending} tâche{totalPending > 1 ? 's' : ''} en attente
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">{initials}</div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-[11px] font-black text-primary">{user?.name}</p>
                  <p className="text-[10px] text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {notification && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-6 inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3',
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span className="text-xs font-bold">{notification.message}</span>
            <button onClick={() => state.setNotification(null)} aria-label="Fermer" className="ms-2"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
