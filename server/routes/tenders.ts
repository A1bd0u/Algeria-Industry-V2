import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, verifyRole, requireKyc } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { createReport, reportSchema } from '../utils/reports';
import { generateReferenceId } from '../utils/reference';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';


const router = express.Router();

const tenderSchema = z.object({
  title: z.string().trim().min(2, 'Titre requis').max(300),
  description: z.string().trim().min(5, 'Description trop courte').max(20000),
  budget: z.coerce.number().nonnegative().optional().or(z.literal('')),
  deadline: z.string().max(40).optional(),
  category: z.string().max(100).optional(),
  file_url: z.string().url().max(1000).optional().or(z.literal(''))
});

const statusSchema = z.object({
  status: z.enum(['open', 'closed', 'signalé', 'rejeté'])
});

const escapeLike = (value: string) => value.replace(/[%_,()]/g, ' ').slice(0, 100);


// GET /api/tenders - Liste tous les appels d'offres
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    let query = supabase
      .from('tenders')
      .select('*, author:users(name, company)', { count: 'exact' });

    if (typeof req.query.search === 'string' && req.query.search) {
      query = query.ilike('title', `%${escapeLike(req.query.search)}%`);
    }

    if (req.query.status && req.query.status !== 'Tous') {
      query = query.eq('status', req.query.status);
    }

    if (req.query.category && req.query.category !== 'Toutes') {
      query = query.eq('category', req.query.category);
    }

    const { data: tenders, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({
      data: tenders || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err: any) {
    logger.error("Supabase Error GET /tenders:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/tenders/my - Obtenir les appels d'offres de l'utilisateur connecté
router.get('/my', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .eq('author_id', user.id);
    if (error) throw error;
    return res.json(tenders);
  } catch (err: any) {
    logger.error("Supabase Error GET /tenders/my:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/tenders - Créer un appel d'offres
router.post('/', verifyRole(['acheteur', 'fournisseur', 'exposant', 'admin']), requireKyc, validate(tenderSchema), async (req, res) => {
  const { title, description, budget, deadline, category, file_url } = req.body;
  const user = (req as any).user;

  if (!title || !description) {
    return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
  }

  try {
    const supabase = getSupabase();
    const finalDescription = file_url ? `${description}\n\nPièce jointe : ${file_url}` : description;
    const reference_id = generateReferenceId('TND');
    
    const { data, error } = await supabase
      .from('tenders')
      .insert([
        {
          reference_id,
          title,
          description: finalDescription,
          budget: budget === '' || budget === undefined ? null : budget,
          company_id: user.company_id || null,
          deadline: deadline || null,
          category,
          author_id: user.id,
          status: 'open'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (err: any) {
    logger.error("Supabase Error POST /tenders:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/tenders/:id - Obtenir un appel d'offres spécifique
router.get('/:id', requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: tender, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!tender) {
      return res.status(404).json({ error: "Appel d'offres introuvable" });
    }

    return res.json(tender);
  } catch (err: any) {
    logger.error("Supabase Error GET /tenders/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// PUT /api/tenders/:id/status - Changer le statut d'un appel d'offres (Admin)
router.put('/:id/status', verifyRole(['admin']), requireUuidParams('id'), validate(statusSchema), async (req, res) => {
  const { status } = req.body;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    logger.error("Error PUT /tenders/:id/status:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/tenders/:id/report - Signaler un appel d'offres (Users)
router.post('/:id/report', requireAuth, requireUuidParams('id'), validate(reportSchema), async (req, res) => {
  try {
    const result = await createReport('tender', req.params.id, (req as any).user.id, req.body.reason);
    if (!result.found) {
      return res.status(404).json({ error: "Appel d'offres introuvable" });
    }
    return res.json({ success: true, message: 'Signalement transmis à la modération' });
  } catch (err: any) {
    logger.error("Error POST /tenders/:id/report:", err);
    return res.status(500).json({ error: 'Erreur lors du signalement' });
  }
});

// DELETE /api/tenders/:id - Supprimer un appel d'offres (Admin)
router.delete('/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: "Appel d'offres supprimé" });
  } catch (err: any) {
    logger.error("Error DELETE /tenders/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;

