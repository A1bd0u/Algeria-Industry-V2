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
    if (req.params.id.startsWith('mock-')) {
      const mockProducts = [
        {
          id: 'mock-1',
          reference_id: 'PRD-10293',
          name: 'Pompe Hydraulique Industrielle PX-200',
          company_name: 'HydroTech Algerie',
          price: 145000,
          category: 'Chimie & Pétrochimie',
          region: 'Alger',
          file_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
          features: ['Haute pression', 'Acier inoxydable', 'Garantie 2 ans'],
          verified: true,
          owner_id: 'mock-owner-1',
          description: "Pompe hydraulique de très haute qualité pour les applications industrielles lourdes.",
          min_order: 1,
          availability: "En stock"
        },
        {
          id: 'mock-2',
          reference_id: 'PRD-88472',
          name: 'Générateur Électrique 50kVA',
          company_name: 'PowerGen',
          price: 850000,
          category: 'Énergie & Mines',
          region: 'Oran',
          file_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
          features: ['Diesel', 'Silencieux', 'Démarrage auto'],
          verified: true,
          owner_id: 'mock-owner-2',
          description: "Générateur électrique très fiable. Puissance nominale de 50kVA.",
          min_order: 1,
          availability: "Sur commande"
        },
        {
          id: 'mock-3',
          reference_id: 'PRD-33921',
          name: 'Tracteur Agricole T-7000',
          company_name: 'AgriMech',
          price: 4500000,
          category: 'Agroalimentaire',
          region: 'Sétif',
          file_url: 'https://images.unsplash.com/photo-1592982537447-6f296d115e4f?auto=format&fit=crop&w=600&q=80',
          features: ['4 Roues Motrices', 'Cabine climatisée', '120 CV'],
          verified: false,
          owner_id: 'mock-owner-3',
          description: "Tracteur puissant pour les grandes exploitations agricoles.",
          min_order: 1,
          availability: "En stock"
        },
        {
          id: 'mock-4',
          reference_id: 'PRD-55102',
          name: 'Machine de Moulage par Injection',
          company_name: 'PlastMould',
          price: 2100000,
          category: 'Plasturgie & Caoutchouc',
          region: 'Blida',
          file_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
          features: ['Automatique', 'Haute précision', 'Faible conso'],
          verified: true,
          owner_id: 'mock-owner-4',
          description: "Machine de moulage par injection plastique idéale pour l'industrie de l'emballage.",
          min_order: 1,
          availability: "Sur commande"
        },
        {
          id: 'mock-5',
          reference_id: 'PRD-99283',
          name: 'Panneaux Solaires Monocristallins',
          company_name: 'SolarDZ',
          price: 25000,
          category: 'Énergies Renouvelables',
          region: 'Ghardaïa',
          file_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
          features: ['400W', 'Rendement 21%', 'Garantie 25 ans'],
          verified: true,
          owner_id: 'mock-owner-5',
          description: "Panneaux de dernière génération, optimisés pour un ensoleillement maximum.",
          min_order: 10,
          availability: "En stock"
        },
        {
          id: 'mock-6',
          reference_id: 'PRD-11029',
          name: 'Compresseur d\'Air Industriel',
          company_name: 'AirForce',
          price: 320000,
          category: 'Métallurgie & Mécanique',
          region: 'Annaba',
          file_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
          features: ['500L', 'Triphasé', '10 Bar'],
          verified: false,
          owner_id: 'mock-owner-6',
          description: "Compresseur d'air très robuste pour l'industrie mécanique.",
          min_order: 1,
          availability: "En stock"
        },
        {
          id: 'mock-7',
          reference_id: 'PRD-44820',
          name: 'Produit Chimique Industriel Solvant',
          company_name: 'ChemPro',
          price: 4500,
          category: 'Chimie & Pétrochimie',
          region: 'Biskra',
          file_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
          features: ['Fût 200L', 'Pur à 99%', 'Industriel'],
          verified: true,
          owner_id: 'mock-owner-7',
          description: "Solvant industriel pour le traitement et le nettoyage.",
          min_order: 5,
          availability: "En stock"
        },
        {
          id: 'mock-8',
          reference_id: 'PRD-77291',
          name: 'Grue de Levage 10 Tonnes',
          company_name: 'LiftPro',
          price: 12000000,
          category: 'BTPH',
          region: 'Alger',
          file_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
          features: ['Flèche télescopique', 'Cabine confort', 'Sécurité max'],
          verified: true,
          owner_id: 'mock-owner-8',
          description: "Grue de chantier mobile pour la construction de moyenne et grande taille.",
          min_order: 1,
          availability: "Sur commande"
        }
      ];

      const mockProduct = mockProducts.find(p => p.id === req.params.id);
      if (mockProduct) {
        return res.json({
          product: {
            ...mockProduct,
            images: [
              mockProduct.file_url,
              `https://picsum.photos/seed/${mockProduct.id}-2/800/800`,
              `https://picsum.photos/seed/${mockProduct.id}-3/800/800`
            ]
          },
          similar: mockProducts.filter(p => p.id !== mockProduct.id).slice(0, 4)
        });
      }
    }

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

