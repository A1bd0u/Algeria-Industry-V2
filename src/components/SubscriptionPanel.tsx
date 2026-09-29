import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Copy, CreditCard, FileText, Landmark, Loader2, Upload, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiError } from '../lib/apiError';
import { formatDate as date, formatDzd as dzd } from '../lib/format';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-600',
  active: 'bg-emerald-50 text-emerald-600',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-500',
};

async function api<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data);
  return data as T;
}

// Espace abonnement du fournisseur : offre en cours, souscription, factures,
// virement (RIB + justificatif) et paiement en ligne CIB / Edahabia.
export default function SubscriptionPanel({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get('payment');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const planName = (plan: string) => t(`subscription.plans.${plan}`, { defaultValue: plan });

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
      notify(t(data?.payment?.online ? 'subscription.invoiceReadyOnline' : 'subscription.invoiceReady', { invoice: sub.invoice_number }), 'success');
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
      notify(t('subscription.invoiceCancelled'), 'success');
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
      if (!res.ok) throw new ApiError(uploaded, 'subscription.uploadFailed');
      await api(`/api/subscriptions/${subId}/transfer-proof`, { method: 'POST', body: JSON.stringify({ path: uploaded.path || uploaded.url }) });
      notify(t('subscription.proofSent'), 'success');
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
      notify(t('subscription.copied'), 'success');
    } catch {
      // presse-papier indisponible
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-400" /></div>;
  }
  if (error || !data) {
    return <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-sm">{t('subscription.loadError')}</div>;
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
          {t('subscription.paymentSuccess')}
        </div>
      )}
      {paymentReturn === 'failed' && (
        <div role="alert" className="p-5 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {t('subscription.paymentFailed')}
        </div>
      )}

      {/* Offre en cours */}
      <section className="bg-primary p-8 sm:p-12 rounded-[40px] text-white">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('subscription.currentPlan')}</span>
        <h3 className="text-4xl font-black uppercase italic tracking-tighter mt-3">{planName(data.plan)}</h3>
        <p className="text-white/70 mt-2">
          {isPaidPlan && data.planEndsAt ? t('subscription.validUntil', { date: date(data.planEndsAt) }) : t('subscription.freePlanText')}
        </p>
        <div className="mt-8 max-w-md">
          <div className="flex justify-between text-[11px] font-bold text-white/80 mb-2">
            <span>{t('subscription.publishedProducts')}</span>
            <span>{data.usage.products}{limit ? ` / ${limit}` : ` (${t('subscription.unlimited')})`}</span>
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
              <h4 className="text-xl font-black text-primary uppercase italic">{planName(plan)}</h4>
              <p className="text-2xl font-black text-primary mt-2">{dzd(data.prices[plan])} <span className="text-xs font-bold text-gray-500">{t('subscription.perYearVat')}</span></p>
              <p className="text-sm text-gray-600 mt-3 flex-1">{t(`subscription.features.${plan}`)}</p>
              <button
                onClick={() => subscribe.mutate(plan)}
                disabled={!data.canSubscribe || subscribe.isPending}
                className="mt-6 w-full btn-secondary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {subscribe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('subscription.choose', { plan: planName(plan) })}
              </button>
            </div>
          ))}
          {!data.canSubscribe && (
            <p className="md:col-span-2 text-sm text-gray-600">
              {t('subscription.ownerRequired')} <Link to="/kyc-upload" className="font-bold text-secondary underline">{t('subscription.verifyCompany')}</Link>
            </p>
          )}
        </section>
      )}

      {/* Factures à régler */}
      {pending.map((sub: any) => (
        <section key={sub.id} className="bg-white p-8 rounded-[32px] border-2 border-orange-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{t('subscription.invoiceToPay')}</p>
              <h4 className="text-xl font-black text-primary mt-1">{sub.invoice_number} — {planName(sub.plan)}</h4>
              <p className="text-sm text-gray-600">{t('subscription.invoiceMeta', { amount: dzd(sub.amount_dzd), date: date(sub.created_at) })}</p>
            </div>
            <a href={`/api/subscriptions/${sub.id}/invoice`} target="_blank" rel="noopener" className="px-5 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 self-start">
              <FileText className="h-4 w-4" /> {t('subscription.viewInvoice')}
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Virement */}
            <div className="p-6 rounded-2xl bg-gray-50 space-y-4">
              <h5 className="font-black text-primary flex items-center gap-2"><Landmark className="h-5 w-5" /> {t('subscription.byTransfer')}</h5>
              {data.payment.rib ? (
                <dl className="text-sm space-y-2">
                  {data.payment.beneficiary && <div><dt className="text-[10px] font-black uppercase text-gray-500">{t('subscription.beneficiary')}</dt><dd className="font-bold">{data.payment.beneficiary}</dd></div>}
                  <div>
                    <dt className="text-[10px] font-black uppercase text-gray-500">{t('subscription.rib')}</dt>
                    <dd className="font-mono font-bold flex items-center gap-2 break-all" dir="ltr">{data.payment.rib}
                      <button onClick={() => copy(data.payment.rib)} aria-label={t('subscription.copyRib')} className="text-gray-400 hover:text-primary shrink-0"><Copy className="h-4 w-4" /></button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase text-gray-500">{t('subscription.reference')}</dt>
                    <dd className="font-mono font-bold flex items-center gap-2" dir="ltr">{sub.invoice_number}
                      <button onClick={() => copy(sub.invoice_number)} aria-label={t('subscription.copyReference')} className="text-gray-400 hover:text-primary"><Copy className="h-4 w-4" /></button>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-600">{t('subscription.bankDetailsOnInvoice')} <Link to="/contact" className="text-secondary font-bold underline">{t('subscription.contactUs')}</Link></p>
              )}
              <div className="pt-2">
                {sub.transfer_proof_uploaded_at ? (
                  <p className="text-sm text-emerald-700 font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {t('subscription.proofReceived', { date: date(sub.transfer_proof_uploaded_at) })}</p>
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
                  {sub.transfer_proof_uploaded_at ? t('subscription.replaceProof') : t('subscription.sendProof')}
                </button>
              </div>
            </div>

            {/* En ligne */}
            <div className="p-6 rounded-2xl bg-gray-50 space-y-4">
              <h5 className="font-black text-primary flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t('subscription.byCard')}</h5>
              {data.payment.online ? (
                <>
                  <p className="text-sm text-gray-600">{t('subscription.cardText')}</p>
                  <button
                    onClick={() => checkout.mutate(sub.id)}
                    disabled={checkout.isPending}
                    className="w-full btn-secondary py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {checkout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {t('subscription.payOnline', { amount: dzd(sub.amount_dzd) })}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-600">{t('subscription.cardSoon')}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => window.confirm(t('subscription.cancelConfirm', { invoice: sub.invoice_number })) && cancel.mutate(sub.id)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" /> {t('subscription.cancelInvoice')}
          </button>
        </section>
      ))}

      {/* Historique */}
      {history.length > 0 && (
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
          <h4 className="p-6 font-black text-primary">{t('subscription.history')}</h4>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="p-4 text-start">{t('subscription.col.invoice')}</th>
                <th className="p-4 text-start">{t('subscription.col.plan')}</th>
                <th className="p-4 text-start">{t('subscription.col.amount')}</th>
                <th className="p-4 text-start">{t('subscription.col.period')}</th>
                <th className="p-4 text-start">{t('subscription.col.status')}</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((sub: any) => (
                <tr key={sub.id}>
                  <td className="p-4 font-mono font-bold">{sub.invoice_number}</td>
                  <td className="p-4">{planName(sub.plan)}</td>
                  <td className="p-4">{dzd(sub.amount_dzd)}</td>
                  <td className="p-4">{sub.starts_at ? `${date(sub.starts_at)} → ${date(sub.ends_at)}` : '—'}</td>
                  <td className="p-4"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', STATUS_CLASSES[sub.status])}>{t(`subscription.status.${sub.status}`, { defaultValue: sub.status })}</span></td>
                  <td className="p-4 text-end">
                    <a href={`/api/subscriptions/${sub.id}/invoice`} target="_blank" rel="noopener" className="text-secondary font-bold hover:underline">{t('subscription.col.invoice')}</a>
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
