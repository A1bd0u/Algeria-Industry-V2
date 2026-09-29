import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { verifyRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { logAdminAction } from '../utils/auditLogger';
import { logger } from '../utils/logger';
import {
  PLANS, PlanId, SUBSCRIPTION_COLUMNS, expireSubscriptions, activateSubscription, renderInvoiceHtml,
} from '../services/billingService';
import { KYC_BUCKET } from './upload';

// Facturation des abonnements (console admin). Au lancement : facture +
// virement bancaire, activation manuelle après réception du paiement.
const router = express.Router();
router.use(verifyRole(['admin']));

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

    const { data: existingPending } = await supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('company_id', company_id)
      .eq('plan', plan)
      .eq('status', 'pending')
      .maybeSingle();
    if (existingPending) {
      return res.status(409).json({ error: `Une facture ${existingPending.invoice_number} est déjà en attente pour cette offre.`, code: 'INVOICE_ALREADY_PENDING' });
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
    const result = await activateSubscription(req.params.id, { method: payment_method, reference: payment_reference });
    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error, code: result.code });
    }
    const sub = result.subscription;
    await logAdminAction(req, 'subscription_activate', {
      subscriptionId: sub.id,
      invoiceNumber: sub.invoice_number,
      targetCompanyId: sub.company_id,
      plan: sub.plan,
      amount: sub.amount_dzd,
      paymentMethod: payment_method,
      paymentReference: payment_reference,
    });
    return res.json(sub);
  } catch (err) {
    logger.error('Billing activate error', err);
    next(err);
  }
});

// GET /api/admin/billing/:id/proof - Justificatif de virement (URL signée 5 min)
router.get('/:id/proof', requireUuidParams('id'), async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, invoice_number, transfer_proof_path')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!sub?.transfer_proof_path) {
      return res.status(404).json({ error: 'Aucun justificatif pour cette facture' });
    }
    const { data, error } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(sub.transfer_proof_path, 300);
    if (error || !data) return res.status(404).json({ error: 'Fichier introuvable dans le stockage' });
    return res.json({ url: data.signedUrl });
  } catch (err) {
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

    const html = renderInvoiceHtml(sub);
    res.set('Cache-Control', 'no-store');
    return res.type('html').send(html);
  } catch (err) {
    logger.error('Invoice render error', err);
    next(err);
  }
});

export default router;
