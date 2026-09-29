import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { verifyRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { logAdminAction } from '../utils/auditLogger';
import { escapeHtml } from '../utils/html';
import { logger } from '../utils/logger';

// Facturation des abonnements (console admin). Au lancement : facture +
// virement bancaire, activation manuelle après réception du paiement.
const router = express.Router();
router.use(verifyRole(['admin']));

// Prix annuels TTC (TVA 19 % incluse), identiques à la page /tarifs.
export const PLANS = {
  basic: { label: 'Basic', amount: 18000 },
  pro: { label: 'Pro', amount: 29900 },
  // Offre membre fondateur : Premium offert 12 mois.
  founder: { label: 'Membre fondateur (Premium offert)', amount: 0 },
} as const;

export type PlanId = keyof typeof PLANS;

const DURATION_MONTHS = 12;
const VAT_RATE = 0.19;

const SUBSCRIPTION_COLUMNS =
  'id, invoice_number, user_id, company_id, plan, amount_dzd, status, starts_at, ends_at, paid_at, payment_method, payment_reference, notes, created_at, company:companies(id, name, wilaya, nif, rc), user:users!subscriptions_user_id_fkey(id, name, email)';

const createSchema = z.object({
  company_id: z.string().uuid('Entreprise invalide'),
  plan: z.enum(['basic', 'pro', 'founder']),
  notes: z.string().trim().max(1000).optional(),
});

const activateSchema = z.object({
  payment_method: z.enum(['virement', 'cheque', 'gratuit']),
  payment_reference: z.string().trim().max(200).optional(),
});

const cancelSchema = z.object({
  reason: z.string().trim().min(3, 'Motif requis').max(500),
});

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

// GET /api/admin/billing/summary - Chiffres réels issus des transactions
router.get('/summary', async (req, res, next) => {
  try {
    await expireSubscriptions();
    const supabase = getSupabase();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const [monthTx, yearTx, active, pending] = await Promise.all([
      supabase.from('transactions').select('amount').eq('status', 'completed').gte('created_at', startOfMonth),
      supabase.from('transactions').select('amount, created_at').eq('status', 'completed').gte('created_at', startOfYear),
      supabase.from('subscriptions').select('plan').eq('status', 'active'),
      supabase.from('subscriptions').select('amount_dzd').eq('status', 'pending'),
    ]);

    const sum = (rows: any[] | null, key: string) => (rows || []).reduce((acc, r) => acc + Number(r[key] || 0), 0);

    const byMonth = new Array(12).fill(0);
    (yearTx.data || []).forEach((t: any) => {
      byMonth[new Date(t.created_at).getMonth()] += Number(t.amount || 0);
    });

    const activeByPlan: Record<string, number> = { basic: 0, pro: 0, founder: 0 };
    (active.data || []).forEach((s: any) => { activeByPlan[s.plan] = (activeByPlan[s.plan] || 0) + 1; });

    return res.json({
      revenueMonth: sum(monthTx.data, 'amount'),
      revenueYear: sum(yearTx.data, 'amount'),
      revenueByMonth: byMonth.slice(0, now.getMonth() + 1).map((amount, month) => ({ month, amount })),
      activeCount: (active.data || []).length,
      activeByPlan,
      pendingCount: (pending.data || []).length,
      pendingAmount: sum(pending.data, 'amount_dzd'),
    });
  } catch (err) {
    logger.error('Billing summary error', err);
    next(err);
  }
});

// GET /api/admin/billing - Liste des abonnements / factures
router.get('/', async (req, res, next) => {
  try {
    await expireSubscriptions();
    const supabase = getSupabase();
    let query = supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(200);

    const status = req.query.status;
    if (typeof status === 'string' && ['pending', 'active', 'expired', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    logger.error('Billing list error', err);
    next(err);
  }
});

// POST /api/admin/billing - Émettre une facture (abonnement en attente de paiement)
router.post('/', validate(createSchema), async (req, res, next) => {
  const { company_id, plan, notes } = req.body as { company_id: string; plan: PlanId; notes?: string };
  const admin = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, owner_id, status')
      .eq('id', company_id)
      .maybeSingle();

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable' });
    }
    if (!company.owner_id) {
      return res.status(400).json({ error: "Cette fiche n'est pas revendiquée : aucun titulaire à facturer.", code: 'COMPANY_UNCLAIMED' });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        company_id,
        user_id: company.owner_id,
        plan,
        amount_dzd: PLANS[plan].amount,
        status: 'pending',
        notes: notes || null,
        created_by: admin.id,
      }])
      .select(SUBSCRIPTION_COLUMNS)
      .single();

    if (error) throw error;

    await logAdminAction(req, 'subscription_create', {
      subscriptionId: data.id,
      invoiceNumber: data.invoice_number,
      targetCompanyId: company_id,
      targetCompanyName: company.name,
      plan,
    });

    return res.status(201).json(data);
  } catch (err) {
    logger.error('Billing create error', err);
    next(err);
  }
});

