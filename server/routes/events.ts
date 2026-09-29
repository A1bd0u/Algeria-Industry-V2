import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { verifyRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { logAdminAction } from '../utils/auditLogger';

const router = express.Router();

const EVENT_COLUMNS = 'id, title, description, date, location, organizer, status, created_at';

const eventSchema = z.object({
  title: z.string().trim().min(3, 'Titre requis').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide'),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  organizer: z.string().trim().max(200).optional().or(z.literal('')),
});

const toRow = (body: z.infer<typeof eventSchema>) => ({
  title: body.title,
  description: body.description || null,
  date: new Date(body.date).toISOString(),
  location: body.location || null,
  organizer: body.organizer || null,
});

// GET /api/events - Liste des événements
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: events, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return res.json(events || []);
  } catch (err: any) {
    logger.error("Supabase Error GET /events:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/events - Création (admin)
router.post('/', verifyRole(['admin']), validate(eventSchema), async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('events').insert([toRow(req.body)]).select(EVENT_COLUMNS).single();
    if (error) throw error;
    await logAdminAction(req, 'event_change', { eventId: data.id, title: data.title, action: 'create' });
    return res.status(201).json(data);
  } catch (err) {
    logger.error('Error POST /events', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// PUT /api/events/:id - Modification (admin)
router.put('/:id', verifyRole(['admin']), requireUuidParams('id'), validate(eventSchema), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('events')
      .update(toRow(req.body))
      .eq('id', req.params.id)
      .select(EVENT_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Événement introuvable' });
    await logAdminAction(req, 'event_change', { eventId: data.id, title: data.title, action: 'update' });
    return res.json(data);
  } catch (err) {
    logger.error('Error PUT /events/:id', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/events/:id - Suppression (admin)
router.delete('/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const { error } = await getSupabase().from('events').delete().eq('id', req.params.id);
    if (error) throw error;
    await logAdminAction(req, 'event_change', { eventId: req.params.id, action: 'delete' });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Error DELETE /events/:id', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
