import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

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

    const enrichedFavs = favs?.map((f: any) => {
       if (f.item_type === 'product') {
          const p = products.find(prod => prod.id === f.item_id);
          return p ? {
             ...f,
             name: p.name,
             category: p.category,
             location: p.region || 'Alger',
             image: p.file_url,
             product_id: p.id
          } : f;
       }
       return f;
    });
    
    return res.json(enrichedFavs || []);
  } catch(e: any) {
    console.error("Supabase Error GET /favorites:", e);
    return res.status(500).json({ error: e.message });
  }
});

// DELETE /api/favorites/item/:itemId
router.delete('/item/:itemId', requireAuth, async (req, res) => {
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
    console.error("Supabase Error DELETE /favorites/item/:itemId:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/favorites/:id
router.delete('/:id', requireAuth, async (req, res) => {
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
    console.error("Supabase Error DELETE /favorites/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/favorites
router.post('/', requireAuth, async (req, res) => {
  const { item_type, item_id } = req.body;
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ item_type, item_id, user_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    console.error("Supabase Error POST /favorites:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
