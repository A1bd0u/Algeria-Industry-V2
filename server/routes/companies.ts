import { logger } from '../utils/logger';
import { normalizeWhatsapp } from '../utils/phone';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';

import { generateReferenceId } from '../utils/reference';
import { requireAuth, requireEmailVerified, getOptionalUser } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';

const router = express.Router();

const companySchema = z.object({
  name: z.string().trim().min(2, 'Nom obligatoire').max(200),
  nif: z.string().trim().max(50).optional(),
  rc: z.string().trim().max(50).optional(),
  description: z.string().max(5000).optional(),
  activity_sector: z.string().max(200).optional(),
  wilaya: z.string().max(100).optional(),
  // Chaîne vide : supprime le numéro.
  whatsapp: z.string().trim().max(30).optional()
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'La note doit être comprise entre 1 et 5.').max(5, 'La note doit être comprise entre 1 et 5.'),
  comment: z.string().trim().max(2000).optional()
});

// Colonnes publiques d'une entreprise : ni NIF/RC bruts ni motifs KYC.
const PUBLISHED_PRODUCT_STATUSES = ['Actif', 'active'];

const PUBLIC_COMPANY_COLUMNS = 'id, reference_id, name, description, activity_sector, wilaya, status, certified, created_at';


// GET /api/companies - Liste toutes les entreprises (pour l'annuaire)
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();

    let query = supabase.from('companies').select(PUBLIC_COMPANY_COLUMNS, { count: 'exact' });
    const { search, region, sectors, certified } = req.query;

    if (search && typeof search === 'string') {
      // Les caractères de motif PostgREST sont neutralisés.
      query = query.ilike('name', `%${search.replace(/[%_,()]/g, ' ').slice(0, 100)}%`);
    }

    if (sectors && typeof sectors === 'string') {
      query = query.in('activity_sector', sectors.split(',').slice(0, 20));
    }

    if (certified === 'true') {
      query = query.eq('status', 'approved');
    }

    // Filtre par wilaya sur une colonne indexée (plus de chargement complet en mémoire).
    if (region && typeof region === 'string') {
      query = query.eq('wilaya', region.slice(0, 100));
    }

    const { data: companies, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;

    const totalCount = count || 0;
    return res.json({
      data: companies || [],
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err: any) {
    logger.error("Supabase Error GET /companies:", err);
    next(err);
  }
});

// GET /api/companies/:id - Détails d'une entreprise
router.get('/:id', requireUuidParams('id'), async (req, res, next) => {
  try {
    const supabase = getSupabase();

    // kyc_requests n'est jamais exposé publiquement (motifs de rejet, notes internes).
    const { data: company, error } = await supabase
      .from('companies')
      .select(`${PUBLIC_COMPANY_COLUMNS}, owner_id, whatsapp, products(*)`)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!company) {
      return res.status(404).json({ error: "Entreprise introuvable" });
    }

    const viewer = await getOptionalUser(req);
    const isOwnerOrAdmin = Boolean(viewer && (viewer.id === company.owner_id || viewer.role === 'admin'));
    const result: any = {
      ...company,
      // Le public ne voit que les produits publiés.
      products: isOwnerOrAdmin
        ? company.products || []
        : (company.products || []).filter((p: any) => PUBLISHED_PRODUCT_STATUSES.includes(p.status)),
    };
    // Le numéro WhatsApp n'est affiché publiquement que pour une entreprise vérifiée (KYC).
    if (company.status !== 'approved' && !isOwnerOrAdmin) delete result.whatsapp;

    return res.json(result);
  } catch (err: any) {
    logger.error("Supabase Error GET /companies/:id:", err);
    next(err);
  }
});

