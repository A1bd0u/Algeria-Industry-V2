import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';

import { generateReferenceId } from '../utils/reference';
import { requireAuth } from '../middlewares/authMiddleware';

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
    const supabase = getSupabase();
    
    let query = supabase.from('companies').select('*');
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

    const { data: companies, error } = await query;

    if (error) {
      throw error;
    }
    
    let result = companies || [];
    
    // Fallback in-memory filter for region if the column doesn't exist on schema
    // assuming it might be stored in address or doesn't exist
    if (region && typeof region === 'string') {
       result = result.filter(c => (c.region === region) || (c.address && c.address.includes(region)));
    }

    return res.json(result);
  } catch (err: any) {
    console.error("Supabase Error GET /companies:", err);
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
      .select('*, kyc_requests(status, notes, created_at)')
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
    console.error("Supabase Error GET /companies/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/companies - Créer ou mettre à jour le profil entreprise
router.post('/', validate(companySchema), async (req, res) => {
  const { name, nif, rc, description, activity_sector, owner_id } = req.body;

  if (!name || !owner_id) {
    return res.status(400).json({ error: "Le nom et l'ID du propriétaire sont obligatoires." });
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
      // Update
      const { data, error } = await supabase
        .from('companies')
        .update({ name, nif, rc, description, activity_sector })
        .eq('id', existing.id)
        .select()
        .single();
        
      if (error) throw error;
      return res.json(data);
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
    console.error("Supabase Error PUT /companies/:id:", err);
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
    console.error("Supabase Error DELETE /companies/:id:", err);
    return res.status(500).json({ error: "Erreur lors de la suppression de l'entreprise." });
  }
});

export default router;
