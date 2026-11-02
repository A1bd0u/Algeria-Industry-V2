import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';
import {
  ArrowLeft, Clock, Download, Eye, Globe, Monitor, MousePointer, Search, Smartphone, User, Users, AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { adminFetch } from '../adminApi';

// Analytique détaillée : parcours des visiteurs, technologies, clics,
// sessions et fiche par compte. Réservé aux administrateurs.

type Row = { name: string; value: number; samples?: number };
type Tab = 'overview' | 'sessions' | 'events' | 'user';

const PERIODS = [
  { days: 1, label: '24 h' },
  { days: 7, label: '7 j' },
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
  { days: 365, label: '12 mois' },
];

const EVENT_LABELS: Record<string, string> = {
  pageview: 'Page vue',
  page_leave: 'Sortie de page',
  click: 'Clic',
  search: 'Recherche',
  form_submit: 'Formulaire',
  outbound: 'Lien externe',
  download: 'Téléchargement',
  error: 'Erreur JS',
  custom: 'Événement',
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-DZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fmtDuration = (seconds: number) => {
  if (!seconds) return '0 s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`;
};

const downloadCsv = (name: string, rows: any[]) => {
  const flat = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v])));
  const blob = new Blob([Papa.unparse(flat)], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const Card = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-w-0">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const Kpi = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center gap-2 text-gray-500 mb-2">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-bold">{label}</span>
    </div>
    <p className="text-2xl font-black text-primary tabular-nums">{value}</p>
  </div>
);

