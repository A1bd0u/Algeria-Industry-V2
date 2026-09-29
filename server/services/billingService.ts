import { getSupabase } from '../db/supabaseClient';
import { escapeHtml } from '../utils/html';

// Offres et prix annuels TTC (TVA 19 % incluse), identiques à la page /tarifs.
export const PLANS = {
  basic: { label: 'Basic', amount: 18000 },
  pro: { label: 'Pro', amount: 29900 },
  // Offre membre fondateur : Premium offert 12 mois (attribuée par un admin).
  founder: { label: 'Membre fondateur (Premium offert)', amount: 0 },
} as const;

export type PlanId = keyof typeof PLANS;
export type CompanyPlan = 'free' | PlanId;
export type PaymentMethod = 'virement' | 'cheque' | 'gratuit' | 'cib_edahabia';

// Limites par offre (null = illimité). Le membre fondateur a les droits Pro.
export const PLAN_LIMITS: Record<CompanyPlan, { products: number | null; imagesPerProduct: number }> = {
  free: { products: 5, imagesPerProduct: 2 },
  basic: { products: 15, imagesPerProduct: 5 },
  pro: { products: null, imagesPerProduct: 10 },
  founder: { products: null, imagesPerProduct: 10 },
};

export const DURATION_MONTHS = 12;
export const VAT_RATE = 0.19;

export const SUBSCRIPTION_COLUMNS =
  'id, invoice_number, user_id, company_id, plan, amount_dzd, status, starts_at, ends_at, paid_at, payment_method, payment_reference, notes, source, transfer_proof_path, transfer_proof_uploaded_at, checkout_id, created_at, company:companies(id, name, wilaya, nif, rc), user:users!subscriptions_user_id_fkey(id, name, email)';

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// Passe en « expired » les abonnements échus et repasse l'entreprise en gratuit.
export const expireSubscriptions = async () => {
  const supabase = getSupabase();
  const nowIso = new Date().toISOString();
  const { data: expired } = await supabase
    .from('subscriptions')
    .update({ status: 'expired', updated_at: nowIso })
    .eq('status', 'active')
    .lt('ends_at', nowIso)
    .select('company_id');

  const companyIds = Array.from(new Set((expired || []).map((s: any) => s.company_id).filter(Boolean)));
  if (companyIds.length > 0) {
    await supabase
      .from('companies')
      .update({ plan: 'free', plan_ends_at: null })
      .in('id', companyIds)
      .lt('plan_ends_at', nowIso);
  }
};

// Offre en vigueur pour une entreprise (gratuite si l'abonnement est échu).
export const getCompanyPlan = async (companyId: string | null | undefined): Promise<CompanyPlan> => {
  if (!companyId) return 'free';
  const supabase = getSupabase();
  const { data } = await supabase
    .from('companies')
    .select('plan, plan_ends_at')
    .eq('id', companyId)
    .maybeSingle();
  if (!data || !data.plan || data.plan === 'free') return 'free';
  if (data.plan_ends_at && new Date(data.plan_ends_at) < new Date()) return 'free';
  return (data.plan in PLAN_LIMITS ? data.plan : 'free') as CompanyPlan;
};

export type ActivationResult =
  | { ok: true; subscription: any; alreadyActive?: boolean }
  | { ok: false; status: number; code: string; error: string };

/**
 * Enregistre le paiement d'une facture et active l'abonnement pour 12 mois
 * (à la suite de l'abonnement en cours s'il y en a un). Utilisé par la console
 * admin (virement, chèque) et par le webhook de paiement en ligne.
 * Idempotent : une facture déjà active n'est jamais réactivée.
 */
export const activateSubscription = async (
  subscriptionId: string,
  payment: { method: PaymentMethod; reference?: string | null; expectedAmount?: number }
): Promise<ActivationResult> => {
  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, invoice_number, status, plan, amount_dzd, company_id, user_id')
    .eq('id', subscriptionId)
    .maybeSingle();

  if (!sub) return { ok: false, status: 404, code: 'SUBSCRIPTION_NOT_FOUND', error: 'Abonnement introuvable' };
  if (sub.status === 'active' && payment.method === 'cib_edahabia') {
    return { ok: true, subscription: sub, alreadyActive: true };
  }
  if (sub.status !== 'pending') {
    return { ok: false, status: 409, code: 'SUBSCRIPTION_NOT_PENDING', error: 'Seule une facture en attente peut être activée.' };
  }

  const amount = Number(sub.amount_dzd);
  if (amount > 0 && payment.method === 'gratuit') {
    return { ok: false, status: 400, code: 'PAYMENT_REQUIRED', error: 'Une facture payante ne peut pas être activée gratuitement.' };
  }
  if (amount > 0 && !payment.reference) {
    return { ok: false, status: 400, code: 'PAYMENT_REFERENCE_REQUIRED', error: 'Indiquez la référence du virement ou du chèque.' };
  }
  if (payment.expectedAmount !== undefined && Math.round(payment.expectedAmount) !== Math.round(amount)) {
    return { ok: false, status: 400, code: 'AMOUNT_MISMATCH', error: 'Le montant payé ne correspond pas à la facture.' };
  }

  const { data: current } = await supabase
    .from('subscriptions')
    .select('ends_at')
    .eq('company_id', sub.company_id)
    .eq('status', 'active')
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const startsAt = current?.ends_at && new Date(current.ends_at) > now ? new Date(current.ends_at) : now;
  const endsAt = addMonths(startsAt, DURATION_MONTHS);

  // Le filtre status = 'pending' garantit qu'une activation concurrente échoue.
  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      paid_at: now.toISOString(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      payment_method: payment.method,
      payment_reference: payment.reference || null,
      updated_at: now.toISOString(),
    })
    .eq('id', sub.id)
    .eq('status', 'pending')
    .select(SUBSCRIPTION_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!updated) {
    return { ok: false, status: 409, code: 'SUBSCRIPTION_NOT_PENDING', error: 'Cette facture vient déjà d\'être traitée.' };
  }

  if (sub.company_id) {
    await supabase
      .from('companies')
      .update({ plan: sub.plan, plan_ends_at: endsAt.toISOString() })
      .eq('id', sub.company_id);
  }

  if (amount > 0) {
    await supabase.from('transactions').insert([{
      user_id: sub.user_id,
      subscription_id: sub.id,
      amount,
      status: 'completed',
      payment_method: payment.method,
      reference: payment.reference || null,
    }]);
  }

  return { ok: true, subscription: updated };
};

