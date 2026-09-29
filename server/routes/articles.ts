import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { verifyRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { generateReferenceId } from '../utils/reference';

const router = express.Router();

const ARTICLE_COLUMNS = 'id, reference_id, title, excerpt, content, image_url, category, author, featured, status, created_at, updated_at';

const articleSchema = z.object({
  title: z.string().trim().min(3, 'Titre trop court').max(300),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(20, 'Contenu trop court').max(100000),
  image_url: z.string().url('URL d\'image invalide').max(1000).optional().or(z.literal('')),
  category: z.string().trim().max(100).optional(),
  author: z.string().trim().max(120).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['published', 'draft']).optional(),
});

// Champs attendus par les pages Blog (image, date) en plus des colonnes.
const toPublic = (a: any) => ({ ...a, image: a.image_url, date: a.created_at });

// GET /api/articles - Articles publiés (blog)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: articles, error } = await supabase
      .from('articles')
      .select(ARTICLE_COLUMNS)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return res.json((articles || []).map(toPublic));
  } catch (err: any) {
    logger.error("Supabase Error GET /articles:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/articles/admin/all - Tous les articles, brouillons compris (admin)
router.get('/admin/all', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return res.json((data || []).map(toPublic));
  } catch (err: any) {
    logger.error("Supabase Error GET /articles/admin/all:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/articles/:id - Détails d'un article publié
router.get('/:id', requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: article, error } = await supabase
      .from('articles')
      .select(ARTICLE_COLUMNS)
      .eq('id', req.params.id)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    if (!article) return res.status(404).json({ error: 'Article introuvable' });

    return res.json(toPublic(article));
  } catch (err: any) {
    logger.error("Supabase Error GET /articles/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/articles - Créer un article (admin)
router.post('/', verifyRole(['admin']), validate(articleSchema), async (req, res) => {
  const { title, excerpt, content, image_url, category, author, featured, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .insert([{
        reference_id: generateReferenceId('ART'),
        title,
        excerpt: excerpt || null,
        content,
        image_url: image_url || null,
        category: category || 'Général',
        author: author || user.name,
        author_id: user.id,
        featured: Boolean(featured),
        status: status || 'draft',
      }])
      .select(ARTICLE_COLUMNS)
      .single();

    if (error) throw error;
    return res.status(201).json(toPublic(data));
  } catch (err: any) {
    logger.error("Supabase Error POST /articles:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// PUT /api/articles/:id - Mettre à jour un article (admin)
router.put('/:id', verifyRole(['admin']), requireUuidParams('id'), validate(articleSchema), async (req, res) => {
  const { title, excerpt, content, image_url, category, author, featured, status } = req.body;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .update({
        title,
        excerpt: excerpt || null,
        content,
        image_url: image_url || null,
        category: category || 'Général',
        ...(author !== undefined && { author }),
        ...(featured !== undefined && { featured }),
        ...(status !== undefined && { status }),
      })
      .eq('id', req.params.id)
      .select(ARTICLE_COLUMNS)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Article introuvable' });
    return res.json(toPublic(data));
  } catch (err: any) {
    logger.error("Supabase Error PUT /articles/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/articles/:id - Supprimer un article (admin)
router.delete('/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('articles').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: 'Article supprimé' });
  } catch (err: any) {
    logger.error("Supabase Error DELETE /articles/:id:", err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
