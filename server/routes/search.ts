import express from 'express';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // params
    const q = req.query.q as string || '';
    const type = req.query.type as string || 'all'; // 'all', 'companies', 'products'
    const wilaya = req.query.wilaya as string;
    const sector = req.query.sector as string; // or category for products
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const status = req.query.status as string; // KYC status for companies
    const limit = parseInt(req.query.limit as string) || 12;
    const cursor = req.query.cursor as string; // date string (e.g. 2026-07-05T00:00:00.000Z)

    let companies: any[] = [];
    let products: any[] = [];
    let nextCursor = null;

    // Search Companies
    if (type === 'all' || type === 'companies') {
      let query = supabase.from('companies').select('*');
      
      if (q) {
         // Format search query to be prefix matching: "word:*"
         const formattedQuery = q.split(' ').filter(w => w.length > 0).map(w => `${w}:*`).join(' & ');
         if (formattedQuery) {
            query = query.textSearch('fts', formattedQuery);
         }
      }
      
      if (wilaya) query = query.eq('wilaya', wilaya);
      if (sector) query = query.eq('activity_sector', sector);
      if (status) query = query.eq('status', status);
      
      if (cursor) query = query.lt('created_at', cursor);
      
      query = query.order('created_at', { ascending: false }).limit(limit + 1);
      
      const { data, error } = await query;
      if (error) {
         console.error('Company search error:', error);
         // Fallback if columns don't exist
         if (error.code === '42703') {
            const fallbackQuery = supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(limit + 1);
            const { data: fbData } = await fallbackQuery;
            if (fbData) companies = fbData;
         }
      } else {
         if (data) companies = data;
      }
    }

    // Search Products
    if (type === 'all' || type === 'products') {
      let query = supabase.from('products').select('*');
      
      if (q) {
         const formattedQuery = q.split(' ').filter(w => w.length > 0).map(w => `${w}:*`).join(' & ');
         if (formattedQuery) {
            query = query.textSearch('fts', formattedQuery);
         }
      }
      
      if (sector) query = query.eq('category', sector); // Map sector to category
      if (minPrice !== undefined) query = query.gte('price', minPrice);
      if (maxPrice !== undefined) query = query.lte('price', maxPrice);
      
      if (cursor) query = query.lt('created_at', cursor);
      
      query = query.order('created_at', { ascending: false }).limit(limit + 1);
      
      const { data, error } = await query;
      if (error) {
         console.error('Product search error:', error);
         if (error.code === '42703') {
            const fallbackQuery = supabase.from('products').select('*').order('created_at', { ascending: false }).limit(limit + 1);
            const { data: fbData } = await fallbackQuery;
            if (fbData) products = fbData;
         }
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
    console.error("Error GET /search:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
