import { logger } from '../utils/logger';
import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth, verifyRole } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';
import { logAdminAction } from '../utils/auditLogger';
import { PUBLIC_USER_COLUMNS, toPublicUser, extractCompanyStatus } from '../utils/userFields';
import { clearSession } from '../utils/session';
import { getClientIp } from '../utils/clientIp';
import { sendTransactionalEmail } from '../services/emailService';

const router = express.Router();

const ASSIGNABLE_ROLES = ['acheteur', 'fournisseur', 'exposant', 'admin'] as const;

const roleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

const statusSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(120),
  company: z.string().trim().max(200).optional(),
});

const bumpTokenVersion = async (userId: string) => {
  const supabase = getSupabase();
  const { data } = await supabase.from('users').select('token_version').eq('id', userId).maybeSingle();
  await supabase
    .from('users')
    .update({ token_version: (data?.token_version || 0) + 1 })
    .eq('id', userId);
};

// Supprime un utilisateur et tout ce qui lui appartient.
const deleteUserCascade = async (id: string) => {
  const supabase = getSupabase();

  await supabase.from('messages').delete().eq('sender_id', id);
  await supabase.from('messages').delete().eq('receiver_id', id);
  await supabase.from('favorites').delete().eq('user_id', id);
  await supabase.from('kyc_requests').delete().eq('user_id', id);
  await supabase.from('products').delete().eq('owner_id', id);

  const { data: companies } = await supabase.from('companies').select('id').eq('owner_id', id);
  if (companies && companies.length > 0) {
    const companyIds = companies.map((c) => c.id);
    await supabase.from('kyc_documents').delete().in('company_id', companyIds);
    await supabase.from('products').delete().in('company_id', companyIds);
    await supabase.from('tenders').delete().in('company_id', companyIds);
    await supabase.from('companies').delete().in('id', companyIds);
  }

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Self-service (utilisateur connecté)
// ---------------------------------------------------------------------------

// PUT /api/users/me - Mise à jour du profil
router.put('/me', requireAuth, validate(profileSchema), async (req, res, next) => {
  const user = (req as any).user;
  const { name, company } = req.body;
  try {
    const supabase = getSupabase();
    const update: Record<string, string> = { name };
    if (company !== undefined) update.company = company;

    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', user.id)
      .select(`${PUBLIC_USER_COLUMNS}, companies!users_company_id_fkey(status)`)
      .single();

    if (error) throw error;
    return res.json({ user: toPublicUser(data, extractCompanyStatus((data as any).companies)) });
  } catch (err) {
    logger.error('Error PUT /api/users/me', err);
    next(err);
  }
});

// GET /api/users/me/export - Export des données personnelles (loi 18-07)
router.get('/me/export', requireAuth, async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const [profile, companies, products, sent, received, favorites, kyc] = await Promise.all([
      supabase.from('users').select(PUBLIC_USER_COLUMNS).eq('id', user.id).single(),
      supabase.from('companies').select('*').eq('owner_id', user.id),
      supabase.from('products').select('*').eq('owner_id', user.id),
      supabase.from('messages').select('*').eq('sender_id', user.id),
      supabase.from('messages').select('*').eq('receiver_id', user.id),
      supabase.from('favorites').select('*').eq('user_id', user.id),
      supabase.from('kyc_requests').select('id, status, activity, created_at').eq('user_id', user.id),
    ]);

    res.setHeader('Content-Disposition', `attachment; filename="export-${user.id}.json"`);
    return res.json({
      exported_at: new Date().toISOString(),
      profile: profile.data,
      companies: companies.data || [],
      products: products.data || [],
      messages: [...(sent.data || []), ...(received.data || [])],
      favorites: favorites.data || [],
      kyc_requests: kyc.data || [],
    });
  } catch (err) {
    logger.error('Error GET /api/users/me/export', err);
    next(err);
  }
});

// DELETE /api/users/me - Suppression du compte par son titulaire
router.delete('/me', requireAuth, async (req, res, next) => {
  const user = (req as any).user;
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Un compte administrateur ne peut pas être supprimé ainsi.', code: 'ADMIN_SELF_DELETE' });
  }
  try {
    await deleteUserCascade(user.id);
    clearSession(res);
    return res.json({ success: true, message: 'Votre compte a été supprimé.' });
  } catch (err) {
    logger.error('Error DELETE /api/users/me', err);
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

// GET /api/users - Get all users
router.get('/', verifyRole(['admin']), async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select(`${PUBLIC_USER_COLUMNS}, companies!users_company_id_fkey(status)`);

    if (error) throw error;

    return res.json((users || []).map((u: any) => toPublicUser(u, extractCompanyStatus(u.companies) || 'unverified')));
  } catch (err: any) {
    logger.error("Error GET /api/users:", err);
    next(err);
  }
});

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', verifyRole(['admin']), requireUuidParams('id'), validate(roleSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const supabase = getSupabase();

    const { data: targetUser } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', id)
      .maybeSingle();

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const { error } = await supabase.from('users').update({ role }).eq('id', id);
    if (error) throw error;

    // Invalide toutes les sessions en cours de l'utilisateur.
    await bumpTokenVersion(id);

    await logAdminAction(req, 'role_change', {
      targetUserId: id,
      targetUserEmail: targetUser.email,
      previousRole: targetUser.role,
      newRole: role
    });

    return res.json({ success: true, message: 'Rôle mis à jour' });
  } catch (err: any) {
    logger.error("Error PUT /api/users/:id/role:", err);
    next(err);
  }
});

