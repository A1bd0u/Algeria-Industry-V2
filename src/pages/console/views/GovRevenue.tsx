import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle, CreditCard, FileText, Loader2, Paperclip, Plus, Search, X, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { adminFetch, formatDate, formatDzd } from '../adminApi';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic — 18 000 DA/an',
  pro: 'Pro — 29 900 DA/an',
  founder: 'Membre fondateur — offert 12 mois',
};

const METHOD_LABELS: Record<string, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  gratuit: 'Offert',
  cib_edahabia: 'CIB / Edahabia en ligne',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente de paiement', className: 'bg-orange-50 text-orange-600' },
  active: { label: 'Actif', className: 'bg-emerald-50 text-emerald-600' },
  expired: { label: 'Échu', className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-500' },
};

const FILTERS = [
  { id: '', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'active', label: 'Actifs' },
  { id: 'expired', label: 'Échus' },
  { id: 'cancelled', label: 'Annulés' },
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Recherche d'une entreprise revendiquée à facturer.
function CompanyPicker({ onSelect }: { onSelect: (c: any) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['admin-company-search', debounced],
    queryFn: async () => (await adminFetch(`/api/admin/companies/search?q=${encodeURIComponent(debounced)}`)).data || [],
    enabled: debounced.length >= 2,
  });

  return (
    <div className="space-y-2">
      <label htmlFor="billing_company" className="text-xs font-black text-gray-500 uppercase tracking-widest">Entreprise</label>
      <div className="relative">
        <Search className="h-4 w-4 text-gray-500 absolute start-4 top-1/2 -translate-y-1/2" />
        <input
          id="billing_company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom (2 lettres minimum)"
          className="w-full ps-10 pe-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-secondary"
        />
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-500 absolute end-4 top-1/2 -translate-y-1/2" />}
      </div>
      {results.length > 0 && (
        <ul className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {results.map((c: any) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={!c.owner_id}
                onClick={() => { onSelect(c); setQuery(''); }}
                className="w-full text-start px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-bold text-sm text-primary">{c.name}</span>
                <span className="block text-xs text-gray-500">
                  {[c.wilaya, c.status === 'approved' ? 'KYC approuvé' : 'KYC non approuvé', c.plan !== 'free' ? `Plan ${c.plan} jusqu'au ${formatDate(c.plan_ends_at)}` : null, !c.owner_id ? 'fiche non revendiquée' : null].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GovRevenue({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [plan, setPlan] = useState<'basic' | 'pro' | 'founder'>('basic');
  const [notes, setNotes] = useState('');
  const [activating, setActivating] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'virement' | 'cheque' | 'gratuit'>('virement');
  const [paymentReference, setPaymentReference] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['admin-billing-summary'],
    queryFn: () => adminFetch('/api/admin/billing/summary'),
  });

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-billing', filter],
    queryFn: async () => (await adminFetch(`/api/admin/billing${filter ? `?status=${filter}` : ''}`)).data || [],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-billing'] });
    queryClient.invalidateQueries({ queryKey: ['admin-billing-summary'] });
  };

  const createMutation = useMutation({
    mutationFn: () => adminFetch('/api/admin/billing', {
      method: 'POST',
      body: JSON.stringify({ company_id: company.id, plan, notes: notes || undefined }),
    }),
    onSuccess: (sub: any) => {
      showNotify(`Facture ${sub.invoice_number} émise.`, 'success');
      setShowCreate(false);
      setCompany(null);
      setNotes('');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const activateMutation = useMutation({
    mutationFn: () => adminFetch(`/api/admin/billing/${activating.id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod, payment_reference: paymentReference || undefined }),
    }),
    onSuccess: () => {
      showNotify('Paiement enregistré, abonnement activé pour 12 mois.', 'success');
      setActivating(null);
      setPaymentReference('');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminFetch(`/api/admin/billing/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    onSuccess: () => {
      showNotify('Abonnement annulé.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const openActivate = (sub: any) => {
    setActivating(sub);
    setPaymentMethod(Number(sub.amount_dzd) > 0 ? 'virement' : 'gratuit');
    setPaymentReference('');
  };

  // Le justificatif est dans le stockage privé : on demande une URL signée.
  const openProof = async (sub: any) => {
    const proofWindow = window.open('', '_blank');
    if (proofWindow) proofWindow.opener = null;
    try {
      const { url } = await adminFetch(`/api/admin/billing/${sub.id}/proof`);
      if (proofWindow) proofWindow.location.href = url;
      else window.location.assign(url);
    } catch (err: any) {
      proofWindow?.close();
      showNotify(err.message || 'Justificatif indisponible', 'error');
    }
  };

  const askCancel = (sub: any) => {
    const reason = window.prompt(`Motif d'annulation de ${sub.invoice_number} :`);
    if (reason && reason.trim().length >= 3) {
      cancelMutation.mutate({ id: sub.id, reason: reason.trim() });
    }
  };

  const kpis = [
    { label: 'Encaissé ce mois', value: formatDzd(summary?.revenueMonth) },
    { label: `Encaissé en ${new Date().getFullYear()}`, value: formatDzd(summary?.revenueYear) },
    {
      label: 'Abonnements actifs',
      value: String(summary?.activeCount ?? '—'),
      detail: summary ? `Basic ${summary.activeByPlan.basic} · Pro ${summary.activeByPlan.pro} · Fondateurs ${summary.activeByPlan.founder}` : '',
    },
    {
      label: 'Factures en attente',
      value: String(summary?.pendingCount ?? '—'),
      detail: summary ? `${formatDzd(summary.pendingAmount)} à encaisser` : '',
    },
  ];

  const maxMonth = Math.max(1, ...((summary?.revenueByMonth || []).map((m: any) => m.amount)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary">Abonnements & facturation</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Paiement par facture et virement : émettez la facture, puis activez l'abonnement à réception du paiement.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-secondary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-4 w-4" /> Nouvelle facture
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">{k.label}</p>
            <p className="text-2xl font-black text-primary">{k.value}</p>
            {k.detail && <p className="text-xs text-gray-500 mt-2">{k.detail}</p>}
          </div>
        ))}
      </div>

      {summary?.revenueByMonth?.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-6">Encaissements {new Date().getFullYear()}</h4>
          <div className="flex items-end gap-3 h-40">
            {summary.revenueByMonth.map((m: any) => (
              <div key={m.month} className="flex-1 h-full flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-secondary/80 rounded-t-lg min-h-[2px]"
                    style={{ height: `${(m.amount / maxMonth) * 100}%` }}
                    title={formatDzd(m.amount)}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500">{MONTHS[m.month]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest',
                filter === f.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4 text-start">Facture</th>
                <th className="px-6 py-4 text-start">Entreprise</th>
                <th className="px-6 py-4 text-start">Offre</th>
                <th className="px-6 py-4 text-start">Montant TTC</th>
                <th className="px-6 py-4 text-start">Période</th>
                <th className="px-6 py-4 text-start">Statut</th>
                <th className="px-6 py-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              )}
              {!isLoading && subscriptions.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Aucune facture pour ce filtre.</td></tr>
              )}
              {subscriptions.map((sub: any) => {
                const status = STATUS_LABELS[sub.status] || { label: sub.status, className: 'bg-gray-100' };
                return (
                  <tr key={sub.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{sub.invoice_number}<span className="block font-sans font-normal text-gray-500">{formatDate(sub.created_at)}</span>{sub.source === 'self_service' && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-sans text-xs font-black">Souscrite par le client</span>}</td>
                    <td className="px-6 py-4"><span className="font-bold text-primary">{sub.company?.name || '—'}</span><span className="block text-gray-500">{sub.user?.email}</span></td>
                    <td className="px-6 py-4 capitalize">{sub.plan === 'founder' ? 'Fondateur' : sub.plan}</td>
                    <td className="px-6 py-4 font-bold">{formatDzd(sub.amount_dzd)}</td>
                    <td className="px-6 py-4 text-gray-600">{sub.starts_at ? `${formatDate(sub.starts_at)} → ${formatDate(sub.ends_at)}` : '—'}</td>
                    <td className="px-6 py-4"><span className={cn('px-2.5 py-1 rounded-full text-xs font-black', status.className)}>{status.label}</span>{sub.payment_method && sub.status !== 'pending' && <span className="block mt-1 text-gray-500">{METHOD_LABELS[sub.payment_method] || sub.payment_method}</span>}{sub.status === 'pending' && sub.transfer_proof_uploaded_at && <span className="block mt-1 text-amber-700 font-bold">Justificatif reçu</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/api/admin/billing/${sub.id}/invoice`}
                          target="_blank"
                          rel="noopener"
                          className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:text-primary"
                          title="Voir / imprimer la facture"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                        {sub.transfer_proof_path && (
                          <button onClick={() => openProof(sub)} className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100" title="Voir le justificatif de virement">
                            <Paperclip className="h-4 w-4" />
                          </button>
                        )}
                        {sub.status === 'pending' && (
                          <button onClick={() => openActivate(sub)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Enregistrer le paiement et activer">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {['pending', 'active'].includes(sub.status) && (
                          <button onClick={() => askCancel(sub)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Annuler">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Nouvelle facture">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-primary">Nouvelle facture</h4>
              <button onClick={() => setShowCreate(false)} aria-label="Fermer"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            {company ? (
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-primary">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.status === 'approved' ? 'KYC approuvé' : 'Attention : KYC non approuvé'}</p>
                </div>
                <button onClick={() => setCompany(null)} className="text-xs font-black text-secondary uppercase">Changer</button>
              </div>
            ) : (
              <CompanyPicker onSelect={setCompany} />
            )}
            <div className="space-y-2">
              <label htmlFor="billing_plan" className="text-xs font-black text-gray-500 uppercase tracking-widest">Offre</label>
              <select id="billing_plan" value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm">
                {Object.entries(PLAN_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="billing_notes" className="text-xs font-black text-gray-500 uppercase tracking-widest">Note interne (optionnelle)</label>
              <textarea id="billing_notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm resize-none" />
            </div>
            <button
              disabled={!company || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="w-full bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Émettre la facture
            </button>
          </div>
        </div>
      )}

      {activating && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Activer l'abonnement">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-primary">Paiement reçu</h4>
              <button onClick={() => setActivating(null)} aria-label="Fermer"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600">
              Facture <strong>{activating.invoice_number}</strong> — {activating.company?.name} — <strong>{formatDzd(activating.amount_dzd)}</strong>.
              L'abonnement sera actif 12 mois (à la suite de l'abonnement en cours s'il y en a un).
            </p>
            <div className="space-y-2">
              <label htmlFor="payment_method" className="text-xs font-black text-gray-500 uppercase tracking-widest">Mode de paiement</label>
              <select id="payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm">
                {Number(activating.amount_dzd) > 0 ? (
                  <>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                  </>
                ) : (
                  <option value="gratuit">Offert (membre fondateur)</option>
                )}
              </select>
            </div>
            {Number(activating.amount_dzd) > 0 && (
              <div className="space-y-2">
                <label htmlFor="payment_reference" className="text-xs font-black text-gray-500 uppercase tracking-widest">Référence du virement / n° de chèque</label>
                <input id="payment_reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
              </div>
            )}
            <button
              disabled={activateMutation.isPending || (Number(activating.amount_dzd) > 0 && !paymentReference.trim())}
              onClick={() => activateMutation.mutate()}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {activateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Activer l'abonnement
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
