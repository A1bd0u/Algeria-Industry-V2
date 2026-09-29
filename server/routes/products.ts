import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, verifyRole, requireKyc } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { createReport, reportSchema } from '../utils/reports';
import { PLAN_LIMITS, getCompanyPlan } from '../services/billingService';
import { generateReferenceId } from '../utils/reference';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';


const router = express.Router();

const productSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(200),
  category: z.string().max(100).optional(),
  // Prix optionnel : null = « sur devis ». Plus de prix par défaut inventé.
  price: z.coerce.number().nonnegative('Le prix doit être positif').nullable().optional(),
  description: z.string().max(10000).optional(),
  file_url: z.string().url().max(1000).optional().or(z.literal('')),
  status: z.enum(['Actif', 'Brouillon', 'Inactif']).optional()
});

const statusSchema = z.object({
  status: z.enum(['Actif', 'Brouillon', 'Inactif', 'signalé', 'rejeté'])
});

// 'active' : valeur par défaut historique du schéma initial.
const PUBLISHED_STATUSES = ['Actif', 'active'];

const escapeLike = (value: string) => value.replace(/[%_,()]/g, ' ').slice(0, 100);

// Plus d'images picsum : sans visuel, le front affiche l'image générique de la marque.
const formatProduct = (p: any) => ({
  ...p,
  file_url: p.file_url || null,
  color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
});


// GET /api/products - Liste des produits
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    let query = supabase.from('products').select('*', { count: 'exact' }).in('status', PUBLISHED_STATUSES);

    if (typeof req.query.category === 'string' && req.query.category !== 'Tous') {
      query = query.eq('category', req.query.category);
    }
    if (typeof req.query.search === 'string' && req.query.search) {
      query = query.ilike('name', `%${escapeLike(req.query.search)}%`);
    }

    const { data: products, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.json({
      data: (products || []).map(formatProduct),
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err: any) {
    logger.error("Supabase Error GET /products:", err);
    next(err);
  }
});

// GET /api/products/my - Liste des produits de l'utilisateur connecté
router.get('/my', requireAuth, async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('owner_id', user.id);

    if (error) throw error;
    
    return res.json((products || []).map(formatProduct));
  } catch (err: any) {
    logger.error("Supabase Error GET /products/my:", err);
    next(err);
  }
});

// GET /api/products/:id - Récupérer un produit
router.get('/:id', requireUuidParams('id'), async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!product) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    // Entreprise du vendeur : via company_id, sinon via le propriétaire.
    let company: any = null;
    if (product.company_id) {
      const { data } = await supabase
        .from('companies')
        .select('id, name, status, wilaya')
        .eq('id', product.company_id)
        .maybeSingle();
      company = data;
    }
    let owner: any = null;
    if (product.owner_id) {
      const { data } = await supabase
        .from('users')
        .select('id, name, company, company_id')
        .eq('id', product.owner_id)
        .maybeSingle();
      owner = data;
      if (!company && owner?.company_id) {
        const { data: c } = await supabase
          .from('companies')
          .select('id, name, status, wilaya')
          .eq('id', owner.company_id)
          .maybeSingle();
        company = c;
      }
    }

    const companyName = company?.name || owner?.company || null;
    const specs: Record<string, string> = {};
    if (product.category) specs['Catégorie'] = product.category;
    if (product.brand) specs['Marque'] = product.brand;
    if (product.region || company?.wilaya) specs['Région'] = product.region || company.wilaya;
    if (product.reference_id) specs['Référence'] = product.reference_id;

    const priceValue = product.price === null || product.price === undefined || product.price === ''
      ? null
      : Number(product.price);

    const formattedProduct = {
      ...formatProduct(product),
      images: product.file_url ? [product.file_url] : [],
      companyName,
      companyId: company?.id || null,
      companyVerified: company?.status === 'approved',
      sellerId: product.owner_id || null,
      priceValue: Number.isFinite(priceValue) ? priceValue : null,
      features: Array.isArray(product.features) ? product.features : [],
      specs
    };

    let similarQuery = supabase
      .from('products')
      .select('*')
      .neq('id', product.id)
      .in('status', PUBLISHED_STATUSES)
      .limit(4);
    if (product.category) similarQuery = similarQuery.eq('category', product.category);
    const { data: similarProducts } = await similarQuery;

    const similarCompanyIds = Array.from(new Set((similarProducts || []).map((p: any) => p.company_id).filter(Boolean)));
    const companyNames = new Map<string, string>();
    if (similarCompanyIds.length > 0) {
      const { data: comps } = await supabase.from('companies').select('id, name').in('id', similarCompanyIds);
      (comps || []).forEach((c: any) => companyNames.set(c.id, c.name));
    }

    const formattedSimilar = (similarProducts || []).map((p: any) => ({
      ...formatProduct(p),
      image: p.file_url || null,
      companyName: (p.company_id && companyNames.get(p.company_id)) || null
    }));

    return res.json({ product: formattedProduct, similar: formattedSimilar });
  } catch (err: any) {
    logger.error("Supabase Error GET /products/:id:", err);
    next(err);
  }
});

