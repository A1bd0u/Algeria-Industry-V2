import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireKyc, verifyRole } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';
import { PLAN_LIMITS, getCompanyPlan } from '../services/billingService';
import { PRODUCT_BUCKET, isAllowedImageUrl } from '../utils/storageUrl';

// Catalogues PDF des fournisseurs : déposés depuis le tableau de bord (fichier
// envoyé d'abord via /api/upload), dans la limite de l'offre (1 en gratuit,
// 5 en Basic, illimité en Pro).
const router = express.Router();

const PUBLIC_COLUMNS = 'id, title, description, pdf_url, file_size, company_id, created_at, companies(id, name, status)';
const OWNER_COLUMNS = 'id, title, description, pdf_url, file_size, company_id, status, created_at';

const catalogueSchema = z.object({
  title: z.string().trim().min(3, 'Titre trop court').max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  pdf_url: z.string().url().max(1000),
  file_size: z.coerce.number().int().positive().max(10 * 1024 * 1024).optional(),
});

// GET /api/catalogues - Catalogues publiés, les plus récents d'abord
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('catalogues')
      .select(PUBLIC_COLUMNS)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200);
    if (typeof req.query.company === 'string' && /^[0-9a-f-]{36}$/i.test(req.query.company)) {
      query = query.eq('company_id', req.query.company);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data || []);
  } catch (err: any) {
    logger.error('Supabase Error GET /catalogues:', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// GET /api/catalogues/mine - Catalogues de l'entreprise de l'utilisateur et quota
router.get('/mine', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (!user.company_id) return res.json({ data: [], limit: 0, used: 0 });
  try {
    const supabase = getSupabase();
    const plan = await getCompanyPlan(user.company_id);
    const { data, error } = await supabase
      .from('catalogues')
      .select(OWNER_COLUMNS)
      .eq('company_id', user.company_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ data: data || [], limit: PLAN_LIMITS[plan].catalogues, used: (data || []).length, plan });
  } catch (err) {
    logger.error('Catalogues mine error', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/catalogues - Publier un catalogue PDF
router.post('/', requireAuth, verifyRole(['fournisseur', 'exposant', 'admin']), requireKyc, validate(catalogueSchema), async (req, res) => {
  const user = (req as any).user;
  const { title, description, pdf_url, file_size } = req.body;
  if (!user.company_id) {
    return res.status(403).json({ error: "Complétez d'abord votre fiche entreprise.", code: 'COMPANY_REQUIRED' });
  }
  // Le PDF doit avoir été déposé par l'utilisateur dans le stockage de la plateforme.
  if (!isAllowedImageUrl(pdf_url, user) || !/\.pdf$/i.test(pdf_url)) {
    return res.status(400).json({ error: 'Fichier invalide : déposez un PDF depuis votre tableau de bord.', code: 'CATALOGUE_FILE_INVALID' });
  }
  try {
    const supabase = getSupabase();
    if (user.role !== 'admin') {
      const plan = await getCompanyPlan(user.company_id);
      const limit = PLAN_LIMITS[plan].catalogues;
      if (limit !== null) {
        const { count } = await supabase
          .from('catalogues')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('status', 'published');
        if ((count || 0) >= limit) {
          return res.status(403).json({
            error: `Votre offre permet ${limit} catalogue(s) PDF.`,
            code: 'CATALOGUE_LIMIT_REACHED', plan, limit,
          });
        }
      }
    }
    const { data, error } = await supabase
      .from('catalogues')
      .insert([{
        title,
        description: description || null,
        pdf_url,
        file_size: file_size || null,
        company_id: user.company_id,
        owner_id: user.id,
        status: 'published',
      }])
      .select(OWNER_COLUMNS)
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    logger.error('Catalogue create error', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// DELETE /api/catalogues/:id - Retirer un catalogue (entreprise titulaire ou admin)
router.delete('/:id', requireAuth, requireUuidParams('id'), async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: catalogue } = await supabase
      .from('catalogues')
      .select('id, company_id, pdf_url')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!catalogue || (user.role !== 'admin' && catalogue.company_id !== user.company_id)) {
      return res.status(404).json({ error: 'Catalogue introuvable.' });
    }
    const { error } = await supabase.from('catalogues').delete().eq('id', catalogue.id);
    if (error) throw error;
    // Fichier supprimé du stockage (sans bloquer si c'est impossible).
    const marker = `/object/public/${PRODUCT_BUCKET}/`;
    const at = typeof catalogue.pdf_url === 'string' ? catalogue.pdf_url.indexOf(marker) : -1;
    if (at >= 0) {
      try {
        await supabase.storage.from(PRODUCT_BUCKET).remove([catalogue.pdf_url.slice(at + marker.length)]);
      } catch (storageErr) {
        logger.warn('Catalogue file not removed', storageErr);
      }
    }
    return res.status(204).end();
  } catch (err) {
    logger.error('Catalogue delete error', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
