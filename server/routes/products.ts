import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, verifyRole, requireVerified } from '../middlewares/authMiddleware';
import { generateReferenceId } from '../utils/reference';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';


const router = express.Router();

const productSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  category: z.string().optional(),
  price: z.number().positive('Le prix doit être positif').or(z.string()),
  description: z.string().optional(),
  file_url: z.string().optional(),
  status: z.string().optional()
});

const statusSchema = z.object({
  status: z.string().min(1, 'Statut requis')
});

const reportSchema = z.object({
  reason: z.string().min(5, 'Raison trop courte')
});


// GET /api/products - Liste des produits
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 12;
    if (limit > 50) limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (req.query.category && req.query.category !== 'Tous') {
      query = query.eq('category', req.query.category);
    }
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }

    const { data: products, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedProducts = products?.map(p => ({
      ...p,
      file_url: p.file_url || `https://picsum.photos/seed/${p.id}/600/400`,
      color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
    }));

    return res.json({
      data: formattedProducts || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err: any) {
    logger.error("Supabase Error GET /products:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/products/my - Liste des produits de l'utilisateur connecté
router.get('/my', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('owner_id', user.id);

    if (error) throw error;
    
    const formattedProducts = products?.map(p => ({
      ...p,
      file_url: p.file_url || `https://picsum.photos/seed/${p.id}/600/400`,
      color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
    }));

    return res.json(formattedProducts || []);
  } catch (err: any) {
    logger.error("Supabase Error GET /products/my:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - Récupérer un produit
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Check if the id is a valid UUID, otherwise it might fail depending on Supabase version
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        owner:users!owner_id(name, company, company_id, companies:company_id(name, status))
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !product) {
      // Fallback simple fetch just in case the join fails
      const { data: simpleProduct, error: simpleErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();

      if (simpleErr || !simpleProduct) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }
      Object.assign(product || {}, simpleProduct);
    }

    // Format data for frontend consistency
    const file_url = product.file_url || `https://picsum.photos/seed/${product.id}/600/400`;
    
    let companyName = "Entreprise non spécifiée";
    if (product.owner?.companies?.name) companyName = product.owner.companies.name;
    else if (product.owner?.company) companyName = product.owner.company;
    else if (product.owner?.name) companyName = product.owner.name;

    const formattedProduct = {
      ...product,
      file_url,
      images: [
        file_url,
        `https://picsum.photos/seed/${product.id}-2/800/800`,
        `https://picsum.photos/seed/${product.id}-3/800/800`
      ],
      companyName,
      color: product.status === 'Actif' ? 'text-success' : 'text-gray-400',
      priceValue: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.]/g, '') || '0') : (product.price || 850000),
      features: product.features || ['Précision', 'Fiabilité', 'Facile à intégrer'],
      specs: {
        'Catégorie': product.category || 'Standard',
        'Région': 'Alger',
        'Référence': product.reference_id || 'N/A'
      }
    };

    // Obtenir les produits similaires
    const { data: similarProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.category || "Non catégorisé")
      .neq('id', product.id)
      .limit(4);

    const formattedSimilar = similarProducts?.map(p => {
      const pUrl = p.file_url || `https://picsum.photos/seed/${p.id}/600/400`;
      return {
        ...p,
        file_url: pUrl,
        image: pUrl,
        companyName: "Autre entreprise", // Mock fallback
        color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
      };
    }) || [];

    return res.json({ product: formattedProduct, similar: formattedSimilar });
  } catch (err: any) {
    logger.error("Supabase Error GET /products/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products - Créer un produit
router.post('/', verifyRole(['fournisseur', 'admin']), requireVerified, validate(productSchema), async (req, res) => {
  const { name, category, price, description, file_url, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Fallback \`category\` to \`cat\` in db if your schema expects it
    const finalDescription = file_url ? `${description || ''}\n\n[ATTACHMENT]: ${file_url}` : (description || '');
    const reference_id = generateReferenceId('PRD');
    const { data, error } = await supabase
      .from('products')
      .insert([{ reference_id, name, category: category || "Non catégorisé", description: finalDescription, price, status: status || 'Actif', owner_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    
    const responseData = {
        ...data,
        file_url: data.file_url || `https://picsum.photos/seed/${data.id}/600/400`,
        color: data.status === 'Actif' ? 'text-success' : 'text-gray-400'
    };
    return res.status(201).json(responseData);
  } catch (err: any) {
    logger.error("Supabase Error POST /products:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', verifyRole(['fournisseur', 'admin']), validate(productSchema), async (req, res) => {
  const { name, category, price, description, file_url, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Fallback `category` to `cat` in db if your schema expects it
    const finalDescription = file_url ? `${description || ''}\n\n[ATTACHMENT]: ${file_url}` : (description || '');
    
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
      .update({ name, category: category || "Non catégorisé", description: finalDescription, price, status: status || 'Actif' })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    
    const responseData = {
        ...data,
        file_url: data.file_url || `https://picsum.photos/seed/${data.id}/600/400`,
        color: data.status === 'Actif' ? 'text-success' : 'text-gray-400'
    };
    return res.json(responseData);
  } catch (err: any) {
    logger.error("Supabase Error PUT /products/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - Supprimer un produit
router.delete('/:id', verifyRole(['fournisseur', 'admin']), async (req, res) => {
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
    return res.status(500).json({ error: err.message });
  }
});


// PUT /api/products/:id/status - Changer le statut d'un produit (Admin)
router.put('/:id/status', verifyRole(['admin']), validate(statusSchema), async (req, res) => {
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
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/report - Signaler un produit (Users)
router.post('/:id/report', requireAuth, validate(reportSchema), async (req, res) => {
  const { reason } = req.body;
  try {
    const supabase = getSupabase();
    
    // Append reason to description or just change status to "signalé"
    const { data: existing, error: checkErr } = await supabase
      .from('products')
      .select('description')
      .eq('id', req.params.id)
      .single();
      
    if (checkErr) throw checkErr;
    
    const newDescription = existing.description + `

[SIGNALEMENT]: ${reason || 'Contenu inapproprié'}`;
    
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'signalé', description: newDescription })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    return res.json({ success: true, message: 'Produit signalé' });
  } catch (err: any) {
    logger.error("Error POST /products/:id/report:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

