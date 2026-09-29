import { logger } from '../utils/logger';
import express from 'express';
import { verifyRole } from '../middlewares/authMiddleware';
import { getSupabase } from '../db/supabaseClient';
import rateLimit from 'express-rate-limit';
import { logAdminAction } from '../utils/auditLogger';
import { requireUuidParams } from '../middlewares/validateParams';
import { PUBLIC_USER_COLUMNS } from '../utils/userFields';

const router = express.Router();

const adminDashboardLimiter = rateLimit({
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
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      // Current month
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', startOfCurrentMonth),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', startOfCurrentMonth),
      // Previous month
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', startOfPreviousMonth).lt('created_at', startOfCurrentMonth),
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

// GET /api/admin/roles
router.get('/roles', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('roles').select('*');
    if (error) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/admin/support/tickets
router.get('/support/tickets', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('support_tickets').select('*');
    if (error) {
       return res.json({ success: true, data: [] });
    }
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


// GET /api/admin/products
router.get('/products', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    res.json({ success: true, data: error ? [] : data });
  } catch (error: any) { res.status(500).json({ error: 'Une erreur interne est survenue.' }); }
});

// GET /api/admin/ads
router.get('/ads', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    res.json({ success: true, data: error ? [] : data });
  } catch (error: any) { res.status(500).json({ error: 'Une erreur interne est survenue.' }); }
});

// GET /api/admin/exhibitors
router.get('/exhibitors', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('exhibitors').select('*');
    if (error) {
       return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (error: any) { res.status(500).json({ error: 'Une erreur interne est survenue.' }); }
});

// GET /api/admin/telemetry
router.get('/telemetry', verifyRole(['admin']), async (req, res) => {
  res.json({ success: true, data: { visits: [], events: [] } });
});

// GET /api/admin/cms
router.get('/cms', verifyRole(['admin']), async (req, res) => {
  res.json({ success: true, data: [] });
});

// GET /api/admin/settings
router.get('/settings', verifyRole(['admin']), async (req, res) => {
  res.json({ success: true, data: {} });
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