// GET /api/companies/:id/kyc-status - Dernier statut KYC (propriétaire ou admin)
router.get('/:id/kyc-status', requireAuth, requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: company } = await supabase
      .from('companies')
      .select('owner_id, status')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!company) return res.status(404).json({ error: 'Entreprise introuvable' });
    if (company.owner_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { data: last } = await supabase
      .from('kyc_requests')
      .select('status, notes, created_at')
      .eq('company_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.json({
      status: company.status,
      rejection_reason: last?.status === 'rejected' ? last.notes : null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies - Créer ou mettre à jour le profil entreprise
router.post('/', requireAuth, validate(companySchema), async (req, res) => {
  const { name, nif, rc, description, activity_sector, wilaya } = req.body;
  const owner_id = (req as any).user.id;

  try {
    const supabase = getSupabase();
    
    // Vérifier si l'utilisateur a déjà une entreprise
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', owner_id)
      .maybeSingle();

    if (existing) {
      // Return 409 Conflict if the user already has a company
      return res.status(409).json({ error: "Vous possédez déjà une entreprise." });
    } else {
      // Insert
      const reference_id = generateReferenceId('CMP');
      const { data, error } = await supabase
        .from('companies')
        .insert([{ reference_id, name, nif, rc, description, activity_sector, wilaya, owner_id }])
        .select()
        .single();
        
      if (error) throw error;
      await supabase.from('users').update({ company_id: data.id }).eq('id', owner_id);
      return res.status(201).json(data);
    }
  } catch (err: any) {
    // Supabase Error
    return res.status(500).json({ error: "Erreur lors de la sauvegarde de l'entreprise." });
  }
});

// PUT /api/companies/:id - Mettre à jour une entreprise spécifique
router.put('/:id', requireAuth, requireUuidParams('id'), validate(companySchema), async (req, res) => {
  const { name, nif, rc, description, activity_sector, wilaya, whatsapp } = req.body;
  const user = (req as any).user;

  let whatsappValue: string | null | undefined;
  if (whatsapp !== undefined) {
    whatsappValue = whatsapp === '' ? null : normalizeWhatsapp(whatsapp);
    if (whatsapp !== '' && !whatsappValue) {
      return res.status(400).json({ error: 'Numéro WhatsApp invalide.', code: 'WHATSAPP_INVALID' });
    }
  }

  try {
    const supabase = getSupabase();
    
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('owner_id, status, nif, rc')
      .eq('id', req.params.id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing) return res.status(404).json({ error: "Entreprise non trouvée" });
    if (existing.owner_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "Non autorisé à modifier cette entreprise" });
    }

    // RC et NIF ont été contrôlés lors du KYC : seul un admin peut les modifier ensuite.
    const legalChanged = (nif !== undefined && nif !== existing.nif) || (rc !== undefined && rc !== existing.rc);
    if (existing.status === 'approved' && legalChanged && user.role !== 'admin') {
      return res.status(409).json({ error: 'Le RC et le NIF vérifiés ne peuvent plus être modifiés. Contactez le support.', code: 'COMPANY_LEGAL_LOCKED' });
    }

    const { data, error } = await supabase
      .from('companies')
      .update({ name, nif, rc, description, activity_sector, wilaya, whatsapp: whatsappValue })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    logger.error("Supabase Error PUT /companies/:id:", err);
    return res.status(500).json({ error: "Erreur lors de la modification de l'entreprise." });
  }
});

// DELETE /api/companies/:id - Supprimer une entreprise spécifique
router.delete('/:id', requireAuth, requireUuidParams('id'), async (req, res) => {
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('owner_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing) return res.status(404).json({ error: "Entreprise non trouvée" });
    if (existing.owner_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "Non autorisé à supprimer cette entreprise" });
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    return res.json({ success: true, message: "Entreprise supprimée" });
  } catch (err: any) {
    logger.error("Supabase Error DELETE /companies/:id:", err);
    return res.status(500).json({ error: "Erreur lors de la suppression de l'entreprise." });
  }
});

// GET /api/companies/:id/reviews - Récupérer les avis d'une entreprise
router.get('/:id/reviews', requireUuidParams('id'), async (req, res) => {
  try {
    const supabase = getSupabase();

    // Seul le nom de l'auteur est public : jamais son e-mail.
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, users:user_id(name)')
      .eq('company_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.json((reviews || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || '',
      created_at: r.created_at,
      user: { name: r.users?.name || 'Utilisateur anonyme' }
    })));
  } catch (err: any) {
    logger.error("Error GET /companies/:id/reviews:", err);
    return res.status(500).json({ error: "Erreur lors de la récupération des avis." });
  }
});

// POST /api/companies/:id/reviews - Ajouter un avis sur une entreprise
router.post('/:id/reviews', requireAuth, requireEmailVerified, requireUuidParams('id'), validate(reviewSchema), async (req, res) => {
  const user = (req as any).user;
  const companyId = req.params.id;
  const { rating, comment } = req.body;

  try {
    const supabase = getSupabase();

    const { data: company } = await supabase
      .from('companies')
      .select('id, owner_id')
      .eq('id', companyId)
      .maybeSingle();

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable' });
    }
    if (company.owner_id === user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas évaluer votre propre entreprise.', code: 'REVIEW_OWN_COMPANY' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: user.id,
        company_id: companyId,
        rating,
        comment: comment || '',
        product_id: null
      }])
      .select('id, rating, comment, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({
      id: data.id,
      rating: data.rating,
      comment: data.comment || '',
      created_at: data.created_at,
      user: { name: user.name }
    });
  } catch (err: any) {
    logger.error("Error POST /companies/:id/reviews:", err);
    return res.status(500).json({ error: "Erreur lors de la publication de l'avis." });
  }
});

export default router;
