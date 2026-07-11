import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, verifyRole, requireVerified } from '../middlewares/authMiddleware';
import { generateReferenceId } from '../utils/reference';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';


const router = express.Router();

const tenderSchema = z.object({
  title: z.string().min(2, 'Titre requis'),
  description: z.string().min(5, 'Description trop courte'),
  budget: z.number().optional().or(z.string().optional()),
  deadline: z.string().optional(),
  category: z.string().optional(),
  file_url: z.string().optional()
});

const statusSchema = z.object({
  status: z.string().min(1, 'Statut requis')
});

const reportSchema = z.object({
  reason: z.string().min(5, 'Raison trop courte')
});


// GET /api/tenders - Liste tous les appels d'offres
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 12;
    if (limit > 50) limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    let query = supabase
      .from('tenders')
      .select('*, author:users(name, company)', { count: 'exact' });

    if (req.query.search) {
      query = query.ilike('title', `%${req.query.search}%`);
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
    return res.status(500).json({ error: err.message });
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
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tenders - Créer un appel d'offres
router.post('/', verifyRole(['acheteur', 'admin']), requireVerified, validate(tenderSchema), async (req, res) => {
  const { title, description, budget, deadline, category, file_url } = req.body;
  const user = (req as any).user;

  if (!title || !description) {
    return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
  }

  try {
    const supabase = getSupabase();
    const finalDescription = file_url ? `${description}\n\n[ATTACHMENT]: ${file_url}` : description;
    const reference_id = generateReferenceId('TND');
    
    const { data, error } = await supabase
      .from('tenders')
      .insert([
        {
          reference_id,
          title,
          description: finalDescription,
          budget: budget || null,
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
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tenders/:id - Obtenir un appel d'offres spécifique
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: "Appel d'offres non trouvé (ID invalide)" });
    }

    const { data: tender, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      throw error;
    }

    return res.json(tender);
  } catch (err: any) {
    logger.error("Supabase Error GET /tenders/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});


// PUT /api/tenders/:id/status - Changer le statut d'un appel d'offres (Admin)
router.put('/:id/status', verifyRole(['admin']), validate(statusSchema), async (req, res) => {
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
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tenders/:id/report - Signaler un appel d'offres (Users)
router.post('/:id/report', requireAuth, validate(reportSchema), async (req, res) => {
  const { reason } = req.body;
  try {
    const supabase = getSupabase();
    const { data: existing, error: checkErr } = await supabase
      .from('tenders')
      .select('description')
      .eq('id', req.params.id)
      .single();
    
    if (checkErr) throw checkErr;
    const newDescription = existing.description + `

[SIGNALEMENT]: ${reason || 'Contenu inapproprié'}`;
    
    const { data, error } = await supabase
      .from('tenders')
      .update({ status: 'signalé', description: newDescription })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    return res.json({ success: true, message: "Appel d'offres signalé" });
  } catch (err: any) {
    logger.error("Error POST /tenders/:id/report:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tenders/:id - Supprimer un appel d'offres (Admin)
router.delete('/:id', verifyRole(['admin']), async (req, res) => {
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
    return res.status(500).json({ error: err.message });
  }
});

export default router;

