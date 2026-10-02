import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireEmailVerified } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { logger } from '../utils/logger';
import {
  PLANS, PLAN_LIMITS, SUBSCRIPTION_COLUMNS, expireSubscriptions, getCompanyPlan, legalSetting, renderInvoiceHtml,
} from '../services/billingService';
import { createCheckout, isOnlinePaymentEnabled } from '../services/chargily';
import { getAppUrl } from '../services/emailService';
import { alertAdminsTransferProof, notifyInvoiceIssued } from '../services/notificationService';

// Espace abonnement du client : souscription, factures, justificatif de
// virement et paiement en ligne.
const router = express.Router();
router.use(requireAuth);

// Version des conditions générales de vente acceptées (page /cgv).
export const TERMS_VERSION = '2026-10';

const subscribeSchema = z.object({
  plan: z.enum(['basic', 'pro']),
  acceptTerms: z.literal(true, { message: 'Vous devez accepter les conditions générales de vente.' }),
});

const proofSchema = z.object({
  path: z.string().min(1).max(500),
});

// Colonnes visibles par le client (pas de notes internes).
const CLIENT_COLUMNS =
  'id, invoice_number, plan, amount_dzd, status, starts_at, ends_at, paid_at, payment_method, payment_reference, transfer_proof_uploaded_at, created_at';

const loadOwnedCompany = async (user: any) => {
  if (!user.company_id) return null;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('companies')
    .select('id, name, owner_id, plan, plan_ends_at')
    .eq('id', user.company_id)
    .maybeSingle();
  return data && data.owner_id === user.id ? data : null;
};

const loadOwnedSubscription = async (user: any, id: string, columns = SUBSCRIPTION_COLUMNS) => {
  const supabase = getSupabase();
  const { data } = await supabase.from('subscriptions').select(columns).eq('id', id).maybeSingle();
  return data && (data as any).user_id === user.id ? (data as any) : null;
};

// GET /api/subscriptions/me - Offre en cours, consommation et factures
router.get('/me', async (req, res, next) => {
  const user = (req as any).user;
  try {
    await expireSubscriptions();
    const supabase = getSupabase();
    const plan = await getCompanyPlan(user.company_id);
    const company = await loadOwnedCompany(user);

    const [{ count: productCount }, { data: subscriptions }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase
        .from('subscriptions')
        .select(CLIENT_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return res.json({
      plan,
      planEndsAt: plan !== 'free' ? company?.plan_ends_at || null : null,
      limits: PLAN_LIMITS[plan],
      usage: { products: productCount || 0 },
      canSubscribe: Boolean(company),
      subscriptions: subscriptions || [],
      prices: { basic: PLANS.basic.amount, pro: PLANS.pro.amount },
      payment: {
        online: isOnlinePaymentEnabled(),
        rib: legalSetting('RIB') || null,
        beneficiary: legalSetting('COMPANY_NAME') || null,
      },
    });
  } catch (err) {
    logger.error('Subscriptions me error', err);
    next(err);
  }
});

// POST /api/subscriptions - Souscrire : génère la facture (ou renvoie celle en attente)
router.post('/', requireEmailVerified, validate(subscribeSchema), async (req, res, next) => {
  const user = (req as any).user;
  const { plan } = req.body as { plan: 'basic' | 'pro' };
  try {
    const company = await loadOwnedCompany(user);
    if (!company) {
      return res.status(403).json({
        error: "Seul le titulaire d'une fiche entreprise peut souscrire. Complétez d'abord votre entreprise (KYC).",
        code: 'COMPANY_REQUIRED',
      });
    }

    const supabase = getSupabase();
    const findPending = () => supabase
      .from('subscriptions')
      .select(CLIENT_COLUMNS)
      .eq('company_id', company.id)
      .eq('plan', plan)
      .eq('status', 'pending')
      .maybeSingle();
    const { data: existing } = await findPending();
    if (existing) {
      return res.json(existing);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        company_id: company.id,
        user_id: user.id,
        plan,
        amount_dzd: PLANS[plan].amount,
        status: 'pending',
        source: 'self_service',
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      }])
      .select(CLIENT_COLUMNS)
      .single();
    if (error?.code === '23505') {
      // Double clic : une facture en attente vient d'être créée en parallèle.
      const { data: concurrent } = await findPending();
      if (concurrent) return res.json(concurrent);
    }
    if (error) throw error;

    await notifyInvoiceIssued({ ...data, user: { email: user.email, name: user.name } });

    return res.status(201).json(data);
  } catch (err) {
    logger.error('Subscribe error', err);
    next(err);
  }
});

