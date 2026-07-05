import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/messages/conversations - List conversations for the logged in user
router.get('/conversations', requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    
    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(id, name), receiver:users!receiver_id(id, name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group into conversations
    const convos = new Map();
    (messages || []).forEach((m: any) => {
       const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
       if (!otherId) return; // General? Or just ignore
       
       if (!convos.has(otherId)) {
          const otherUser = m.sender_id === user.id ? m.receiver : m.sender;
          convos.set(otherId, {
             id: otherId,
             name: otherUser?.name || `Utilisateur ${otherId.substring(0, 4)}`,
             lastMessage: {
                text: m.text,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                created_at: m.created_at
             },
             unread: 0
          });
       }
    });

    return res.json(Array.from(convos.values()));
  } catch (err: any) {
    console.error("Error GET /conversations:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:conversationId - Liste des messages d'une conversation
router.get('/:conversationId', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { conversationId } = req.params;
  try {
    const supabase = getSupabase();
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Map sender info for the frontend
    const mapped = (messages || []).map((m: any) => ({
       ...m,
       sender: m.sender_id === user.id ? 'me' : 'them',
       time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return res.json(mapped);
  } catch (err: any) {
    console.error("Supabase Error GET /messages/:conversationId:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/messages - Envoyer un message
router.post('/', requireAuth, async (req, res) => {
  const { text, receiver_id } = req.body;
  const user = (req as any).user;

  if (!receiver_id || !text) {
     return res.status(400).json({ error: "Missing text or receiver_id" });
  }

  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, sender_id: user.id, receiver_id }])
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
