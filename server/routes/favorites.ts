import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { requireAuth } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';

const router = express.Router();

const favoriteSchema = z.object({
  item_type: z.enum(['product', 'company']),
  item_id: z.string().uuid(),
});

// GET /api/favorites - Get specific user favorites
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    const { data: favs, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
       throw error;
    }
    
    const productIds = favs?.filter((f: any) => f.item_type === 'product').map((f: any) => f.item_id) || [];
    let products: any[] = [];
    if (productIds.length > 0) {
      const { data: prodData } = await supabase.from('products').select('*').in('id', productIds);
      products = prodData || [];
    }
    const companyIds = favs?.filter((f: any) => f.item_type === 'company').map((f: any) => f.item_id) || [];
    let companies: any[] = [];
    if (companyIds.length > 0) {
      const { data: companyData } = await supabase.from('companies').select('id, name, wilaya, activity_sector').in('id', companyIds);
      companies = companyData || [];
    }

    const enrichedFavs = favs?.map((f: any) => {
       if (f.item_type === 'product') {
          const p = products.find(prod => prod.id === f.item_id);
          return p ? {
             ...f,
             name: p.name,
             category: p.category,
             location: p.region || null,
             image: p.file_url,
             product_id: p.id
          } : f;
       }
       if (f.item_type === 'company') {
          const c = companies.find((company) => company.id === f.item_id);
          return c ? { ...f, name: c.name, category: c.activity_sector || null, location: c.wilaya || null } : f;
       }
       return f;
    });
    
    return res.json(enrichedFavs || []);
  } catch(e: any) {
    logger.error("Supabase Error GET /favorites:", e);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/favorites/item/:itemId
router.delete('/item/:itemId', requireAuth, requireUuidParams('itemId'), async (req, res) => {
  const { itemId } = req.params;
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    // Make sure they own this favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', user.id);
      
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    logger.error("Supabase Error DELETE /favorites/item/:itemId:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/favorites/:id
router.delete('/:id', requireAuth, requireUuidParams('id'), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    // Make sure they own this favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    logger.error("Supabase Error DELETE /favorites/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/favorites
router.post('/', requireAuth, validate(favoriteSchema), async (req, res) => {
  const { item_type, item_id } = req.body;
  const user = (req as any).user;
  try {
    const supabase = getSupabase();

    // Un même élément n'est enregistré qu'une fois.
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .maybeSingle();
    if (existing) return res.json(existing);
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ item_type, item_id, user_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    logger.error("Supabase Error POST /favorites:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
