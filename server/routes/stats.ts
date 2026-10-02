import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { getOptionalUser, requireAuth, verifyRole } from '../middlewares/authMiddleware';
import { isUuid } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';
import { trackLimiter } from '../middlewares/rateLimiter';
import { PLAN_LIMITS, getCompanyPlan } from '../services/billingService';
import { AUDIENCE_TYPES, AudienceType, isBot, recordAudience, resolveTarget, visitorHash } from '../services/audienceService';

const router = express.Router();

// Compteurs publics réels (accueil, page Exposants), mis en cache 10 minutes :
// aucun chiffre affiché sur le site n'est inventé.
const PUBLIC_STATS_TTL_MS = 10 * 60 * 1000;
let publicStatsCache: { at: number; value: { verifiedCompanies: number; publishedProducts: number } } | null = null;

export const resetPublicStatsCache = () => { publicStatsCache = null; };

router.get('/public', async (req, res) => {
  if (publicStatsCache && Date.now() - publicStatsCache.at < PUBLIC_STATS_TTL_MS) {
    return res.json(publicStatsCache.value);
  }
  try {
    const supabase = getSupabase();
    const [companies, products] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('products').select('id', { count: 'exact', head: true }).in('status', ['Actif', 'active']),
    ]);
    if (companies.error) throw companies.error;
    if (products.error) throw products.error;
    const value = { verifiedCompanies: companies.count || 0, publishedProducts: products.count || 0 };
    publicStatsCache = { at: Date.now(), value };
    return res.json(value);
  } catch (err: any) {
    logger.error('Supabase Error GET /stats/public:', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

router.get('/dashboard', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const timeframe = req.query.timeframe === '1y' ? '1y' : '6m';

  if (!isUuid(user.id)) {
    return res.status(400).json({ error: 'Identifiant invalide', code: 'INVALID_ID' });
  }

  try {
    const supabase = getSupabase();
    
    // Instead of rfqs/tenders, we will count favorites/ads based on role
    // For 'fournisseur', count messages where they are receiver or sender
    const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // Count Ads
    const { count: adsCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true }); // Assuming global count for now as ads don't have owner_id

    // Les produits sont rattachés à leur créateur (owner_id).
    const { count: ownedProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
    const productsCount = ownedProducts || 0;

    // Fetch messages group by month for the chart
    const daysLimit = timeframe === '1y' ? 365 : 180;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysLimit);
    
    const { data: messagesData } = await supabase
        .from('messages')
        .select('created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gte('created_at', dateLimit.toISOString());

    const { data: productsData } = await supabase
        .from('products')
        .select('created_at')
        .eq('owner_id', user.id)
        .gte('created_at', dateLimit.toISOString());

    // Aggregate by month
    const months6 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const months12 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const timeLabels = timeframe === '1y' ? months12 : months6;
    
    // We group by month index 
    const groupedMessages = new Array(timeLabels.length).fill(0);
    const groupedProducts = new Array(timeLabels.length).fill(0);
    
    const currentMonth = new Date().getMonth();
    
    if (messagesData) {
        messagesData.forEach((m: any) => {
            const mMonth = new Date(m.created_at).getMonth();
            const idx = (mMonth - currentMonth + timeLabels.length - 1) % timeLabels.length;
            if (idx >= 0 && idx < timeLabels.length) groupedMessages[idx]++;
        });
    }

    if (productsData) {
        productsData.forEach((p: any) => {
            const mMonth = new Date(p.created_at).getMonth();
            const idx = (mMonth - currentMonth + timeLabels.length - 1) % timeLabels.length;
            if (idx >= 0 && idx < timeLabels.length) groupedProducts[idx]++;
        });
    }

    const chartData = timeLabels.map((month, index) => {
      if (user.role === 'acheteur' || user.role === 'admin') {
         return {
           name: month,
           messages: groupedMessages[index],
           favoris: 0
         }
      } else {
         // Les visites ne sont pas encore mesurées : null = « bientôt disponible »
         // plutôt qu'un chiffre inventé.
         return {
           name: month,
           produits: groupedProducts[index],
           visites: null,
           contacts: groupedMessages[index]
         }
      }
    });

    return res.json({
        chartData,
        visitsAvailable: false,
        metrics: {
            items: productsCount,
            messages: messagesCount || 0,
            ads: adsCount || 0
        }
    });
  } catch (err: any) {
    logger.error("Stats Error:", err);
    return res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
});

// POST /api/stats/track - Vue d'une fiche entreprise ou produit, clic
// WhatsApp, téléchargement de catalogue. Réponse 204 dans tous les cas utiles :
// la mesure ne doit jamais gêner la navigation.
const trackSchema = z.object({
  type: z.enum(AUDIENCE_TYPES),
  id: z.string().refine(isUuid, 'Identifiant invalide'),
});

router.post('/track', trackLimiter, validate(trackSchema), async (req, res) => {
  const { type, id } = req.body as { type: AudienceType; id: string };
  if (isBot(req)) return res.status(204).end();
  try {
    const target = await resolveTarget(type, id);
    if (!target) return res.status(204).end();
    // Le fournisseur qui consulte sa propre fiche n'est pas compté.
    const viewer = await getOptionalUser(req);
    if (viewer?.company_id && viewer.company_id === target.companyId) return res.status(204).end();
    await recordAudience(type, target, visitorHash(req));
    return res.status(204).end();
  } catch (err) {
    logger.error('Track error', err);
    return res.status(204).end();
  }
});

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// GET /api/stats/supplier?days=30 - Statistiques de la fiche du fournisseur,
// selon son offre : aucune en gratuit, vues en Basic, détail complet en Pro.
router.get('/supplier', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const days = req.query.days === '90' ? 90 : req.query.days === '7' ? 7 : 30;
  if (!user.company_id || !isUuid(user.company_id)) {
    return res.status(404).json({ error: 'Aucune fiche entreprise.', code: 'COMPANY_REQUIRED' });
  }
  try {
    const supabase = getSupabase();
    const plan = await getCompanyPlan(user.company_id);
    const level = user.role === 'admin' ? 'advanced' : PLAN_LIMITS[plan].stats;
    if (level === 'none') return res.json({ plan, level, days });

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (days - 1));
    const sinceDay = dayKey(since);

    const { data: events, error } = await supabase
      .from('audience_events')
      .select('type, product_id, day')
      .eq('company_id', user.company_id)
      .gte('day', sinceDay)
      .limit(100000);
    if (error) throw error;

    // Série quotidienne complète (jours sans visite à 0).
    const series = new Map<string, { day: string; companyViews: number; productViews: number; whatsappClicks: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = dayKey(d);
      series.set(key, { day: key, companyViews: 0, productViews: 0, whatsappClicks: 0 });
    }
    const totals = { companyViews: 0, productViews: 0, whatsappClicks: 0, catalogueDownloads: 0 };
    const perProduct = new Map<string, number>();
    for (const e of events || []) {
      const point = series.get(String(e.day).slice(0, 10));
      if (e.type === 'company_view') { totals.companyViews++; if (point) point.companyViews++; }
      else if (e.type === 'product_view') {
        totals.productViews++;
        if (point) point.productViews++;
        if (e.product_id) perProduct.set(e.product_id, (perProduct.get(e.product_id) || 0) + 1);
      } else if (e.type === 'whatsapp_click') { totals.whatsappClicks++; if (point) point.whatsappClicks++; }
      else if (e.type === 'catalogue_download') totals.catalogueDownloads++;
    }

    if (level === 'basic') {
      return res.json({
        plan, level, days,
        totals: { companyViews: totals.companyViews, productViews: totals.productViews },
        daily: [...series.values()].map(({ day, companyViews, productViews }) => ({ day, companyViews, productViews })),
      });
    }

    // Contacts : acheteurs distincts qui ont écrit au fournisseur sur la période.
    const { data: company } = await supabase.from('companies').select('owner_id').eq('id', user.company_id).maybeSingle();
    let contacts = 0;
    if (company?.owner_id) {
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', company.owner_id)
        .gte('created_at', since.toISOString())
        .limit(20000);
      contacts = new Set((messages || []).map((m: any) => m.sender_id).filter(Boolean)).size;
    }

    const topIds = [...perProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    let topProducts: { id: string; name: string; views: number }[] = [];
    if (topIds.length > 0) {
      const { data: products } = await supabase.from('products').select('id, name').in('id', topIds.map(([id]) => id));
      const names = new Map((products || []).map((p: any) => [p.id, p.name]));
      topProducts = topIds.map(([id, views]) => ({ id, name: names.get(id) || '', views })).filter((p) => p.name);
    }

    return res.json({
      plan, level, days,
      totals: { ...totals, contacts },
      daily: [...series.values()],
      topProducts,
    });
  } catch (err) {
    logger.error('Supplier stats error', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

router.get('/admin', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const now = new Date();
    
    // First day of current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // First day of previous month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const getStats = async (table: string, filters: any = {}) => {
        let qTotal = supabase.from(table).select('*', { count: 'exact', head: true });
        let qLastMonth = supabase.from(table).select('*', { count: 'exact', head: true }).gte('created_at', startOfLastMonth).lt('created_at', startOfCurrentMonth);
        let qThisMonth = supabase.from(table).select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth);
        
        for (const [k, v] of Object.entries(filters)) {
             qTotal = qTotal.eq(k, v);
             qLastMonth = qLastMonth.eq(k, v);
             qThisMonth = qThisMonth.eq(k, v);
        }

        const [t, l, c] = await Promise.all([qTotal, qLastMonth, qThisMonth]);
        
        const total = t.count || 0;
        const last = l.count || 0;
        const current = c.count || 0;
        
        let trend = 0;
        if (last === 0) {
            trend = current > 0 ? 100 : 0; 
        } else {
            trend = ((current - last) / last) * 100;
        }

        return { total, last, current, trend: trend.toFixed(1) };
    };

    const users = await getStats('users');
    const companies = await getStats('companies', { status: 'approved' });
    const products = await getStats('products');
    const ads = await getStats('ads'); // Replaced tenders with ads

    return res.json({
        users,
        companies,
        products,
        tenders: ads // keeping key as tenders so UI doesn't break
    });
  } catch (err: any) {
    logger.error("Stats Admin Error:", err);
    return res.status(500).json({ error: "Erreur lors du calcul des statistiques admin" });
  }
});

export default router;
