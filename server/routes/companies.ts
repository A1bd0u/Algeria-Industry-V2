import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';

import { generateReferenceId } from '../utils/reference';
import { requireAuth, requireVerified } from '../middlewares/authMiddleware';

const router = express.Router();

const companySchema = z.object({
  name: z.string().min(2, 'Nom obligatoire'),
  nif: z.string().optional(),
  rc: z.string().optional(),
  description: z.string().optional(),
  activity_sector: z.string().optional(),
  owner_id: z.string().optional()
});


// GET /api/companies - Liste toutes les entreprises (pour l'annuaire)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 12;
    if (limit > 50) limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    
    let query = supabase.from('companies').select('*', { count: 'exact' });
    const { search, region, sectors, certified } = req.query;

    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`);
    }

    if (sectors && typeof sectors === 'string') {
      const sectorList = sectors.split(',');
      query = query.in('activity_sector', sectorList);
    }

    if (certified === 'true') {
      query = query.eq('status', 'approved');
    }

    const { data: companies, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    let result = companies || [];
    let totalCount = count || 0;
    
    // Fallback in-memory filter for region if the column doesn't exist on schema
    // assuming it might be stored in address or doesn't exist
    // Note: If in-memory filter is applied, total count might be inaccurate for pagination.
    if (region && typeof region === 'string') {
       const { data: allCompanies } = await supabase.from('companies').select('*');
       if (allCompanies) {
         let allFiltered = allCompanies;
         if (search && typeof search === 'string') allFiltered = allFiltered.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
         if (sectors && typeof sectors === 'string') {
           const sList = sectors.split(',');
           allFiltered = allFiltered.filter(c => sList.includes(c.activity_sector));
         }
         if (certified === 'true') allFiltered = allFiltered.filter(c => c.status === 'approved');
         
         result = allFiltered.filter(c => (c.region === region) || (c.address && c.address.includes(region)));
         totalCount = result.length;
         result = result.slice(from, to + 1);
       }
    }

    return res.json({
      data: result,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err: any) {
    logger.error("Supabase Error GET /companies:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:id - Détails d'une entreprise
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: "Entreprise non trouvée (ID invalide)" });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('*, kyc_requests(status, notes, created_at), products(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (company && company.kyc_requests && company.kyc_requests.length > 0) {
       company.kyc_requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
       company.rejection_reason = company.kyc_requests[company.kyc_requests.length - 1].notes;
    }


    if (error) {
      throw error;
    }

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.json(company);
  } catch (err: any) {
    if (err.code === '22P02') {
       // Invalid UUID
       return res.status(404).json({ error: "Invalid ID format" });
    }
    logger.error("Supabase Error GET /companies/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/companies - Créer ou mettre à jour le profil entreprise
router.post('/', requireAuth, validate(companySchema), async (req, res) => {
  const { name, nif, rc, description, activity_sector } = req.body;
  const owner_id = (req as any).user.id;

  if (!name) {
    return res.status(400).json({ error: "Le nom de l'entreprise est obligatoire." });
  }

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
        .insert([{ reference_id, name, nif, rc, description, activity_sector, owner_id }])
        .select()
        .single();
        
      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (err: any) {
    // Supabase Error
    return res.status(500).json({ error: "Erreur lors de la sauvegarde de l'entreprise." });
  }
});

// PUT /api/companies/:id - Mettre à jour une entreprise spécifique
router.put('/:id', requireAuth, validate(companySchema), async (req, res) => {
  const { name, nif, rc, description, activity_sector } = req.body;
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
      return res.status(403).json({ error: "Non autorisé à modifier cette entreprise" });
    }

    const { data, error } = await supabase
      .from('companies')
      .update({ name, nif, rc, description, activity_sector })
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
router.delete('/:id', requireAuth, async (req, res) => {
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
router.get('/:id/reviews', async (req, res) => {
  try {
    const supabase = getSupabase();
    const companyId = req.params.id;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users:user_id(id, name, email)')
      .is('product_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter and format company reviews
    const companyReviews = (reviews || []).map(r => {
      try {
        const parsed = JSON.parse(r.comment || '{}');
        if (parsed.company_id === companyId) {
          return {
            id: r.id,
            rating: r.rating,
            comment: parsed.text || '',
            created_at: r.created_at,
            user: r.users || { name: 'Utilisateur anonyme', email: '' }
          };
        }
      } catch (e) {
        // Not JSON or other format - ignore
      }
      return null;
    }).filter(Boolean);

    return res.json(companyReviews);
  } catch (err: any) {
    logger.error("Error GET /companies/:id/reviews:", err);
    return res.status(500).json({ error: "Erreur lors de la récupération des avis." });
  }
});

// POST /api/companies/:id/reviews - Ajouter un avis sur une entreprise
router.post('/:id/reviews', requireAuth, requireVerified, async (req, res) => {
  const user = (req as any).user;
  const companyId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "La note doit être comprise entre 1 et 5." });
  }

  try {
    const supabase = getSupabase();

    // Store company_id and real comment as JSON in the comment field
    const serializedComment = JSON.stringify({
      company_id: companyId,
      text: comment || ''
    });

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: user.id,
        rating,
        comment: serializedComment,
        product_id: null
      }])
      .select('*, users:user_id(id, name, email)')
      .single();

    if (error) throw error;

    const formatted = {
      id: data.id,
      rating: data.rating,
      comment: comment || '',
      created_at: data.created_at,
      user: data.users || { name: user.name, email: user.email }
    };

    return res.status(201).json(formatted);
  } catch (err: any) {
    logger.error("Error POST /companies/:id/reviews:", err);
    return res.status(500).json({ error: "Erreur lors de la publication de l'avis." });
  }
});

export default router;
