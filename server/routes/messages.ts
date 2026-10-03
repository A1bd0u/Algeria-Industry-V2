import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, requireEmailVerified } from '../middlewares/authMiddleware';
import { requireUuidParams, isUuid } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';
import { quoteRequestLimiter } from '../middlewares/rateLimiter';
import { sendNotificationEmail } from '../services/emailService';

const router = express.Router();

const messageSchema = z.object({
  text: z.string().trim().min(1, 'Message vide').max(5000, 'Message trop long'),
  receiver_id: z.string().uuid('Destinataire invalide'),
});

const quoteRequestSchema = z.object({
  product_ids: z.array(z.string().uuid('Produit invalide')).min(1, 'Aucun produit').max(4, 'Quatre produits au plus'),
  note: z.string().trim().max(2000, 'Message trop long').optional(),
});

// Statuts des produits visibles publiquement (voir routes/products.ts).
const PUBLISHED_STATUSES = ['Actif', 'active'];

const NOTIFY_WINDOW_MS = 60 * 60 * 1000;

// Prévient le destinataire par e-mail d'un nouveau message, au plus une fois
// par heure et par conversation : si l'expéditeur lui a déjà écrit dans
// l'heure (avant ce message), l'e-mail est déjà parti.
export async function notifyNewMessage(supabase: any, message: { id: string; sender_id: string; receiver_id: string }, senderName: string) {
  try {
    const since = new Date(Date.now() - NOTIFY_WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', message.sender_id)
      .eq('receiver_id', message.receiver_id)
      .gte('created_at', since)
      .neq('id', message.id)
      .limit(1);
    if (recent && recent.length > 0) return;

    const { data: receiver } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', message.receiver_id)
      .maybeSingle();
    if (!receiver?.email) return;

    await sendNotificationEmail(receiver.email, {
      subject: 'Nouveau message',
      heading: 'Vous avez reçu un nouveau message',
      name: receiver.name,
      intro: `${senderName} vous a écrit sur Industigo. Pour votre sécurité, le contenu du message n'est lisible que sur la plateforme.`,
      ctaLabel: 'Lire le message',
      ctaPath: `/dashboard?tab=messages&to=${message.sender_id}`,
    });
  } catch (err) {
    logger.error('Notification de nouveau message non envoyée :', err);
  }
}

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

    await notifyNewMessage(supabase, data, user.company || user.name || 'Un utilisateur');

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

// POST /api/messages/quote-requests - Demande de devis groupée depuis le
// comparateur : un message par fournisseur, listant ses produits concernés.
// Les destinataires sont déduits des produits côté serveur, jamais fournis
// par le client.
router.post('/quote-requests', requireAuth, quoteRequestLimiter, requireEmailVerified, validate(quoteRequestSchema), async (req, res, next) => {
  const { product_ids, note } = req.body as { product_ids: string[]; note?: string };
  const user = (req as any).user;

  try {
    const supabase = getSupabase();
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, owner_id')
      .in('id', Array.from(new Set(product_ids)))
      .in('status', PUBLISHED_STATUSES);
    if (error) throw error;

    const bySeller = new Map<string, string[]>();
    for (const product of products || []) {
      if (!product.owner_id || product.owner_id === user.id) continue;
      const names = bySeller.get(product.owner_id) || [];
      names.push(product.name);
      bySeller.set(product.owner_id, names);
    }

    if (bySeller.size === 0) {
      return res.status(400).json({ error: 'Aucun fournisseur à contacter pour ces produits.', code: 'QUOTE_NO_SUPPLIER' });
    }

    const buyer = user.company || user.name || 'Un acheteur';
    const rows = Array.from(bySeller.entries()).map(([sellerId, names]) => ({
      sender_id: user.id,
      receiver_id: sellerId,
      text: [
        `Demande de devis de ${buyer} pour :`,
        ...names.map((name) => `- ${name}`),
        note ? `\n${note}` : '',
        '\nMerci de préciser prix, délai de livraison et conditions de paiement.',
      ].filter(Boolean).join('\n'),
    }));

    const { data: inserted, error: insertError } = await supabase.from('messages').insert(rows).select();
    if (insertError) throw insertError;

    for (const message of inserted || []) {
      await notifyNewMessage(supabase, message, buyer);
    }

    return res.status(201).json({ sent: rows.length });
  } catch (err: any) {
    logger.error('Supabase Error POST /messages/quote-requests:', err);
    next(err);
  }
});

export default router;
