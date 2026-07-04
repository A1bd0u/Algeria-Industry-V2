import express from 'express';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();

// GET /api/events - Liste des événements
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return res.json(events || []);
  } catch (err: any) {
    console.error("Supabase Error GET /events:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
