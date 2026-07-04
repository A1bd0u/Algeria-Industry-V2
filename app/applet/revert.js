const fs = require('fs');

const authTs = `import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'algiers_industry_super_secure_secret_2026';

// API - Auth - Get Current User
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié - Aucun token fourni' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Attempt to fetch from Supabase
    try {
      const supabase = getSupabase();
      const { data: foundUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();
        
      if (foundUser && !error) {
        foundUser.isVerified = Boolean(foundUser.isVerified);
        return res.json({ user: foundUser });
      }
    } catch (dbError) {
      // Supabase not configured yet, fallback to JWT decoded payload for smooth preview
      console.warn("Supabase check failed on /me:", dbError);
    }
    
    return res.json({ user: decoded }); // Fallback to token data
  } catch (err) {
    return res.status(401).json({ error: 'Session expirée ou invalide' });
  }
});

// API - Auth - Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez saisir l\\'email et le mot de passe' });
  }

  try {
    const supabase = getSupabase();
    
    // Check if exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (!user || error) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      isVerified: Boolean(user.isVerified)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '72h' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 72 * 60 * 60 * 1000
    });

    return res.json({ user: payload });
  } catch (err: any) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API - Auth - Register
router.post('/register', async (req, res) => {
  const { name, email, company, role, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const supabase = getSupabase();
    
    // Check if exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Un compte avec cette adresse email existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const cRoles = role || 'acheteur';
    const cCompany = company || 'Entreprise DZ';
    
    const { data: newUserRow, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name: name,
          email: email,
          company: cCompany,
          role: cRoles,
          passwordHash: hashedPassword,
          isVerified: false
        }
      ])
      .select()
      .single();
      
    if (insertError || !newUserRow) {
      console.error(insertError);
      return res.status(500).json({ error: "Erreur lors de l'inscription dans la base de données" });
    }

    // Automatically create a KYC request for 'fournisseur' / 'exposant' so the admin can review them
    if (cRoles === 'fournisseur' || cRoles === 'exposant') {
      await supabase.from('kyc_requests').insert([
        {
          user_id: newUserRow.id,
          name: cCompany,
          activity: 'Vente et Distribution',
          status: 'pending',
          date: new Date().toLocaleDateString('fr-FR'),
          docs: ['RC', 'NIF', 'NIS', 'RIB']
        }
      ]);
    }

    const payload = {
        id: newUserRow.id,
        name: newUserRow.name,
        email: newUserRow.email,
        company: newUserRow.company,
        role: newUserRow.role,
        isVerified: false
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '72h' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 72 * 60 * 60 * 1000
    });

    return res.json({ success: true, user: payload, message: "Inscription réussie avec Supabase" });
  } catch (err: any) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API - Auth - Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict'
  });
  return res.json({ success: true, message: 'Déconnexion réussie' });
});

export default router;
`;

const productsTs = `import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/products - Liste des produits
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Convert string colors if they don't exist
    const enhancedProducts = (products || []).map(p => ({
      ...p,
      color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
    }));

    return res.json(enhancedProducts);
  } catch (err: any) {
    console.error("Supabase Error GET /products:", err);
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
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const enhancedProducts = (products || []).map(p => ({
      ...p,
      color: p.status === 'Actif' ? 'text-success' : 'text-gray-400'
    }));

    return res.json(enhancedProducts);
  } catch (err: any) {
    console.error("Supabase Error GET /products/my:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products - Créer un produit
router.post('/', requireAuth, requireRole(['fournisseur', 'admin']), async (req, res) => {
  const { name, category, price, description, file_url, status } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // Fallback \`category\` to \`cat\` in db if your schema expects it
    const finalDescription = file_url ? \`${description || ''}\\n\\n[ATTACHMENT]: ${file_url}\` : (description || '');
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, category: category || "Non catégorisé", description: finalDescription, price, status: status || 'Actif', owner_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    
    const responseData = {
        ...data,
        color: data.status === 'Actif' ? 'text-success' : 'text-gray-400'
    };
    return res.status(201).json(responseData);
  } catch (err: any) {
    console.error("Supabase Error POST /products:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
`;

const tendersTs = `import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/tenders - Liste tous les appels d'offres
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // We select without joining users if the users table causes issues, but we can try it first.
    // If it fails with users, it will jump to catch
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json(tenders || []);
  } catch (err: any) {
    console.error("Supabase Error GET /tenders:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tenders/my - Obtenir les appels d'offres de l'utilisateur connecté
router.get('/my', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    // For "acheteur" get their own tenders. For "fournisseur" get tenders they applied to?
    // Actually the prompt says: "Acheteur only show user's company tenders". So we filter by author_id
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json(tenders || []);
  } catch (err: any) {
    console.error("Supabase Error GET /tenders/my:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tenders - Créer un appel d'offres
router.post('/', requireAuth, requireRole(['acheteur', 'admin']), async (req, res) => {
  const { title, description, budget, deadline, category, file_url } = req.body;
  const user = (req as any).user;

  if (!title || !description) {
    return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
  }

  try {
    const supabase = getSupabase();
    const finalDescription = file_url ? \`${description}\\n\\n[ATTACHMENT]: ${file_url}\` : description;
    
    const { data, error } = await supabase
      .from('tenders')
      .insert([
        {
          title,
          description: finalDescription,
          budget: budget || null,
          deadline: deadline || null,
          category,
          author_id: user.id,
          status: 'open'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (err: any) {
    console.error("Supabase Error POST /tenders:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tenders/:id - Obtenir un appel d'offres spécifique
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: tender, error } = await supabase
      .from('tenders')
      .select('*, author:users(name, company)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      throw error;
    }

    return res.json(tender);
  } catch (err: any) {
    console.error("Supabase Error GET /tenders/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
`;

fs.writeFileSync('server/routes/auth.ts', authTs);
fs.writeFileSync('server/routes/products.ts', productsTs);
fs.writeFileSync('server/routes/tenders.ts', tendersTs);
