import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { formLimiter } from '../middlewares/rateLimiter';
import { requireUuidParams } from '../middlewares/validateParams';
import { verifyCaptcha } from '../utils/captcha';
import { logger } from '../utils/logger';

const router = express.Router();

const PUBLISHED_STATUSES = ['published', 'Actif', 'approuvée', 'Approuvé'];

// Colonnes publiques : ni user_id ni coordonnées du demandeur.
const PUBLIC_AD_COLUMNS = 'id, title, type, url, status, created_at';
// Contenu affiché dans le bandeau de l'accueil.
const SLIDE_COLUMNS = 'id, title, subtitle, image_url, logo_url, brand_name, cta_label, url, starts_at, ends_at';
const MAX_SLIDES = 8;

const isLive = (ad: { starts_at?: string | null; ends_at?: string | null }, now: number) =>
  (!ad.starts_at || Date.parse(ad.starts_at) <= now) && (!ad.ends_at || Date.parse(ad.ends_at) > now);

const campaignSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(200),
  type: z.string().trim().min(2, 'Type requis').max(100),
  url: z.string().url('URL invalide').max(1000).optional().or(z.literal('')),
  duration: z.string().trim().max(50).optional(),
});

const adRequestSchema = z.object({
  companyName: z.string().trim().min(2, 'Entreprise requise').max(200),
  contactName: z.string().trim().min(2, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(200),
  phone: z.string().trim().max(40).optional(),
  placement: z.string().trim().max(100),
  message: z.string().trim().max(5000).optional(),
  captchaToken: z.string().optional(),
});

// GET /api/campaigns - Annonces publiées et en cours de diffusion, dans
// l'ordre choisi par l'admin.
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: ads, error } = await supabase
      .from('ads')
      .select(SLIDE_COLUMNS)
      .in('status', PUBLISHED_STATUSES)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    const now = Date.now();
    const live = (ads || [])
      .filter((ad: any) => isLive(ad, now))
      .slice(0, MAX_SLIDES)
      .map(({ starts_at, ends_at, ...ad }: any) => ad);
    res.set('Cache-Control', 'public, max-age=60');
    return res.json(live);
  } catch (err: any) {
    logger.error('Error GET /api/campaigns', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/campaigns/:id/click - Clic sur une annonce du bandeau (statistique
// remise à l'annonceur). Toujours 204 : rien à divulguer au visiteur.
router.post('/:id/click', requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: ad } = await supabase
      .from('ads')
      .select('id, clicks')
      .eq('id', req.params.id)
      .in('status', PUBLISHED_STATUSES)
      .maybeSingle();
    if (ad) {
      await supabase.from('ads').update({ clicks: (ad.clicks || 0) + 1 }).eq('id', ad.id);
    }
  } catch (err: any) {
    logger.warn('Error POST /api/campaigns/:id/click', err);
  }
  return res.status(204).end();
});

// POST /api/campaigns - Demande de campagne depuis le tableau de bord
router.post('/', requireAuth, validate(campaignSchema), async (req, res) => {
  const { name, type, url, duration } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ads')
      .insert([{
        title: name,
        type,
        objective: type,
        url: url || null,
        duration: duration || null,
        status: 'en_attente',
        user_id: user.id,
        company: user.company,
        contact_email: user.email
      }])
      .select(PUBLIC_AD_COLUMNS)
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    logger.error('Error POST /api/campaigns', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// POST /api/campaigns/request - Demande publique depuis la page « Publicité »
router.post('/request', formLimiter, validate(adRequestSchema), async (req, res) => {
  const { companyName, contactName, email, phone, placement, message, captchaToken } = req.body;

  if (!(await verifyCaptcha(captchaToken))) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('ads')
      .insert([{
        title: companyName,
        type: placement,
        objective: placement,
        status: 'en_attente',
        company: companyName,
        contact_email: email,
        contact_phone: phone || null,
        message: [contactName, message].filter(Boolean).join('\n\n')
      }]);

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Demande envoyée. Notre équipe vous recontactera.' });
  } catch (err: any) {
    logger.error('Error POST /api/campaigns/request', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;