// PUT /api/users/:id/status - Update user status (suspend/reactivate)
router.put('/:id/status', verifyRole(['admin']), requireUuidParams('id'), validate(statusSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', id)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const currentRole: string = user.role || '';
    let newRole = currentRole;

    if (action === 'suspend' && !currentRole.endsWith('_suspended')) {
      newRole = currentRole + '_suspended';
    } else if (action === 'reactivate' && currentRole.endsWith('_suspended')) {
      newRole = currentRole.replace(/_suspended$/, '');
    }

    if (newRole !== currentRole) {
      const { error: updateError } = await supabase.from('users').update({ role: newRole }).eq('id', id);
      if (updateError) throw updateError;
      await bumpTokenVersion(id);
    }

    await logAdminAction(req, action === 'suspend' ? 'suspension' : 'reactivation', {
      targetUserId: id,
      targetUserEmail: user.email,
      previousRole: currentRole,
      newRole
    });

    return res.json({ success: true, message: action === 'suspend' ? 'Compte suspendu' : 'Compte réactivé' });
  } catch (err: any) {
    logger.error("Error PUT /api/users/:id/status:", err);
    next(err);
  }
});

// POST /api/users/:id/reset-mfa - Réinitialiser la 2FA (téléphone et codes de secours perdus)
// À n'utiliser qu'après vérification de l'identité ; un admin ne peut pas
// réinitialiser sa propre 2FA (un autre admin doit le faire).
router.post('/:id/reset-mfa', verifyRole(['admin']), requireUuidParams('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === (req as any).user.id) {
      return res.status(400).json({ error: 'Un autre administrateur doit réinitialiser votre double authentification.', code: 'MFA_SELF_RESET' });
    }
    const supabase = getSupabase();
    const { data: user } = await supabase.from('users').select('id, email').eq('id', id).maybeSingle();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const { error: deleteError } = await supabase.from('user_mfa').delete().eq('user_id', id);
    if (deleteError) throw deleteError;
    const { error: updateError } = await supabase.from('users').update({ mfa_enabled: false }).eq('id', id);
    if (updateError) throw updateError;
    await bumpTokenVersion(id);
    await sendTransactionalEmail(user.email, 'securityAlert', { ip: getClientIp(req) });

    await logAdminAction(req, 'mfa_reset', { targetUserId: id, targetUserEmail: user.email });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Error POST /api/users/:id/reset-mfa:', err);
    next(err);
  }
});

// GET /api/users/:id/details - Get user details
router.get('/:id/details', verifyRole(['admin']), requireUuidParams('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const [userRes, companiesRes, productsRes, sentRes, receivedRes] = await Promise.all([
      supabase.from('users').select(PUBLIC_USER_COLUMNS).eq('id', id).maybeSingle(),
      supabase.from('companies').select('*').eq('owner_id', id),
      supabase.from('products').select('*').eq('owner_id', id),
      supabase.from('messages').select('*').eq('sender_id', id),
      supabase.from('messages').select('*').eq('receiver_id', id),
    ]);

    if (userRes.error) throw userRes.error;
    if (!userRes.data) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    return res.json({
      profile: toPublicUser(userRes.data),
      companies: companiesRes.data || [],
      products: productsRes.data || [],
      messages: [...(sentRes.data || []), ...(receivedRes.data || [])],
    });
  } catch (err: any) {
    logger.error("Error GET /api/users/:id/details:", err);
    next(err);
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', verifyRole(['admin']), requireUuidParams('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { data: targetUser } = await supabase
      .from('users')
      .select('email, name, role')
      .eq('id', id)
      .maybeSingle();

    await deleteUserCascade(id);

    await logAdminAction(req, 'user_delete', {
      targetUserId: id,
      targetUserEmail: targetUser?.email || 'unknown',
      targetUserName: targetUser?.name || 'unknown',
      targetUserRole: targetUser?.role || 'unknown'
    });

    return res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (err: any) {
    logger.error("Error DELETE /api/users/:id:", err);
    next(err);
  }
});

export default router;
