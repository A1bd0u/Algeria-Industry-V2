import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Copy, CreditCard, FileText, Landmark, Loader2, Upload, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuit',
  basic: 'Basic',
  pro: 'Pro',
  founder: 'Membre fondateur',
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente de paiement', className: 'bg-orange-50 text-orange-600' },
  active: { label: 'Payée — active', className: 'bg-emerald-50 text-emerald-600' },
  expired: { label: 'Échue', className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Annulée', className: 'bg-red-50 text-red-500' },
};

const dzd = (v: number | string) => new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Number(v || 0)) + ' DA';
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

async function api<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as T;
}

// Espace abonnement du fournisseur : offre en cours, souscription, factures,
// virement (RIB + justificatif) et paiement en ligne CIB / Edahabia.
export default function SubscriptionPanel({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get('payment');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api('/api/subscriptions/me'),
    // Au retour d'un paiement en ligne, l'activation arrive par webhook : on rafraîchit un moment.
    refetchInterval: paymentReturn === 'success' ? 5000 : false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-subscription'] });

  const subscribe = useMutation({
    mutationFn: (plan: 'basic' | 'pro') => api('/api/subscriptions', { method: 'POST', body: JSON.stringify({ plan }) }),
    onSuccess: (sub: any) => {
      notify(`Facture ${sub.invoice_number} prête. Réglez-la par virement${data?.payment?.online ? ' ou en ligne' : ''}.`, 'success');
      refresh();
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const checkout = useMutation({
    mutationFn: (id: string) => api<{ checkoutUrl: string }>(`/api/subscriptions/${id}/checkout`, { method: 'POST' }),
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api(`/api/subscriptions/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      notify('Facture annulée.', 'success');
      refresh();
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const uploadProof = async (subId: string, file: File) => {
    setUploadingId(subId);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload?bucket=kyc-documents', { method: 'POST', body: form });
      const uploaded = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(uploaded.error || "Échec de l'envoi du fichier");
      await api(`/api/subscriptions/${subId}/transfer-proof`, { method: 'POST', body: JSON.stringify({ path: uploaded.path || uploaded.url }) });
      notify('Justificatif envoyé. Notre équipe activera votre abonnement dès vérification du virement.', 'success');
      refresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('Copié dans le presse-papier.', 'success');
    } catch {
      // presse-papier indisponible
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-400" /></div>;
  }
  if (error || !data) {
    return <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-sm">Impossible de charger votre abonnement. Réessayez plus tard.</div>;
  }

  const pending = data.subscriptions.filter((s: any) => s.status === 'pending');
  const history = data.subscriptions.filter((s: any) => s.status !== 'pending');
  const limit = data.limits.products;
  const usagePct = limit ? Math.min(100, Math.round((data.usage.products / limit) * 100)) : 0;
  const isPaidPlan = data.plan !== 'free';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {paymentReturn === 'success' && (
        <div role="status" className="p-5 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-3">
          <CheckCircle className="h-5 w-5 shrink-0" />
          Paiement reçu. Votre abonnement s'active dans quelques instants ; cette page se met à jour automatiquement.
        </div>
      )}
      {paymentReturn === 'failed' && (
        <div role="alert" className="p-5 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Le paiement n'a pas abouti. Aucun montant n'a été débité ; vous pouvez réessayer ou régler par virement.
        </div>
      )}

      {/* Offre en cours */}
      <section className="bg-primary p-8 sm:p-12 rounded-[40px] text-white">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Offre actuelle</span>
        <h3 className="text-4xl font-black uppercase italic tracking-tighter mt-3">{PLAN_NAMES[data.plan] || data.plan}</h3>
        <p className="text-white/70 mt-2">
          {isPaidPlan && data.planEndsAt ? `Valable jusqu'au ${date(data.planEndsAt)}.` : "Offre gratuite, sans engagement."}
        </p>
        <div className="mt-8 max-w-md">
          <div className="flex justify-between text-[11px] font-bold text-white/80 mb-2">
            <span>Produits publiés</span>
            <span>{data.usage.products}{limit ? ` / ${limit}` : ' (illimité)'}</span>
          </div>
          {limit && (
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', usagePct >= 100 ? 'bg-red-400' : 'bg-secondary')} style={{ width: `${usagePct}%` }} />
            </div>
          )}
        </div>
      </section>

      {/* Souscrire */}
      {data.plan !== 'pro' && data.plan !== 'founder' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['basic', 'pro'] as const).filter((p) => p !== data.plan).map((plan) => (
            <div key={plan} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
              <h4 className="text-xl font-black text-primary uppercase italic">{PLAN_NAMES[plan]}</h4>
              <p className="text-2xl font-black text-primary mt-2">{dzd(data.prices[plan])} <span className="text-xs font-bold text-gray-500">TTC / an</span></p>
              <p className="text-sm text-gray-600 mt-3 flex-1">
                {plan === 'basic' ? "15 produits, 5 images par produit, statistiques de base, support sous 48 h." : "Produits illimités, 10 images par produit, 3 mises en avant, statistiques avancées, support sous 24 h."}
              </p>
              <button
                onClick={() => subscribe.mutate(plan)}
                disabled={!data.canSubscribe || subscribe.isPending}
                className="mt-6 w-full btn-secondary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {subscribe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Choisir {PLAN_NAMES[plan]}
              </button>
            </div>
          ))}
          {!data.canSubscribe && (
            <p className="md:col-span-2 text-sm text-gray-600">
              Pour souscrire, vous devez être titulaire d'une fiche entreprise. <Link to="/kyc-upload" className="font-bold text-secondary underline">Faire vérifier mon entreprise</Link>
            </p>
          )}
        </section>
      )}

      {/* Factures à régler */}
      {pending.map((sub: any) => (
        <section key={sub.id} className="bg-white p-8 rounded-[32px] border-2 border-orange-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Facture à régler</p>
              <h4 className="text-xl font-black text-primary mt-1">{sub.invoice_number} — {PLAN_NAMES[sub.plan]}</h4>
              <p className="text-sm text-gray-600">{dzd(sub.amount_dzd)} TTC · émise le {date(sub.created_at)}</p>
            </div>
            <a href={`/api/subscriptions/${sub.id}/invoice`} target="_blank" rel="noopener" className="px-5 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 self-start">
              <FileText className="h-4 w-4" /> Voir la facture
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Virement */}
            <div className="p-6 rounded-2xl bg-gray-50 space-y-4">
              <h5 className="font-black text-primary flex items-center gap-2"><Landmark className="h-5 w-5" /> Par virement bancaire</h5>
              {data.payment.rib ? (
                <dl className="text-sm space-y-2">
                  {data.payment.beneficiary && <div><dt className="text-[10px] font-black uppercase text-gray-500">Bénéficiaire</dt><dd className="font-bold">{data.payment.beneficiary}</dd></div>}
                  <div>
                    <dt className="text-[10px] font-black uppercase text-gray-500">RIB</dt>
                    <dd className="font-mono font-bold flex items-center gap-2 break-all">{data.payment.rib}
                      <button onClick={() => copy(data.payment.rib)} aria-label="Copier le RIB" className="text-gray-400 hover:text-primary shrink-0"><Copy className="h-4 w-4" /></button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase text-gray-500">Référence à indiquer</dt>
                    <dd className="font-mono font-bold flex items-center gap-2">{sub.invoice_number}
                      <button onClick={() => copy(sub.invoice_number)} aria-label="Copier la référence" className="text-gray-400 hover:text-primary"><Copy className="h-4 w-4" /></button>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-600">Les coordonnées bancaires figurent sur la facture. <Link to="/contact" className="text-secondary font-bold underline">Contactez-nous</Link> en cas de question.</p>
              )}
              <div className="pt-2">
                {sub.transfer_proof_uploaded_at ? (
                  <p className="text-sm text-emerald-700 font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Justificatif reçu le {date(sub.transfer_proof_uploaded_at)} — en cours de vérification.</p>
                ) : null}
                <input
                  ref={(el) => { fileInputs.current[sub.id] = el; }}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadProof(sub.id, e.target.files[0])}
                />
                <button
                  onClick={() => fileInputs.current[sub.id]?.click()}
                  disabled={uploadingId === sub.id}
                  className="mt-3 w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {sub.transfer_proof_uploaded_at ? 'Remplacer le justificatif' : "J'ai payé : envoyer le justificatif"}
                </button>
              </div>
            </div>

            {/* En ligne */}
            <div className="p-6 rounded-2xl bg-gray-50 space-y-4">
              <h5 className="font-black text-primary flex items-center gap-2"><CreditCard className="h-5 w-5" /> Par carte CIB / Edahabia</h5>
              {data.payment.online ? (
                <>
                  <p className="text-sm text-gray-600">Paiement sécurisé sur la page de notre prestataire agréé. L'abonnement est activé automatiquement.</p>
                  <button
                    onClick={() => checkout.mutate(sub.id)}
                    disabled={checkout.isPending}
                    className="w-full btn-secondary py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {checkout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Payer {dzd(sub.amount_dzd)} en ligne
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-600">Le paiement par carte sera bientôt disponible. En attendant, réglez par virement.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => window.confirm(`Annuler la facture ${sub.invoice_number} ?`) && cancel.mutate(sub.id)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" /> Annuler cette facture
          </button>
        </section>
      ))}

      {/* Historique */}
      {history.length > 0 && (
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
          <h4 className="p-6 font-black text-primary">Historique des factures</h4>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="p-4 text-start">Facture</th>
                <th className="p-4 text-start">Offre</th>
                <th className="p-4 text-start">Montant</th>
                <th className="p-4 text-start">Période</th>
                <th className="p-4 text-start">Statut</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((sub: any) => (
                <tr key={sub.id}>
                  <td className="p-4 font-mono font-bold">{sub.invoice_number}</td>
                  <td className="p-4">{PLAN_NAMES[sub.plan]}</td>
                  <td className="p-4">{dzd(sub.amount_dzd)}</td>
                  <td className="p-4">{sub.starts_at ? `${date(sub.starts_at)} → ${date(sub.ends_at)}` : '—'}</td>
                  <td className="p-4"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', STATUS[sub.status]?.className)}>{STATUS[sub.status]?.label || sub.status}</span></td>
                  <td className="p-4 text-end">
                    <a href={`/api/subscriptions/${sub.id}/invoice`} target="_blank" rel="noopener" className="text-secondary font-bold hover:underline">Facture</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </motion.div>
  );
}
