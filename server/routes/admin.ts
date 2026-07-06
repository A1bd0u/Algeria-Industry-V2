import express from 'express';
import { verifyRole } from '../middlewares/authMiddleware';
import { getSupabase } from '../db/supabaseClient';
import rateLimit from 'express-rate-limit';

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
    console.log(`[DASHBOARD_CONSULTATION] User: ${user.id} (${user.email || 'N/A'}), Time: ${new Date().toISOString()}, IP: ${req.ip}`);

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
    console.error('Exception in admin dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/analytics', verifyRole(['admin']), async (req, res) => {
  const days = parseInt(req.query.timeframe as string, 10) || 30;
  
  const wilayaData = days <= 30 ? [
    { name: 'Alger (16)', value: 4500, color: '#1B4D2E' },
    { name: 'Oran (31)', value: 2800, color: '#0EA5E9' },
    { name: 'Sétif (19)', value: 2100, color: '#F59E0B' },
    { name: 'Hassi Messaoud (30)', value: 1900, color: '#8B5CF6' },
    { name: 'Blida (09)', value: 1400, color: '#F43F5E' },
  ] : [
    { name: 'Alger (16)', value: 8500, color: '#1B4D2E' },
    { name: 'Oran (31)', value: 4800, color: '#0EA5E9' },
    { name: 'Sétif (19)', value: 3100, color: '#F59E0B' },
    { name: 'Hassi Messaoud (30)', value: 3000, color: '#8B5CF6' },
    { name: 'Blida (09)', value: 2400, color: '#F43F5E' },
  ];
  
  const termsData = days <= 30 ? [
    { term: 'Turbine', volume: 850 },
    { term: 'Acier', volume: 620 },
    { term: 'Solaire', volume: 540 },
    { term: 'HSE', volume: 480 },
    { term: 'Valves', volume: 390 },
  ] : [
    { term: 'Turbine', volume: 1650 },
    { term: 'Acier', volume: 1420 },
    { term: 'Solaire', volume: 1140 },
    { term: 'HSE', volume: 980 },
    { term: 'Valves', volume: 890 },
  ];

  const registrationsData = days <= 30 ? [
    { month: 'S1', count: 120 },
    { month: 'S2', count: 150 },
    { month: 'S3', count: 200 },
    { month: 'S4', count: 180 },
  ] : [
    { month: 'Jan', count: 120 },
    { month: 'Fév', count: 150 },
    { month: 'Mar', count: 200 },
    { month: 'Avr', count: 180 },
    { month: 'Mai', count: 250 },
    { month: 'Juin', count: 300 },
    { month: 'Juil', count: 90 },
    { month: 'Aoû', count: 110 },
    { month: 'Sep', count: 160 },
    { month: 'Oct', count: 140 },
    { month: 'Nov', count: 190 },
    { month: 'Déc', count: 210 },
  ];

  return res.json({
    wilayas: wilayaData,
    searchTerms: termsData,
    registrations: registrationsData,
    totalIntents: days <= 30 ? 12700 : 21800
  });
});

export default router;
