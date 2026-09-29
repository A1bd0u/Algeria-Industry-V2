import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();

const COMPANY_COLUMNS = 'id, reference_id, name, description, activity_sector, wilaya, status, certified, created_at';

// Même configuration que les colonnes fts (migration 20261003090000) :
// français sans accents, racines communes à l'index et à la requête.
const TS_CONFIG = 'fr_unaccent';

// Statuts visibles publiquement (identiques à /api/products).
const PUBLISHED_PRODUCT_STATUSES = ['Actif', 'active'];

const escapeLike = (value: string) => value.replace(/[%_,()]/g, ' ').slice(0, 100);

// Construit une requête tsquery préfixe sûre : seuls lettres et chiffres
// (latin, arabe) sont conservés, pour éviter les erreurs de syntaxe tsquery.
const toPrefixQuery = (q: string) =>
  q
    .normalize('NFKC')
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length > 0)
    .slice(0, 8)
    .map((w) => `${w}:*`)
    .join(' & ');

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // params
    const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 200) : '';
    const type = req.query.type as string || 'all'; // 'all', 'companies', 'products'
    const wilaya = req.query.wilaya as string;
    const sector = req.query.sector as string; // or category for products
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const status = req.query.status as string; // KYC status for companies
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
    const rawCursor = req.query.cursor as string;
    const cursor = rawCursor && !Number.isNaN(Date.parse(rawCursor)) ? new Date(rawCursor).toISOString() : undefined; // date string (e.g. 2026-07-05T00:00:00.000Z)

    let companies: any[] = [];
    let products: any[] = [];
    let nextCursor = null;

    // Search Companies
    if (type === 'all' || type === 'companies') {
      let query = supabase.from('companies').select(COMPANY_COLUMNS);
      
      if (q) {
         // Format search query to be prefix matching: "word:*"
         const formattedQuery = toPrefixQuery(q);
         if (formattedQuery) {
            query = query.textSearch('fts', formattedQuery, { config: TS_CONFIG });
         }
      }
      
      if (wilaya) query = query.eq('wilaya', wilaya);
      if (sector) query = query.eq('activity_sector', sector);
      if (status) query = query.eq('status', status);
      
      if (cursor) query = query.lt('created_at', cursor);
      
      query = query.order('created_at', { ascending: false }).limit(limit + 1);
      
      const { data, error } = await query;
      if (error) {
         logger.error('Company search error:', error);
         // Repli : recherche simple sur le nom (migration de recherche absente).
         let fallbackQuery = supabase.from('companies').select(COMPANY_COLUMNS);
         if (q) fallbackQuery = fallbackQuery.ilike('name', `%${escapeLike(q)}%`);
         const { data: fbData } = await fallbackQuery.order('created_at', { ascending: false }).limit(limit + 1);
         if (fbData) companies = fbData;
      } else {
         if (data) companies = data;
      }
    }

    // Search Products
    if (type === 'all' || type === 'products') {
      let query = supabase.from('products').select('*').in('status', PUBLISHED_PRODUCT_STATUSES);
      
      if (q) {
         const formattedQuery = toPrefixQuery(q);
         if (formattedQuery) {
            query = query.textSearch('fts', formattedQuery, { config: TS_CONFIG });
         }
      }
      
      if (sector) query = query.eq('category', sector); // Map sector to category
      if (minPrice !== undefined) query = query.gte('price', minPrice);
      if (maxPrice !== undefined) query = query.lte('price', maxPrice);
      
      if (cursor) query = query.lt('created_at', cursor);
      
      query = query.order('created_at', { ascending: false }).limit(limit + 1);
      
      const { data, error } = await query;
      if (error) {
         logger.error('Product search error:', error);
         let fallbackQuery = supabase.from('products').select('*').in('status', PUBLISHED_PRODUCT_STATUSES);
         if (q) fallbackQuery = fallbackQuery.ilike('name', `%${escapeLike(q)}%`);
         const { data: fbData } = await fallbackQuery.order('created_at', { ascending: false }).limit(limit + 1);
         if (fbData) products = fbData;
      } else {
         if (data) products = data;
      }
    }

    // Since we search both, we need to handle unified pagination or separate pagination.
    // To keep it simple, if type is 'all', we might return up to `limit` of each, and frontend merges.
    // If we want a unified cursor, we can merge arrays, sort by created_at desc, slice to limit, and the next cursor is the created_at of the last element.
    const allResults = [...companies, ...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const paginatedResults = allResults.slice(0, limit);
    if (allResults.length > limit) {
      nextCursor = paginatedResults[paginatedResults.length - 1].created_at;
    }

    return res.json({
      results: {
         companies: paginatedResults.filter(item => item.activity_sector !== undefined),
         products: paginatedResults.filter(item => item.category !== undefined)
      },
      nextCursor
    });

  } catch (err: any) {
    logger.error("Error GET /search:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
