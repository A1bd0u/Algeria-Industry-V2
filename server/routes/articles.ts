import express from 'express';
import { getSupabase } from '../db/supabaseClient';

import { verifyRole } from '../middlewares/authMiddleware';
import { generateReferenceId } from '../utils/reference';

const router = express.Router();

// GET /api/articles - Liste des articles (Blog/News)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json(articles || []);
  } catch (err: any) {
    console.error("Supabase Error GET /articles:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/:id - Détails d'un article
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }
    
    if (!article) return res.status(404).json({ error: "Article not found" });

    return res.json(article);
  } catch (err: any) {
    console.error("Supabase Error GET /articles/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/articles - Créer un article
router.post('/', verifyRole(['admin']), async (req, res) => {
  const { title, excerpt, content, cover_image, category, author_name } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    const reference_id = generateReferenceId('ART');
    
    const { data, error } = await supabase
      .from('articles')
      .insert([{ 
        reference_id, 
        title, 
        excerpt, 
        content, 
        cover_image, 
        category: category || "Général", 
        author_name: author_name || user.email,
        author_id: user.id
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return res.status(201).json(data);
  } catch (err: any) {
    console.error("Supabase Error POST /articles:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/articles/:id - Mettre à jour un article
router.put('/:id', verifyRole(['admin']), async (req, res) => {
  const { title, excerpt, content, cover_image, category, author_name } = req.body;

  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('articles')
      .update({ title, excerpt, content, cover_image, category, author_name })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    
    return res.json(data);
  } catch (err: any) {
    console.error("Supabase Error PUT /articles/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/articles/:id - Supprimer un article
router.delete('/:id', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    
    return res.json({ success: true, message: "Article deleted" });
  } catch (err: any) {
    console.error("Supabase Error DELETE /articles/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
