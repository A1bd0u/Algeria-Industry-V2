import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';
import { getSiteUrl } from '../seo';
import { isUuid } from '../middlewares/validateParams';
import { requireApiKey, requireScope } from '../middlewares/apiKeyAuth';
import { validateRow, type ImportRow, type RowIssue } from '../../src/lib/productImport';
import { generateSlugUrl } from '../../src/lib/utils';
import { syncProducts, MAX_SYNC_ROWS } from '../services/integrations/catalogSync';

// API publique v1, pour les ERP et CRM des clients. Authentification par clé
// (voir middlewares/apiKeyAuth.ts) ; réponses et erreurs en JSON :
//   { "error": "…", "code": "…" }.
// Les produits sont identifiés par leur référence article (« reference ») :
// c'est la clé partagée avec l'ERP.

const router = express.Router();
router.use(requireApiKey);

const PRODUCT_COLUMNS = 'id, reference_id, external_ref, name, category, price, description, status, images, file_url, created_at, updated_at';

const toApiProduct = (p: any) => ({
  id: p.id,
  reference: p.external_ref ?? null,
  platform_reference: p.reference_id ?? null,
  name: p.name,
  category: p.category ?? null,
  price: p.price === null || p.price === undefined ? null : Number(p.price),
  description: p.description ?? '',
  status: p.status === 'active' ? 'Actif' : p.status,
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.file_url ? [p.file_url] : []),
  url: `${getSiteUrl()}/products/${generateSlugUrl(p.name, p.id)}`,
  created_at: p.created_at,
  updated_at: p.updated_at,
});

const findOwnProduct = async (ownerId: string, ref: string) => {
  const supabase = getSupabase();
  const byRef = await supabase.from('products').select(PRODUCT_COLUMNS).eq('owner_id', ownerId).eq('external_ref', ref).maybeSingle();
  if (byRef.data || !isUuid(ref)) return byRef.data;
  const byId = await supabase.from('products').select(PRODUCT_COLUMNS).eq('owner_id', ownerId).eq('id', ref).maybeSingle();
  return byId.data;
};

const badRow = (res: express.Response, issues: RowIssue[]) =>
  res.status(400).json({ error: 'Produit invalide.', code: 'PRODUCT_INVALID', issues: issues.map(({ field, code }) => ({ field, code })) });

// GET /api/v1/me - Compte et permissions de la clé.
router.get('/me', (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    name: user.name,
    company: user.company,
    company_id: user.company_id,
    role: user.role,
    scopes: (req as any).apiScopes,
  });
});

// GET /api/v1/products - Produits du compte, du plus récemment modifié au plus ancien.
router.get('/products', requireScope('products:read'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 50, 1), 100);
    let query = getSupabase().from('products').select(PRODUCT_COLUMNS, { count: 'exact' }).eq('owner_id', user.id);
    if (typeof req.query.updated_since === 'string') {
      const since = new Date(req.query.updated_since);
      if (Number.isNaN(since.getTime())) return res.status(400).json({ error: 'updated_since : date ISO 8601 attendue.', code: 'INVALID_DATE' });
      query = query.gte('updated_at', since.toISOString());
    }
    const { data, count, error } = await query.order('updated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return res.json({ data: (data || []).map(toApiProduct), page, limit, total: count || 0 });
  } catch (err) {
    logger.error('Erreur GET /api/v1/products :', err);
    next(err);
  }
});

// GET /api/v1/products/:reference - Un produit, par référence article (ou identifiant).
router.get('/products/:reference', requireScope('products:read'), async (req, res, next) => {
  try {
    const product = await findOwnProduct((req as any).user.id, req.params.reference);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.', code: 'PRODUCT_NOT_FOUND' });
    return res.json(toApiProduct(product));
  } catch (err) {
    next(err);
  }
});

const productBody = z.object({
  name: z.unknown(),
  category: z.unknown().optional(),
  price: z.unknown().optional(),
  description: z.unknown().optional(),
  status: z.enum(['Actif', 'Brouillon', 'Inactif']).optional(),
});