// Liste classée avec barre proportionnelle.
const Ranking = ({ rows, unit, empty = 'Aucune donnée' }: { rows?: Row[]; unit?: string; empty?: string }) => {
  if (!rows?.length) return <p className="text-sm text-gray-400">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.name} className="relative">
          <div className="absolute inset-y-0 start-0 bg-secondary/10 rounded-md" style={{ width: `${(r.value / max) * 100}%` }} />
          <div className="relative flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
            <span className="truncate text-gray-700" title={r.name}>{r.name}</span>
            <span className="font-bold tabular-nums text-primary shrink-0">
              {r.value.toLocaleString('fr-DZ')}{unit ? ` ${unit}` : ''}
              {r.samples != null && <span className="text-xs text-gray-400 font-normal"> ({r.samples})</span>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

const EventBadge = ({ type }: { type: string }) => (
  <span className={cn(
    'inline-block px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap',
    type === 'pageview' ? 'bg-blue-50 text-blue-700'
      : type === 'click' ? 'bg-emerald-50 text-emerald-700'
      : type === 'error' ? 'bg-red-50 text-red-700'
      : type === 'search' ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-600'
  )}>
    {EVENT_LABELS[type] || type}
  </span>
);

// Chronologie d'événements (session ou compte).
const Timeline = ({ events }: { events: any[] }) => {
  if (!events.length) return <p className="text-sm text-gray-400">Aucun événement.</p>;
  return (
    <ol className="divide-y divide-gray-100">
      {events.map((e) => (
        <li key={e.id} className="py-2.5 flex flex-wrap items-start gap-x-3 gap-y-1 text-sm">
          <span className="text-xs text-gray-400 tabular-nums w-36 shrink-0">{fmtDateTime(e.created_at)}</span>
          <EventBadge type={e.event_type} />
          <span className="font-mono text-xs text-gray-700 break-all">{e.path}</span>
          {e.label && <span className="text-gray-900">« {e.label} »</span>}
          {e.target && <span className="text-xs text-gray-500 break-all">→ {e.target}</span>}
          {e.duration_ms != null && <span className="text-xs text-gray-500">{fmtDuration(Math.round(e.duration_ms / 1000))}</span>}
          {e.scroll_depth != null && <span className="text-xs text-gray-500">défilement {e.scroll_depth} %</span>}
          {e.referrer && <span className="text-xs text-gray-500">depuis {e.referrer}</span>}
        </li>
      ))}
    </ol>
  );
};

function Overview({ days }: { days: number }) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['insights-overview', days],
    queryFn: () => adminFetch(`/api/admin/insights/overview?days=${days}`),
  });
  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Analytique indisponible.</p>;
  const t = data.totals;

  return (
    <div className="space-y-6">
      {data.truncated && (
        <p className="text-xs text-orange-600">Période très chargée : les calculs portent sur les 50 000 premiers événements.</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <Kpi label="Pages vues" value={t.pageviews.toLocaleString('fr-DZ')} icon={Eye} />
        <Kpi label="Visites (sessions)" value={t.sessions.toLocaleString('fr-DZ')} icon={Users} />
        <Kpi label="Visiteurs identifiés" value={t.visitors.toLocaleString('fr-DZ')} icon={User} />
        <Kpi label="Comptes actifs" value={t.users.toLocaleString('fr-DZ')} icon={User} />
        <Kpi label="Durée moyenne" value={fmtDuration(t.avgSessionSeconds)} icon={Clock} />
        <Kpi label="Pages / visite" value={t.pagesPerSession} icon={Eye} />
        <Kpi label="Taux de rebond" value={`${t.bounceRate} %`} icon={ArrowLeft} />
        <Kpi label="Consentement" value={`${t.consentRate} %`} icon={Globe} />
        <Kpi label="Événements" value={t.events.toLocaleString('fr-DZ')} icon={MousePointer} />
        <Kpi label="Erreurs JS" value={t.errors} icon={AlertTriangle} />
      </div>

      <Card
        title="Trafic par jour"
        action={(
          <button onClick={() => downloadCsv(`trafic-${days}j.csv`, data.daily)} className="text-xs font-bold text-secondary flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        )}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="pageviews" name="Pages vues" stroke="#0f766e" fill="#0f766e22" />
              <Area type="monotone" dataKey="sessions" name="Visites" stroke="#1e3a8a" fill="#1e3a8a22" />
              <Area type="monotone" dataKey="clicks" name="Clics" stroke="#d97706" fill="#d9770622" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Pages vues par heure (UTC)">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Pages vues" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Pages les plus vues"><Ranking rows={data.pages} /></Card>
        <Card title="Parcours (page → page suivante)"><Ranking rows={data.flows} /></Card>
        <Card title="Pages d'entrée"><Ranking rows={data.entries} /></Card>
        <Card title="Pages de sortie"><Ranking rows={data.exits} /></Card>
        <Card title="Temps médian par page"><Ranking rows={data.timeOnPage} unit="s" /></Card>
        <Card title="Défilement moyen par page"><Ranking rows={data.scrollDepth} unit="%" /></Card>
        <Card title="Éléments les plus cliqués"><Ranking rows={data.clicks} /></Card>
        <Card title="Recherches"><Ranking rows={data.searches} /></Card>
        <Card title="Liens externes et téléchargements"><Ranking rows={data.outbound} /></Card>
        <Card title="Sources (référents)"><Ranking rows={data.referrers} empty="Accès direct uniquement" /></Card>
        <Card title="Navigateurs"><Ranking rows={data.browsers} /></Card>
        <Card title="Versions de navigateur"><Ranking rows={data.browserVersions} /></Card>
        <Card title="Systèmes"><Ranking rows={data.os} /></Card>
        <Card title="Appareils"><Ranking rows={data.devices} /></Card>
        <Card title="Résolutions d'écran"><Ranking rows={data.screens} /></Card>
        <Card title="Langues du navigateur"><Ranking rows={data.languages} /></Card>
        <Card title="Pays"><Ranking rows={data.countries} /></Card>
        <Card title="Erreurs JavaScript"><Ranking rows={data.errors} empty="Aucune erreur" /></Card>
      </div>
    </div>
  );
}

function Sessions({ days, onOpenUser }: { days: number; onOpenUser: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery<any>({
    queryKey: ['insights-sessions', days],
    queryFn: () => adminFetch(`/api/admin/insights/sessions?days=${days}`),
  });
  const detail = useQuery<any>({
    queryKey: ['insights-session', open],
    queryFn: () => adminFetch(`/api/admin/insights/sessions/${open}`),
    enabled: !!open,
  });

  if (open) {
    return (
      <Card
        title={`Visite ${open.slice(0, 8)}…`}
        action={<button onClick={() => setOpen(null)} className="text-xs font-bold text-secondary flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Retour</button>}
      >
        {detail.isLoading ? <p className="text-sm text-gray-500">Chargement…</p> : <Timeline events={detail.data?.data || []} />}
      </Card>
    );
  }

  const rows: any[] = data?.data || [];
  return (
    <Card
      title={`${rows.length} visites`}
      action={rows.length ? (
        <button onClick={() => downloadCsv(`visites-${days}j.csv`, rows)} className="text-xs font-bold text-secondary flex items-center gap-1">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      ) : undefined}
    >
      {isLoading ? <p className="text-sm text-gray-500">Chargement…</p> : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-2 text-start font-bold">Début</th>
                <th className="px-3 py-2 text-start font-bold">Visiteur</th>
                <th className="px-3 py-2 text-start font-bold">Durée</th>
                <th className="px-3 py-2 text-start font-bold">Pages</th>
                <th className="px-3 py-2 text-start font-bold">Clics</th>
                <th className="px-3 py-2 text-start font-bold">Entrée</th>
                <th className="px-3 py-2 text-start font-bold">Appareil</th>
                <th className="px-3 py-2 text-start font-bold">Pays</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.sessionId} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(s.sessionId)}>
                  <td className="px-5 py-2 whitespace-nowrap tabular-nums">{fmtDateTime(s.start)}</td>
                  <td className="px-3 py-2">
                    {s.account ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenUser(s.userId); }}
                        className="text-secondary font-bold hover:underline text-start"
                      >
                        {s.account.name || s.account.email}
                      </button>
                    ) : <span className="text-gray-400">{s.visitorId ? `Visiteur ${s.visitorId.slice(0, 6)}` : 'Anonyme'}</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDuration(s.durationSeconds)}</td>
                  <td className="px-3 py-2 tabular-nums">{s.pageviews}</td>
                  <td className="px-3 py-2 tabular-nums">{s.clicks}</td>
                  <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate" title={s.entry || ''}>{s.entry || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{[s.device, s.os, s.browser].filter(Boolean).join(' · ')}</td>
                  <td className="px-3 py-2">{s.country || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Events({ days }: { days: number }) {
  const [type, setType] = useState('');
  const [path, setPath] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ days: String(days), page: String(page), limit: '100' });
  if (type) params.set('type', type);
  if (path) params.set('path', path);
  const { data, isLoading } = useQuery<any>({
    queryKey: ['insights-events', days, type, path, page],
    queryFn: () => adminFetch(`/api/admin/insights/events?${params}`),
  });
  const rows: any[] = data?.data || [];
  const pages = Math.max(1, Math.ceil((data?.total || 0) / 100));

  return (
    <Card
      title={`${(data?.total || 0).toLocaleString('fr-DZ')} événements`}
      action={rows.length ? (
        <button onClick={() => downloadCsv(`evenements-${days}j-p${page}.csv`, rows)} className="text-xs font-bold text-secondary flex items-center gap-1">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      ) : undefined}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <select aria-label="Type d'événement" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous les types</option>
          {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          aria-label="Filtrer par page"
          placeholder="Filtrer par page (ex. /products)"
          value={path}
          onChange={(e) => { setPath(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
        />
      </div>
      {isLoading ? <p className="text-sm text-gray-500">Chargement…</p> : <Timeline events={rows} />}
      <div className="flex items-center justify-between mt-4 text-sm">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Précédent</button>
        <span className="text-gray-500">Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Suivant</button>
      </div>
    </Card>
  );
}

export function UserProfile({ userId, onBack }: { userId: string; onBack?: () => void }) {
  const [tab, setTab] = useState<'nav' | 'actions'>('nav');
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['insights-user', userId],
    queryFn: () => adminFetch(`/api/admin/insights/users/${userId}`),
  });
  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Fiche indisponible.</p>;
  const u = data.user;
  const s = data.summary;
  return (
    <div className="space-y-4">
      <Card
        title="Compte"
        action={onBack ? <button onClick={onBack} className="text-xs font-bold text-secondary flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Retour</button> : undefined}
      >
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p><span className="text-gray-500">Nom : </span><b>{u.name || '—'}</b></p>
          <p><span className="text-gray-500">E-mail : </span>{u.email}</p>
          <p><span className="text-gray-500">Rôle : </span>{u.role}</p>
          <p><span className="text-gray-500">Entreprise : </span>{u.company || '—'}</p>
          <p><span className="text-gray-500">Inscrit le : </span>{u.created_at ? fmtDateTime(u.created_at) : '—'}</p>
          <p><span className="text-gray-500">Dernière activité : </span>{s.lastSeen ? fmtDateTime(s.lastSeen) : '—'}</p>
          <p><span className="text-gray-500">E-mail vérifié : </span>{u.email_verified ? 'oui' : 'non'}</p>
          <p><span className="text-gray-500">Double authentification : </span>{u.mfa_enabled ? 'oui' : 'non'}</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">Navigation visible uniquement pour les visites où les cookies de mesure ont été acceptés (90 derniers jours).</p>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Visites" value={s.sessions} icon={Users} />
        <Kpi label="Événements" value={s.events} icon={MousePointer} />
        <Kpi label="Actions serveur" value={s.actions} icon={Monitor} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Pages consultées"><Ranking rows={s.topPages} /></Card>
        <Card title="Appareils utilisés"><Ranking rows={s.devices} /></Card>
      </div>
      <div className="flex gap-2">
        {(['nav', 'actions'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider', tab === k ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600')}>
            {k === 'nav' ? 'Navigation' : 'Actions et erreurs'}
          </button>
        ))}
      </div>
      {tab === 'nav' ? (
        <Card title="Chronologie de navigation" action={<button onClick={() => downloadCsv(`navigation-${userId}.csv`, data.events)} className="text-xs font-bold text-secondary flex items-center gap-1"><Download className="h-3.5 w-3.5" /> CSV</button>}>
          <Timeline events={data.events} />
        </Card>
      ) : (
        <Card title="Journal des actions" action={<button onClick={() => downloadCsv(`actions-${userId}.csv`, data.activity)} className="text-xs font-bold text-secondary flex items-center gap-1"><Download className="h-3.5 w-3.5" /> CSV</button>}>
          <ActivityList rows={data.activity} />
        </Card>
      )}
    </div>
  );
}

export const ActivityList = ({ rows, onOpenUser }: { rows: any[]; onOpenUser?: (id: string) => void }) => {
  if (!rows.length) return <p className="text-sm text-gray-400">Aucune entrée.</p>;
  return (
    <ol className="divide-y divide-gray-100">
      {rows.map((l) => (
        <li key={l.id} className="py-2.5 flex flex-wrap items-start gap-x-3 gap-y-1 text-sm">
          <span className="text-xs text-gray-400 tabular-nums w-36 shrink-0">{fmtDateTime(l.created_at)}</span>
          <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold', l.level === 'error' ? 'bg-red-50 text-red-700' : l.level === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600')}>
            {l.level === 'error' ? 'Erreur' : l.level === 'warn' ? 'Alerte' : 'Info'}
          </span>
          <span className="text-xs font-bold uppercase text-gray-500">{l.category}</span>
          <span className="font-bold text-gray-900">{l.action}</span>
          {l.status != null && <span className="text-xs tabular-nums text-gray-500">HTTP {l.status}</span>}
          {l.duration_ms != null && <span className="text-xs tabular-nums text-gray-500">{l.duration_ms} ms</span>}
          {l.account && (
            onOpenUser
              ? <button onClick={() => onOpenUser(l.user_id)} className="text-xs text-secondary font-bold hover:underline">{l.account.name || l.account.email}</button>
              : <span className="text-xs text-gray-600">{l.account.email}</span>
          )}
          {l.details?.code && <span className="text-xs font-mono text-red-600">{l.details.code}</span>}
          <span className="text-xs text-gray-400">{[l.device, l.os, l.browser, l.country].filter(Boolean).join(' · ')}</span>
          {l.path && <span className="w-full ps-[9.75rem] font-mono text-xs text-gray-400 break-all">{l.method} {l.path}</span>}
        </li>
      ))}
    </ol>
  );
};

function UserSearch({ onOpenUser }: { onOpenUser: (id: string) => void }) {
  const [q, setQ] = useState('');
  const { data, isFetching } = useQuery<any>({
    queryKey: ['insights-user-search', q],
    queryFn: () => adminFetch(`/api/admin/insights/users/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
  });
  return (
    <Card title="Rechercher un compte">
      <div className="relative mb-4">
        <Search className="h-4 w-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          aria-label="Rechercher un compte"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, e-mail ou entreprise"
          className="w-full border border-gray-200 rounded-lg ps-9 pe-3 py-2 text-sm"
        />
      </div>
      {isFetching && <p className="text-sm text-gray-500">Recherche…</p>}
      <ul className="divide-y divide-gray-100">
        {(data?.data || []).map((u: any) => (
          <li key={u.id}>
            <button onClick={() => onOpenUser(u.id)} className="w-full text-start py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 px-2 rounded-lg">
              <span className="min-w-0">
                <span className="block font-bold text-sm truncate">{u.name || u.email}</span>
                <span className="block text-xs text-gray-500 truncate">{u.email}{u.company ? ` · ${u.company}` : ''}</span>
              </span>
              <span className="text-xs text-gray-400 shrink-0">{u.role}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function GovInsights() {
  const [tab, setTab] = useState<Tab>('overview');
  const [days, setDays] = useState(7);
  const [userId, setUserId] = useState<string | null>(null);

  const openUser = (id: string) => { setUserId(id); setTab('user'); };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: Eye },
    { id: 'sessions', label: 'Visites', icon: Users },
    { id: 'events', label: 'Événements', icon: MousePointer },
    { id: 'user', label: 'Par compte', icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'user') setUserId(null); }}
              className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2', tab === t.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600')}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
        {tab !== 'user' && (
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', days === p.days ? 'bg-secondary text-white' : 'text-gray-600')}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'overview' && <Overview days={days} />}
      {tab === 'sessions' && <Sessions days={days} onOpenUser={openUser} />}
      {tab === 'events' && <Events days={days} />}
      {tab === 'user' && (userId
        ? <UserProfile userId={userId} onBack={() => setUserId(null)} />
        : <UserSearch onOpenUser={openUser} />)}

      <p className="text-xs text-gray-400">
        Sans accord aux cookies de mesure, les visites restent anonymes (aucun identifiant ni compte rattaché). Aucune adresse IP n'est conservée. Données supprimées après 13 mois.
      </p>
    </div>
  );
}
