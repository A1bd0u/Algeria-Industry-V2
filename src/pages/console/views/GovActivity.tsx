import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, Search } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../../../lib/utils';
import { adminFetch } from '../adminApi';
import { ActivityList, UserProfile } from './GovInsights';

// Journal d'activité : connexions, inscriptions, écritures via l'API et
// erreurs serveur, avec le compte, l'appareil, le statut et la durée.

const CATEGORIES = ['auth', 'messages', 'products', 'companies', 'kyc', 'billing', 'upload', 'favorites', 'contact', 'admin', 'users'];
const PERIODS = [1, 7, 30, 90];

export default function GovActivity() {
  const [days, setDays] = useState(7);
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  const params = new URLSearchParams({ days: String(days), page: String(page), limit: '100' });
  if (level) params.set('level', level);
  if (category) params.set('category', category);
  if (q.trim()) params.set('q', q.trim());

  const { data, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ['activity-logs', days, level, category, q, page],
    queryFn: () => adminFetch(`/api/admin/insights/activity?${params}`),
    refetchInterval: 30000,
    enabled: !userId,
  });

  if (userId) return <UserProfile userId={userId} onBack={() => setUserId(null)} />;

  const rows: any[] = data?.data || [];
  const pages = Math.max(1, Math.ceil((data?.total || 0) / 100));

  const exportCsv = () => {
    const flat = rows.map((r) => ({ ...r, details: JSON.stringify(r.details || {}), account: r.account?.email || '' }));
    const blob = new Blob([Papa.unparse(flat)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `journal-activite-${days}j-p${page}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
          {PERIODS.map((d) => (
            <button key={d} onClick={() => { setDays(d); setPage(1); }} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', days === d ? 'bg-secondary text-white' : 'text-gray-600')}>
              {d === 1 ? '24 h' : `${d} j`}
            </button>
          ))}
        </div>
        <select aria-label="Niveau" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous niveaux</option>
          <option value="info">Info</option>
          <option value="warn">Alertes (4xx)</option>
          <option value="error">Erreurs (5xx)</option>
        </select>
        <select aria-label="Catégorie" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-4 w-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            aria-label="Rechercher une action"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Action ou chemin (ex. Connexion, /api/products)"
            className="w-full border border-gray-200 rounded-lg ps-9 pe-3 py-2 text-sm"
          />
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-gray-200" aria-label="Actualiser">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
        <button onClick={exportCsv} disabled={!rows.length} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 disabled:opacity-40">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
          {(data?.total || 0).toLocaleString('fr-DZ')} entrées
        </p>
        {isLoading ? <p className="text-sm text-gray-500">Chargement…</p> : <ActivityList rows={rows} onOpenUser={setUserId} />}
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Précédent</button>
          <span className="text-gray-500">Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Suivant</button>
        </div>
      </section>
      <p className="text-xs text-gray-400">Écritures via l'API et réponses en erreur. Sans adresse IP ni contenu des requêtes. Conservé 13 mois.</p>
    </div>
  );
}