// POST /api/products - Créer un produit
router.post('/', verifyRole(['fournisseur', 'exposant', 'admin']), requireKyc, validate(productSchema), async (req, res, next) => {
  const { name, category, price, description, file_url, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Limite de produits selon l'offre (Free 5, Basic 15, Pro illimité).
    if (user.role !== 'admin') {
      const plan = await getCompanyPlan(user.company_id);
      const limit = PLAN_LIMITS[plan].products;
      if (limit !== null) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);
        if ((count || 0) >= limit) {
          return res.status(403).json({
            error: `Votre offre permet ${limit} produits. Passez à une offre supérieure pour en publier davantage.`,
            code: 'PLAN_LIMIT_REACHED',
            plan,
            limit,
          });
        }
      }
    }

    const reference_id = generateReferenceId('PRD');
    // owner_id ET company_id sont renseignés : statistiques, suppression et
    // fiche entreprise s'appuient sur l'un ou l'autre.
    const { data, error } = await supabase
      .from('products')
      .insert([{
        reference_id,
        name,
        category: category || "Non catégorisé",
        description: description || '',
        file_url: file_url || null,
        price: price ?? null,
        status: status || 'Actif',
        owner_id: user.id,
        company_id: user.company_id || null
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(formatProduct(data));
  } catch (err: any) {
    logger.error("Supabase Error POST /products:", err);
    next(err);
  }
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', verifyRole(['fournisseur', 'exposant', 'admin']), requireUuidParams('id'), validate(productSchema), async (req, res, next) => {
  const { name, category, price, description, file_url, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Ensure product exists and belongs to user (or user is admin)
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('owner_id')
      .eq('id', req.params.id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (existing.owner_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized to edit this product" });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ name, category: category || "Non catégorisé", description: description || '', file_url: file_url || null, price: price ?? null, status: status || 'Actif' })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    
    return res.json(formatProduct(data));
  } catch (err: any) {
    logger.error("Supabase Error PUT /products/:id:", err);
    next(err);
  }
});

// DELETE /api/products/:id - Supprimer un produit
router.delete('/:id', verifyRole(['fournisseur', 'exposant', 'admin']), requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Ensure product exists and belongs to user (or user is admin)
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('owner_id')
      .eq('id', req.params.id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (existing.owner_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized to delete this product" });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    
    return res.json({ success: true, message: "Product deleted" });
  } catch (err: any) {
    logger.error("Supabase Error DELETE /products/:id:", err);
    next(err);
  }
});


// PUT /api/products/:id/status - Changer le statut d'un produit (Admin)
router.put('/:id/status', verifyRole(['admin']), requireUuidParams('id'), validate(statusSchema), async (req, res, next) => {
  const { status } = req.body;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    logger.error("Error PUT /products/:id/status:", err);
    next(err);
  }
});

// POST /api/products/:id/report - Signaler un produit (Users)
// Le signalement est enregistré à part : le produit reste en ligne jusqu'à décision admin.
router.post('/:id/report', requireAuth, requireUuidParams('id'), validate(reportSchema), async (req, res, next) => {
  try {
    const result = await createReport('product', req.params.id, (req as any).user.id, req.body.reason);
    if (!result.found) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    return res.json({ success: true, message: 'Signalement transmis à la modération' });
  } catch (err: any) {
    logger.error("Error POST /products/:id/report:", err);
    next(err);
  }
});

export default router;