// PUT /api/v1/products/:reference - Crée ou met à jour un produit.
// Un produit créé par l'API arrive en brouillon : il faut une photo
// (ajoutée depuis le tableau de bord) pour le mettre en vente.
router.put('/products/:reference', requireScope('products:write'), async (req, res, next) => {
  const user = (req as any).user;
  const parsed = productBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Corps de requête invalide.', code: 'PRODUCT_INVALID' });
  const { row, issues } = validateRow({ ...parsed.data, reference: req.params.reference }, 1);
  if (issues.length > 0) return badRow(res, issues);

  try {
    const report = await syncProducts({ id: user.id, role: user.role, company_id: user.company_id }, [{ line: 1, row, issues: [] }]);
    if (report.skippedPlanLimit > 0) {
      return res.status(403).json({ error: 'Limite de produits de votre offre atteinte.', code: 'PLAN_LIMIT_REACHED' });
    }
    let product = await findOwnProduct(user.id, row.reference!);
    if (product && parsed.data.status && parsed.data.status !== product.status) {
      const hasPhoto = (Array.isArray(product.images) && product.images.length > 0) || Boolean(product.file_url);
      if (parsed.data.status === 'Actif' && !hasPhoto) {
        return res.status(409).json({ error: 'Ajoutez au moins une photo depuis le tableau de bord avant de mettre ce produit en vente.', code: 'PRODUCT_PHOTO_REQUIRED', product: toApiProduct(product) });
      }
      await getSupabase().from('products').update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq('id', product.id).eq('owner_id', user.id);
      product = await findOwnProduct(user.id, row.reference!);
    }
    return res.status(report.created > 0 ? 201 : 200).json(toApiProduct(product));
  } catch (err) {
    logger.error('Erreur PUT /api/v1/products/:reference :', err);
    next(err);
  }
});

const batchBody = z.object({
  products: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_SYNC_ROWS),
  deactivate_missing: z.boolean().optional(),
});

// POST /api/v1/products/batch - Synchronise un lot (jusqu'à 5 000 produits).
// Avec « deactivate_missing », les produits synchronisés absents du lot sont
// retirés de la vente : à réserver à l'envoi du catalogue complet.
router.post('/products/batch', requireScope('products:write'), async (req, res, next) => {
  const user = (req as any).user;
  const parsed = batchBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: `Corps attendu : { "products": [ … ] } (1 à ${MAX_SYNC_ROWS} produits).`, code: 'BATCH_INVALID' });
  const rows = parsed.data.products.map((p, i) => ({ line: i + 1, ...validateRow(p as Partial<Record<keyof ImportRow, unknown>>, i + 1) }));
  try {
    const report = await syncProducts({ id: user.id, role: user.role, company_id: user.company_id }, rows, { deactivateMissing: parsed.data.deactivate_missing });
    return res.json(report);
  } catch (err) {
    logger.error('Erreur POST /api/v1/products/batch :', err);
    next(err);
  }
});

// DELETE /api/v1/products/:reference - Retire le produit de la vente (statut « Inactif »).
router.delete('/products/:reference', requireScope('products:write'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const product = await findOwnProduct(user.id, req.params.reference);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.', code: 'PRODUCT_NOT_FOUND' });
    const { error } = await getSupabase().from('products').update({ status: 'Inactif', updated_at: new Date().toISOString() }).eq('id', product.id).eq('owner_id', user.id);
    if (error) throw error;
    return res.json({ ...toApiProduct(product), status: 'Inactif' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/messages - Messages reçus (et demandes de devis), du plus récent au plus ancien.
// Les coordonnées de l'expéditeur ne sont fournies que s'il a accepté de les partager.
router.get('/messages', requireScope('messages:read'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 50, 1), 100);
    let query = getSupabase()
      .from('messages')
      .select('id, text, kind, share_contact, created_at, sender:users!sender_id(id, name, email, company)')
      .eq('receiver_id', user.id);
    if (typeof req.query.since === 'string') {
      const since = new Date(req.query.since);
      if (Number.isNaN(since.getTime())) return res.status(400).json({ error: 'since : date ISO 8601 attendue.', code: 'INVALID_DATE' });
      query = query.gt('created_at', since.toISOString());
    }
    if (req.query.kind === 'quote_request' || req.query.kind === 'message') query = query.eq('kind', req.query.kind);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return res.json({
      data: (data || []).map((m: any) => ({
        id: m.id,
        kind: m.kind || 'message',
        text: m.text,
        created_at: m.created_at,
        sender: {
          id: m.sender?.id ?? null,
          name: m.sender?.name ?? null,
          company: m.sender?.company ?? null,
          email: m.share_contact ? m.sender?.email ?? null : null,
        },
        reply_url: `${getSiteUrl()}/dashboard?tab=messages&to=${m.sender?.id ?? ''}`,
      })),
    });
  } catch (err) {
    logger.error('Erreur GET /api/v1/messages :', err);
    next(err);
  }
});

// Route inconnue de l'API : réponse JSON plutôt que la page du site.
router.use((req, res) => res.status(404).json({ error: 'Route inconnue de l\'API v1.', code: 'NOT_FOUND' }));

export default router;
