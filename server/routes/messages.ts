import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireEmailVerified } from '../middlewares/authMiddleware';
import { requireUuidParams, isUuid } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';

const router = express.Router();

const messageSchema = z.object({
  text: z.string().trim().min(1, 'Message vide').max(5000, 'Message trop long'),
  receiver_id: z.string().uuid('Destinataire invalide'),
});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' });

// GET /api/messages/conversations - List conversations for the logged in user
router.get('/conversations', requireAuth, async (req, res, next) => {
  const user = (req as any).user;
  // L'identifiant vient de la base (requireAuth), mais on le revalide
  // avant de le concaténer dans un filtre PostgREST.
  if (!isUuid(user.id)) {
    return res.status(400).json({ error: 'Identifiant invalide', code: 'INVALID_ID' });
  }
  try {
    const supabase = getSupabase();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(id, name), receiver:users!receiver_id(id, name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const convos = new Map();
    (messages || []).forEach((m: any) => {
       const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
       if (!otherId) return;

       if (!convos.has(otherId)) {
          const otherUser = m.sender_id === user.id ? m.receiver : m.sender;
          convos.set(otherId, {
             id: otherId,
             name: otherUser?.name || 'Utilisateur',
             lastMessage: {
                text: m.text,
                time: formatTime(m.created_at),
                created_at: m.created_at
             },
             unread: 0
          });
       }
    });

    return res.json(Array.from(convos.values()));
  } catch (err: any) {
    logger.error("Error GET /conversations:", err);
    next(err);
  }
});

// GET /api/messages/:conversationId - Liste des messages d'une conversation
router.get('/:conversationId', requireAuth, requireUuidParams('conversationId'), async (req, res, next) => {
  const user = (req as any).user;
  const { conversationId } = req.params;
  if (!isUuid(user.id)) {
    return res.status(400).json({ error: 'Identifiant invalide', code: 'INVALID_ID' });
  }
  try {
    const supabase = getSupabase();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const mapped = (messages || []).map((m: any) => ({
       ...m,
       sender: m.sender_id === user.id ? 'me' : 'them',
       time: formatTime(m.created_at)
    }));

    return res.json(mapped);
  } catch (err: any) {
    logger.error("Supabase Error GET /messages/:conversationId:", err);
    next(err);
  }
});

// POST /api/messages - Envoyer un message
router.post('/', requireAuth, requireEmailVerified, validate(messageSchema), async (req, res, next) => {
  const { text, receiver_id } = req.body;
  const user = (req as any).user;

  if (receiver_id === user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous écrire à vous-même.', code: 'MESSAGE_SELF' });
  }

  try {
    const supabase = getSupabase();

    const { data: receiver } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiver_id)
      .maybeSingle();

    if (!receiver) {
      return res.status(404).json({ error: 'Destinataire introuvable', code: 'RECEIVER_NOT_FOUND' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, sender_id: user.id, receiver_id }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
       ...data,
       sender: 'me',
       time: formatTime(data.created_at)
    });
  } catch (err: any) {
    logger.error("Supabase Error POST /messages:", err);
    next(err);
  }
});

export default router;
