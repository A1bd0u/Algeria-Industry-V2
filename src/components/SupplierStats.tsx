import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '../lib/utils';
import { currentLocale, formatNumber } from '../lib/format';

// Statistiques du fournisseur selon son offre : rien en gratuit, vues en
// Basic, vues + clics WhatsApp + téléchargements + contacts en Pro.
// Deux séries de même unité (vues par jour) sur un seul axe ; couleurs
// validées pour la lisibilité daltonienne.
const SERIES = [
  { key: 'companyViews', color: '#2a5bd7' },
  { key: 'productViews', color: '#e8590c' },
] as const;

const PERIODS = [7, 30, 90] as const;

type Stats = {
  plan: string;
  level: 'none' | 'basic' | 'advanced';
  days: number;
  totals?: Record<string, number>;
  daily?: { day: string; companyViews: number; productViews: number; whatsappClicks?: number }[];
  topProducts?: { id: string; name: string; views: number }[];
};

const Tile = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-3xl font-black text-primary mt-2 tabular-nums">{formatNumber(value)}</p>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

export default function SupplierStats() {
  const { t } = useTranslation();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ['supplier-stats', days],
    queryFn: async () => {
      const res = await fetch(`/api/stats/supplier?days=${days}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error('stats'), { code: body?.code });
      return body;
    },
  });

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-500" /></div>;
  }
  if ((error as any)?.code === 'COMPANY_REQUIRED') {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center">
        <p className="text-gray-600 mb-4">{t('supplierStats.companyRequired')}</p>
        <Link to="/dashboard?tab=company" className="btn-primary">{t('supplierStats.completeCompany')}</Link>
      </div>
    );
  }
  if (error || !data) {
    return <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-sm">{t('supplierStats.loadError')}</div>;
  }

  if (data.level === 'none') {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center max-w-2xl mx-auto">
        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-black text-primary mb-2">{t('supplierStats.lockedTitle')}</h3>
        <p className="text-gray-600 mb-6">{t('supplierStats.lockedText')}</p>
        <Link to="/dashboard?tab=subscription" className="btn-primary">{t('supplierStats.upgrade')}</Link>
      </div>
    );
  }

  const totals = data.totals || {};
  const advanced = data.level === 'advanced';
  const dayLabel = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const hasViews = (totals.companyViews || 0) + (totals.productViews || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary">{t('supplierStats.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('supplierStats.subtitle')}</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label={t('supplierStats.period')}>
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={cn('px-3 py-1.5 text-xs font-bold rounded-md transition-colors', days === p ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary')}
            >
              {t('supplierStats.days', { count: p })}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('grid gap-4', advanced ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2')}>
        <Tile label={t('supplierStats.companyViews')} value={totals.companyViews || 0} />
        <Tile label={t('supplierStats.productViews')} value={totals.productViews || 0} />
        {advanced && (
          <>
            <Tile label={t('supplierStats.whatsappClicks')} value={totals.whatsappClicks || 0} />
            <Tile label={t('supplierStats.catalogueDownloads')} value={totals.catalogueDownloads || 0} />
            <Tile label={t('supplierStats.contacts')} value={totals.contacts || 0} hint={t('supplierStats.contactsHint')} />
          </>
        )}
      </div>

      <section className="bg-white p-6 rounded-2xl border border-gray-100">
        <h4 className="font-bold text-primary mb-4">{t('supplierStats.chartTitle')}</h4>
        {hasViews ? (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#eceae6" vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(d) => dayLabel(String(d))}
                  formatter={(value, name) => [formatNumber(Number(value)), t(`supplierStats.${String(name)}`)]}
                  cursor={{ stroke: '#9b9a95', strokeWidth: 1 }}
                />
                <Legend formatter={(name) => <span className="text-xs text-gray-600">{t(`supplierStats.${String(name)}`)}</span>} />
                {SERIES.map((s) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-10 text-center">{t('supplierStats.noViews')}</p>
        )}
      </section>

      {advanced ? (
        <section className="bg-white p-6 rounded-2xl border border-gray-100">
          <h4 className="font-bold text-primary mb-4">{t('supplierStats.topProducts')}</h4>
          {(data.topProducts || []).length === 0 ? (
            <p className="text-sm text-gray-500">{t('supplierStats.noTopProducts')}</p>
          ) : (
            <ol className="divide-y divide-gray-100">
              {data.topProducts!.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <span className="w-6 text-xs font-bold text-gray-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 min-w-0 truncate font-bold text-primary">{p.name}</span>
                  <span className="text-sm text-gray-600 tabular-nums">{t('supplierStats.views', { count: p.views })}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">{t('supplierStats.advancedHint')}</p>
          <Link to="/dashboard?tab=subscription" className="btn-ghost shrink-0">{t('supplierStats.upgradePro')}</Link>
        </div>
      )}

      <p className="text-xs text-gray-500">{t('supplierStats.privacy')}</p>
    </div>
  );
}