const formatDzd = (value: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' DA';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export const legalSetting = (key: string) => process.env[`LEGAL_${key}`] || process.env[`VITE_LEGAL_${key}`] || '';

const METHOD_LABELS: Record<string, string> = {
  virement: 'virement bancaire',
  cheque: 'chèque',
  gratuit: 'offre gratuite',
  cib_edahabia: 'carte CIB / Edahabia',
};

// Facture HTML imprimable (Imprimer → PDF). Toutes les données sont échappées.
export const renderInvoiceHtml = (sub: any) => {
  const plan = PLANS[sub.plan as PlanId];
  const totalTtc = Number(sub.amount_dzd);
  const totalHt = Math.round((totalTtc / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((totalTtc - totalHt) * 100) / 100;
  const company: any = sub.company || {};
  const user: any = sub.user || {};
  const pending = (value: string) => escapeHtml(value || 'à compléter');
  const statusLabel = ({ pending: 'En attente de paiement', active: 'Payée', expired: 'Payée (échue)', cancelled: 'Annulée' } as Record<string, string>)[sub.status] || sub.status;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Facture ${escapeHtml(sub.invoice_number)}</title>
<style>
body{font-family:Arial,sans-serif;color:#1a1a1a;max-width:800px;margin:40px auto;padding:0 24px;font-size:14px}
header{display:flex;justify-content:space-between;border-bottom:4px solid #ff6b00;padding-bottom:16px;margin-bottom:24px}
h1{font-size:22px;margin:0} .muted{color:#6b7280} table{width:100%;border-collapse:collapse;margin:24px 0}
th,td{border-bottom:1px solid #e5e7eb;padding:10px;text-align:left} th{background:#f8f9fa}
.right{text-align:right} .total td{font-weight:bold;font-size:16px} .status{display:inline-block;padding:4px 10px;border-radius:6px;background:#f3f4f6;font-weight:bold}
.no-print{margin:24px 0} @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print"><button id="print">Imprimer / enregistrer en PDF</button></div>
<script>document.getElementById('print').addEventListener('click', function () { window.print(); });</script>
<header>
  <div><h1>Algeria Industry</h1>
    <div class="muted">${pending(legalSetting('COMPANY_NAME'))}<br>${pending(legalSetting('ADDRESS'))}<br>
    RC : ${pending(legalSetting('RC'))} — NIF : ${pending(legalSetting('NIF'))}</div></div>
  <div class="right"><h1>Facture</h1><div>${escapeHtml(sub.invoice_number)}</div>
    <div class="muted">Émise le ${formatDate(sub.created_at)}</div>
    <div class="status">${escapeHtml(statusLabel)}</div></div>
</header>
<p><strong>Facturé à :</strong><br>${escapeHtml(company.name || '—')}<br>
${company.wilaya ? `${escapeHtml(company.wilaya)}<br>` : ''}${company.rc ? `RC : ${escapeHtml(company.rc)}<br>` : ''}${company.nif ? `NIF : ${escapeHtml(company.nif)}<br>` : ''}
${escapeHtml(user.name || '')} — ${escapeHtml(user.email || '')}</p>
<table>
  <thead><tr><th>Désignation</th><th>Période</th><th class="right">Montant HT</th></tr></thead>
  <tbody><tr><td>Abonnement ${escapeHtml(plan?.label || sub.plan)} — ${DURATION_MONTHS} mois</td>
    <td>${sub.starts_at ? `${formatDate(sub.starts_at)} → ${formatDate(sub.ends_at)}` : `${DURATION_MONTHS} mois à compter de l'activation`}</td>
    <td class="right">${formatDzd(totalHt)}</td></tr></tbody>
  <tfoot>
    <tr><td colspan="2" class="right">TVA 19 %</td><td class="right">${formatDzd(vat)}</td></tr>
    <tr class="total"><td colspan="2" class="right">Total TTC</td><td class="right">${formatDzd(totalTtc)}</td></tr>
  </tfoot>
</table>
${sub.status === 'pending' && totalTtc > 0 ? `<p><strong>Règlement par virement bancaire</strong> en indiquant la référence <strong>${escapeHtml(sub.invoice_number)}</strong>.<br>
RIB : ${pending(legalSetting('RIB'))}<br>L'abonnement est activé dès réception du paiement.</p>` : ''}
${sub.paid_at ? `<p>Payée le ${formatDate(sub.paid_at)} par ${escapeHtml(METHOD_LABELS[sub.payment_method] || sub.payment_method || '')}${sub.payment_reference ? ` (réf. ${escapeHtml(sub.payment_reference)})` : ''}.</p>` : ''}
<p class="muted">Conditions générales de vente : ${escapeHtml((process.env.APP_URL || '').replace(/\/+$/, ''))}/terms</p>
</body></html>`;
};