// POST /api/admin/billing/:id/activate - Paiement reçu : activation pour 12 mois
router.post('/:id/activate', requireUuidParams('id'), validate(activateSchema), async (req, res, next) => {
  const { payment_method, payment_reference } = req.body;
  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, invoice_number, status, plan, amount_dzd, company_id, user_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!sub) return res.status(404).json({ error: 'Abonnement introuvable' });
    if (sub.status !== 'pending') {
      return res.status(409).json({ error: 'Seule une facture en attente peut être activée.', code: 'SUBSCRIPTION_NOT_PENDING' });
    }
    if (Number(sub.amount_dzd) > 0 && payment_method === 'gratuit') {
      return res.status(400).json({ error: 'Une facture payante ne peut pas être activée gratuitement.', code: 'PAYMENT_REQUIRED' });
    }
    if (Number(sub.amount_dzd) > 0 && !payment_reference) {
      return res.status(400).json({ error: 'Indiquez la référence du virement ou du chèque.', code: 'PAYMENT_REFERENCE_REQUIRED' });
    }

    // Si un abonnement est déjà actif, le nouveau prend le relais à son échéance.
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

    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paid_at: now.toISOString(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        payment_method,
        payment_reference: payment_reference || null,
        updated_at: now.toISOString(),
      })
      .eq('id', sub.id)
      .eq('status', 'pending')
      .select(SUBSCRIPTION_COLUMNS)
      .single();

    if (error) throw error;

    if (sub.company_id) {
      await supabase
        .from('companies')
        .update({ plan: sub.plan, plan_ends_at: endsAt.toISOString() })
        .eq('id', sub.company_id);
    }

    if (Number(sub.amount_dzd) > 0) {
      await supabase.from('transactions').insert([{
        user_id: sub.user_id,
        subscription_id: sub.id,
        amount: sub.amount_dzd,
        status: 'completed',
        payment_method,
        reference: payment_reference,
      }]);
    }

    await logAdminAction(req, 'subscription_activate', {
      subscriptionId: sub.id,
      invoiceNumber: sub.invoice_number,
      targetCompanyId: sub.company_id,
      plan: sub.plan,
      amount: sub.amount_dzd,
      paymentMethod: payment_method,
      paymentReference: payment_reference,
    });

    return res.json(updated);
  } catch (err) {
    logger.error('Billing activate error', err);
    next(err);
  }
});

// POST /api/admin/billing/:id/cancel - Annuler une facture ou un abonnement
router.post('/:id/cancel', requireUuidParams('id'), validate(cancelSchema), async (req, res, next) => {
  const { reason } = req.body;
  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, invoice_number, status, company_id, notes')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!sub) return res.status(404).json({ error: 'Abonnement introuvable' });
    if (!['pending', 'active'].includes(sub.status)) {
      return res.status(409).json({ error: 'Cet abonnement est déjà clos.', code: 'SUBSCRIPTION_CLOSED' });
    }

    const notes = [sub.notes, `Annulé : ${reason}`].filter(Boolean).join('\n');
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', notes, updated_at: new Date().toISOString() })
      .eq('id', sub.id)
      .select(SUBSCRIPTION_COLUMNS)
      .single();
    if (error) throw error;

    // Un abonnement actif annulé : l'entreprise repasse en gratuit s'il n'en reste aucun autre.
    if (sub.status === 'active' && sub.company_id) {
      const { data: others } = await supabase
        .from('subscriptions')
        .select('plan, ends_at')
        .eq('company_id', sub.company_id)
        .eq('status', 'active')
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      await supabase
        .from('companies')
        .update(others ? { plan: others.plan, plan_ends_at: others.ends_at } : { plan: 'free', plan_ends_at: null })
        .eq('id', sub.company_id);
    }

    await logAdminAction(req, 'subscription_cancel', {
      subscriptionId: sub.id,
      invoiceNumber: sub.invoice_number,
      targetCompanyId: sub.company_id,
      previousStatus: sub.status,
      reason,
    });

    return res.json(updated);
  } catch (err) {
    logger.error('Billing cancel error', err);
    next(err);
  }
});

const formatDzd = (value: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' DA';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const legal = (key: string) => process.env[`LEGAL_${key}`] || process.env[`VITE_LEGAL_${key}`] || '';

// GET /api/admin/billing/:id/invoice - Facture imprimable (Imprimer → PDF)
router.get('/:id/invoice', requireUuidParams('id'), async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle();

    if (!sub) return res.status(404).type('text/plain').send('Facture introuvable');

    const plan = PLANS[sub.plan as PlanId];
    const totalTtc = Number(sub.amount_dzd);
    const totalHt = Math.round((totalTtc / (1 + VAT_RATE)) * 100) / 100;
    const vat = Math.round((totalTtc - totalHt) * 100) / 100;
    const company: any = sub.company || {};
    const user: any = sub.user || {};
    const pending = (value: string) => escapeHtml(value || 'à compléter');

    const html = `<!doctype html>
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
    <div class="muted">${pending(legal('COMPANY_NAME'))}<br>${pending(legal('ADDRESS'))}<br>
    RC : ${pending(legal('RC'))} — NIF : ${pending(legal('NIF'))}</div></div>
  <div class="right"><h1>Facture</h1><div>${escapeHtml(sub.invoice_number)}</div>
    <div class="muted">Émise le ${formatDate(sub.created_at)}</div>
    <div class="status">${escapeHtml({ pending: 'En attente de paiement', active: 'Payée', expired: 'Payée (échue)', cancelled: 'Annulée' }[sub.status as string] || sub.status)}</div></div>
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
RIB : ${pending(legal('RIB'))}<br>L'abonnement est activé dès réception du paiement.</p>` : ''}
${sub.paid_at ? `<p>Payée le ${formatDate(sub.paid_at)} par ${escapeHtml(sub.payment_method || '')}${sub.payment_reference ? ` (réf. ${escapeHtml(sub.payment_reference)})` : ''}.</p>` : ''}
<p class="muted">Conditions générales de vente : ${escapeHtml((process.env.APP_URL || '').replace(/\/+$/, ''))}/terms</p>
</body></html>`;

    res.set('Cache-Control', 'no-store');
    return res.type('html').send(html);
  } catch (err) {
    logger.error('Invoice render error', err);
    next(err);
  }
});

export default router;