// GET /api/subscriptions/:id/invoice - Facture imprimable du client
router.get('/:id/invoice', requireUuidParams('id'), async (req, res, next) => {
  try {
    const sub = await loadOwnedSubscription((req as any).user, req.params.id);
    if (!sub) return res.status(404).type('text/plain').send('Facture introuvable');
    res.set('Cache-Control', 'no-store');
    return res.type('html').send(renderInvoiceHtml(sub));
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/transfer-proof - Justificatif de virement
// Le fichier est d'abord déposé dans le stockage privé via /api/upload.
router.post('/:id/transfer-proof', requireUuidParams('id'), validate(proofSchema), async (req, res, next) => {
  const user = (req as any).user;
  const { path } = req.body;
  if (!path.startsWith(`${user.id}/`) || path.includes('..')) {
    return res.status(400).json({ error: 'Fichier invalide', code: 'PROOF_INVALID' });
  }
  try {
    const sub = await loadOwnedSubscription(user, req.params.id, 'id, user_id, status');
    if (!sub) return res.status(404).json({ error: 'Facture introuvable' });
    if (sub.status !== 'pending') {
      return res.status(409).json({ error: 'Cette facture est déjà réglée ou annulée.', code: 'SUBSCRIPTION_NOT_PENDING' });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ transfer_proof_path: path, transfer_proof_uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', sub.id)
      .eq('status', 'pending')
      .select(CLIENT_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    if (data) await alertAdminsTransferProof(data.invoice_number, user.company || '');
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/checkout - Paiement en ligne CIB / Edahabia
router.post('/:id/checkout', requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;
  if (!isOnlinePaymentEnabled()) {
    return res.status(503).json({ error: 'Le paiement en ligne n\'est pas encore disponible. Réglez par virement.', code: 'ONLINE_PAYMENT_DISABLED' });
  }
  try {
    const sub = await loadOwnedSubscription(user, req.params.id);
    if (!sub) return res.status(404).json({ error: 'Facture introuvable' });
    if (sub.status !== 'pending' || Number(sub.amount_dzd) <= 0) {
      return res.status(409).json({ error: 'Cette facture ne peut pas être payée en ligne.', code: 'SUBSCRIPTION_NOT_PENDING' });
    }

    const appUrl = getAppUrl().replace(/\/+$/, '');
    const checkout = await createCheckout({
      amount: Number(sub.amount_dzd),
      description: `Algeria Industry — abonnement ${PLANS[sub.plan as 'basic' | 'pro'].label} 12 mois (${sub.invoice_number})`,
      successUrl: `${appUrl}/dashboard?tab=subscription&payment=success`,
      failureUrl: `${appUrl}/dashboard?tab=subscription&payment=failed`,
      webhookUrl: `${appUrl}/api/payments/chargily/webhook`,
      metadata: { subscription_id: sub.id, invoice_number: sub.invoice_number },
    });

    const supabase = getSupabase();
    await supabase
      .from('subscriptions')
      .update({ checkout_id: checkout.id, checkout_created_at: new Date().toISOString() })
      .eq('id', sub.id)
      .eq('status', 'pending');

    return res.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (err: any) {
    logger.error('Checkout error', err);
    return res.status(502).json({ error: err.message || 'Paiement en ligne indisponible', code: 'CHECKOUT_FAILED' });
  }
});

// POST /api/subscriptions/:id/cancel - Le client annule sa facture en attente
router.post('/:id/cancel', requireUuidParams('id'), async (req, res, next) => {
  try {
    const sub = await loadOwnedSubscription((req as any).user, req.params.id, 'id, user_id, status');
    if (!sub) return res.status(404).json({ error: 'Facture introuvable' });
    if (sub.status !== 'pending') {
      return res.status(409).json({ error: 'Seule une facture en attente peut être annulée.', code: 'SUBSCRIPTION_NOT_PENDING' });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', notes: 'Annulée par le client', updated_at: new Date().toISOString() })
      .eq('id', sub.id)
      .eq('status', 'pending')
      .select(CLIENT_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
