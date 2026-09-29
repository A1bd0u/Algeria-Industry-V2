import { logger } from '../utils/logger';
import express from 'express';
import { verifyRole } from '../middlewares/authMiddleware';
import { getSupabase } from '../db/supabaseClient';
import rateLimit from 'express-rate-limit';
import { sharedStore } from '../utils/rateLimitStore';
import { logAdminAction } from '../utils/auditLogger';
import { requireUuidParams } from '../middlewares/validateParams';
import { PUBLIC_USER_COLUMNS } from '../utils/userFields';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';

const router = express.Router();

const adminDashboardLimiter = rateLimit({
  store: sharedStore('admin-dashboard'),
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },

});

// Simple in-memory cache simulating Redis to avoid overloading DB
class SimpleCache {
  private cache = new Map<string, { value: any, expiry: number }>();
  
  set(key: string, value: any, ttlSeconds: number) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}
const redisCache = new SimpleCache();

router.get('/dashboard', verifyRole(['admin']), adminDashboardLimiter, async (req, res) => {
  try {
    const user = (req as any).user;
    await logAdminAction(req, 'dashboard_consultation', { scope: 'dashboard' });

    const days = parseInt(req.query.days as string, 10) || 30;
    const cacheKey = `admin:dashboard:${days}`;
    const cachedData = redisCache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const supabase = getSupabase();
    
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // Fetch counts from existing tables
    const [
      { count: total_users }, { count: approved_companies }, { count: active_products }, { count: published_tenders },
      { count: users_cm }, { count: companies_cm }, { count: products_cm }, { count: tenders_cm },
      { count: users_pm }, { count: companies_pm }, { count: products_pm }, { count: tenders_pm },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('products').select('*', { count: 'exact', head: true }), // Assuming all are active for now since status doesn't exist on products
      supabase.from('tenders').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      // Current month
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', startOfCurrentMonth),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
      supabase.from('tenders').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
      // Previous month
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('tenders').select('*', { count: 'exact', head: true }).gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
    ]);

    const calculateTrend = (cm: number | null, pm: number | null) => {
      if (!pm || pm === 0) return cm && cm > 0 ? '+100%' : '0%';
      const diff = ((cm || 0) - pm) / pm * 100;
      return (diff > 0 ? '+' : '') + diff.toFixed(1) + '%';
    };

    const trends = {
      users: calculateTrend(users_cm, users_pm),
      companies: calculateTrend(companies_cm, companies_pm),
      products: calculateTrend(products_cm, products_pm),
      tenders: calculateTrend(tenders_cm, tenders_pm)
    };

    // Fetch users for registration chart
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const { data: usersData } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', dateLimit.toISOString());

    // Aggregate registrations by date
    const registrationsMap = new Map<string, number>();
    
    // Initialize all days in range with 0 to ensure continuous chart
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        registrationsMap.set(d.toISOString().split('T')[0], 0);
    }

    if (usersData) {
      usersData.forEach(u => {
        const dateStr = new Date(u.created_at).toISOString().split('T')[0];
        if (registrationsMap.has(dateStr)) {
            registrationsMap.set(dateStr, registrationsMap.get(dateStr)! + 1);
        }
      });
    }

    const registrations = Array.from(registrationsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fetch transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', dateLimit.toISOString());

    let total_revenue = 0;
    const revenueMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueMap.set(d.toISOString().split('T')[0], 0);
    }

    if (txData) {
      txData.forEach(tx => {
        total_revenue += Number(tx.amount);
        const dateStr = new Date(tx.created_at).toISOString().split('T')[0];
        if (revenueMap.has(dateStr)) {
          revenueMap.set(dateStr, revenueMap.get(dateStr)! + Number(tx.amount));
        }
      });
    }

    const revenue_chart = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const data = {
      kpis: {
        total_users: total_users || 0,
        approved_companies: approved_companies || 0,
        active_products: active_products || 0,
        published_tenders: published_tenders || 0,
        total_revenue
      },
      trends,
      charts: {
        registrations,
        revenue: revenue_chart
      }
    };
    
    // Set TTL 5 minutes (300 seconds)
    redisCache.set(cacheKey, data, 300);
    
    return res.json(data);
  } catch (error) {
    logger.error('Exception in admin dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/analytics', verifyRole(['admin']), async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.timeframe as string, 10) || 30, 1), 365);
  try {
    const supabase = getSupabase();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Répartition réelle des entreprises par wilaya (colonne indexée).
    const { data: companies } = await supabase.from('companies').select('wilaya').not('wilaya', 'is', null);
    const palette = ['#1B4D2E', '#0EA5E9', '#F59E0B', '#8B5CF6', '#F43F5E'];
    const wilayaCounts = new Map<string, number>();
    (companies || []).forEach((c: any) => wilayaCounts.set(c.wilaya, (wilayaCounts.get(c.wilaya) || 0) + 1));
    const wilayas = Array.from(wilayaCounts.entries())
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, color: palette[i] }));

    // Inscriptions réelles, regroupées par semaine (≤ 30 j) ou par mois.
    const { data: users } = await supabase.from('users').select('created_at').gte('created_at', since.toISOString());
    const buckets = new Map<string, number>();
    (users || []).forEach((u: any) => {
      const d = new Date(u.created_at);
      const key = days <= 30
        ? `S${Math.floor((d.getTime() - since.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`
        : d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    const registrations = Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));

    // Les recherches ne sont pas encore mesurées : liste vide plutôt que des chiffres inventés.
    return res.json({
      wilayas,
      searchTerms: [],
      registrations,
      totalIntents: null,
      searchTrackingAvailable: false
    });
  } catch (err) {
    logger.error('Error GET /api/admin/analytics', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/audit-logs - Get admin audit logs
router.get('/audit-logs', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn("Could not fetch audit logs from DB (it might not be provisioned yet):", error.message);
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error("Error GET /api/admin/audit-logs:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// GET /api/admin/users
router.get('/users', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select(PUBLIC_USER_COLUMNS).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/companies
router.get('/companies', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/categories
router.get('/categories', verifyRole(['admin']), async (req, res) => {
  try {
    // We should ideally fetch from 'categories' DB. If not found, return fallback.
    const supabase = getSupabase();
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
       // fallback
       return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// GET /api/admin/products - Catalogue complet avec l'entreprise du vendeur
router.get('/products', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('products')
      .select('id, reference_id, name, category, price, status, created_at, owner_id, company:companies(id, name, wilaya)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (typeof req.query.status === 'string' && req.query.status) {
      query = query.eq('status', req.query.status);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    logger.error('Error GET /api/admin/products', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/ads - Toutes les demandes de publicité (y compris en attente)
router.get('/ads', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ads')
      .select('id, title, type, objective, url, duration, status, company, contact_email, contact_phone, message, rejection_reason, created_at, user:users(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    logger.error('Error GET /api/admin/ads', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

const adStatusSchema = z.object({
  status: z.enum(['published', 'rejected', 'en_attente', 'ended']),
  reason: z.string().trim().max(500).optional(),
});

// PATCH /api/admin/ads/:id/status - Publier, refuser ou terminer une campagne
router.patch('/ads/:id/status', verifyRole(['admin']), requireUuidParams('id'), validate(adStatusSchema), async (req, res) => {
  const { status, reason } = req.body;
  if (status === 'rejected' && (!reason || reason.length < 3)) {
    return res.status(400).json({ error: 'Un motif de refus est obligatoire.', code: 'REASON_REQUIRED' });
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ads')
      .update({ status, rejection_reason: status === 'rejected' ? reason : null })
      .eq('id', req.params.id)
      .select('id, title, status')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Publicité introuvable' });
    await logAdminAction(req, 'ad_status_change', { adId: data.id, title: data.title, status, reason });
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error PATCH /api/admin/ads/:id/status', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/support/messages - Boîte de réception du formulaire de contact
router.get('/support/messages', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('contact_messages')
      .select('id, name, email, subject, message, status, admin_note, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200);
    const status = req.query.status;
    if (typeof status === 'string' && ['new', 'in_progress', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    logger.error('Error GET /api/admin/support/messages', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

const supportUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'closed']).optional(),
  admin_note: z.string().trim().max(2000).optional(),
});

// PATCH /api/admin/support/messages/:id - Suivi du traitement
router.patch('/support/messages/:id', verifyRole(['admin']), requireUuidParams('id'), validate(supportUpdateSchema), async (req, res) => {
  const admin = (req as any).user;
  const { status, admin_note } = req.body;
  if (status === undefined && admin_note === undefined) {
    return res.status(400).json({ error: 'Rien à mettre à jour' });
  }
  try {
    const supabase = getSupabase();
    const update: Record<string, any> = { handled_by: admin.id, updated_at: new Date().toISOString() };
    if (status !== undefined) update.status = status;
    if (admin_note !== undefined) update.admin_note = admin_note;
    const { data, error } = await supabase
      .from('contact_messages')
      .update(update)
      .eq('id', req.params.id)
      .select('id, status, admin_note, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Message introuvable' });
    await logAdminAction(req, 'support_message_update', { messageId: data.id, status });
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error PATCH /api/admin/support/messages/:id', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/companies/search?q= - Recherche d'entreprises (facturation)
router.get('/companies/search', verifyRole(['admin']), async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.replace(/[%_,()]/g, ' ').trim().slice(0, 100) : '';
    if (q.length < 2) return res.json({ success: true, data: [] });
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, wilaya, status, plan, plan_ends_at, owner_id')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(10);
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    logger.error('Error GET /api/admin/companies/search', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/pending-counts - Tâches en attente (badges du menu de la console)
router.get('/pending-counts', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const count = (q: any) => q.then((r: any) => r.count || 0);
    const [kyc, support, ads, reports, invoices] = await Promise.all([
      count(supabase.from('kyc_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
      count(supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new')),
      count(supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'en_attente')),
      count(supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
      count(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
    ]);
    res.json({ kyc, support, ads, reports, invoices });
  } catch (error: any) {
    logger.error('Error GET /api/admin/pending-counts', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/moderation - Signalements en attente
router.get('/moderation', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at, reporter:users!reporter_id(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // "type" conservé pour la console existante.
    return res.json({ success: true, data: (data || []).map((r: any) => ({ ...r, type: r.target_type })) });
  } catch (err: any) {
    logger.error('Error GET /api/admin/moderation', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

const REPORT_TABLES: Record<string, string> = { product: 'products', tender: 'tenders' };

// POST /api/admin/moderation/:id/approve - Signalement infondé : le contenu reste en ligne
router.post('/moderation/:id/approve', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    if (error) throw error;
    await logAdminAction(req, 'content_approve', { reportId: id });
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Error approve moderation', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/admin/moderation/:id/reject - Signalement fondé : le contenu est dépublié
router.post('/moderation/:id/reject', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    const { data: report } = await supabase
      .from('reports')
      .select('target_type, target_id')
      .eq('id', id)
      .maybeSingle();
    if (!report) {
      return res.status(404).json({ error: 'Signalement introuvable' });
    }

    const table = REPORT_TABLES[report.target_type];
    if (table) {
      await supabase.from(table).update({ status: 'signalé' }).eq('id', report.target_id);
    }
    // Tous les signalements du même contenu sont clos ensemble.
    await supabase
      .from('reports')
      .update({ status: 'action_taken' })
      .eq('target_type', report.target_type)
      .eq('target_id', report.target_id);

    await logAdminAction(req, 'content_reject', { reportId: id, targetType: report.target_type, targetId: report.target_id });
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Error reject moderation', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'product_delete', { productId: id });
    const supabase = getSupabase();
    await supabase.from('products').delete().eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/admin/companies/:id
router.delete('/companies/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'company_delete', { companyId: id });
    const supabase = getSupabase();
    await supabase.from('companies').delete().eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
