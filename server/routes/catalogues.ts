import express from 'express';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();

// GET /api/catalogues - Liste tous les catalogues
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: catalogues, error } = await supabase
      .from('catalogues')
      .select('*, companies(name)');

    if (error) {
      throw error;
    }

    return res.json(catalogues || []);
  } catch (err: any) {
    console.error("Supabase Error GET /catalogues:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
