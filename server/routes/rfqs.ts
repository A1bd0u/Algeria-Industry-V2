import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireEmailVerified } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';

const router = express.Router();

const rfqSchema = z.object({
  title: z.string().trim().min(2).max(300),
  desiredDate: z.string().max(40).optional(),
  items: z.any().optional(),
  budget: z.coerce.number().nonnegative().optional().or(z.literal('')),
});

// GET /api/rfqs - Demandes de devis de l'utilisateur connecté.
// Les budgets des acheteurs ne sont plus exposés publiquement.
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    let query = supabase.from('rfqs').select('*').order('created_at', { ascending: false });
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }
    const { data: rfqs, error } = await query;
    if (error) throw error;
    return res.json(rfqs || []);
  } catch(e: any) {
    logger.error("Supabase Error GET /rfqs:", e);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/rfqs - Submit a new RFQ (Demande de devis)
router.post('/', requireAuth, requireEmailVerified, validate(rfqSchema), async (req, res) => {
  const { title, desiredDate, items, budget } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('rfqs')
      .insert([{
        title,
        target_date: desiredDate || null,
        items,
        budget: budget === '' || budget === undefined ? null : budget,
        buyer: user.company || user.name,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    logger.error("Supabase Error POST /rfqs:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
