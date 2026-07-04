import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/messages - Liste des messages 
router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Map sender info for the frontend
    const mapped = (messages || []).map(m => ({
       ...m,
       sender: m.sender_id === user.id ? 'me' : 'them',
       time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return res.json(mapped);
  } catch (err: any) {
    console.error("Supabase Error GET /messages:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/messages - Envoyer un message
router.post('/', requireAuth, async (req, res) => {
  const { text, receiver_id } = req.body;
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    
    // We send a message, setting sender_id as the logged in user
    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, sender_id: user.id, receiver_id: receiver_id || null }]) 
      .select()
      .single();
      
    if (error) throw error;
    
    const mapped = {
       ...data,
       sender: 'me',
       time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    return res.status(201).json(mapped);
  } catch (err: any) {
    console.error("Supabase Error POST /messages:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
