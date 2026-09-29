import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { requireAuth } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { verifyCodeLimiter } from '../middlewares/rateLimiter';
import { issueSession } from '../utils/session';
import { logger } from '../utils/logger';
import { getClientIp } from '../utils/clientIp';
import { PUBLIC_USER_COLUMNS, toPublicUser, extractCompanyStatus } from '../utils/userFields';
import { sendTransactionalEmail } from '../services/emailService';
import {
  decryptSecret, encryptSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode,
  normalizeRecoveryCode, otpauthUri, verifyTotp,
} from '../utils/totp';

// Double authentification (TOTP + codes de secours).
// Les secrets vivent dans public.user_mfa (RLS sans politique : accessible au
// seul backend), chiffrés en AES-256-GCM.
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || '';
const CHALLENGE_COOKIE = 'mfa_challenge';
const CHALLENGE_TTL_SECONDS = 5 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const PENDING_SETUP_TTL_MS = 15 * 60 * 1000;

const codeSchema = z.object({
  code: z.string().trim().min(6).max(20),
});

const disableSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
  code: z.string().trim().min(6).max(20),
});

const challengeCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/2fa',
});

// Appelé par /api/auth/login quand le mot de passe est bon et la 2FA active :
// aucune session n'est ouverte, seul un jeton d'étape de 5 minutes est posé.
export const issueMfaChallenge = (res: Response, user: { id: string; token_version?: number | null }) => {
  const token = jwt.sign(
    { id: user.id, token_version: user.token_version || 0, purpose: 'mfa' },
    JWT_SECRET,
    { expiresIn: CHALLENGE_TTL_SECONDS }
  );
  res.cookie(CHALLENGE_COOKIE, token, { ...challengeCookieOptions(), maxAge: CHALLENGE_TTL_SECONDS * 1000 });
};

const loadMfa = async (userId: string) => {
  const { data } = await getSupabase().from('user_mfa').select('*').eq('user_id', userId).maybeSingle();
  return data as any;
};

type CheckResult =
  | { ok: true; kind: 'totp' | 'recovery' }
  | { ok: false; status: number; code: string; error: string };

/**
 * Vérifie un code TOTP ou un code de secours pour un utilisateur dont la 2FA
 * est active. Gère le verrouillage après 5 échecs et le rejeu des codes.
 */
const checkSecondFactor = async (userId: string, rawCode: string): Promise<CheckResult> => {
  const supabase = getSupabase();
  const mfa = await loadMfa(userId);
  if (!mfa?.enabled_at || !mfa.secret_enc) {
    return { ok: false, status: 400, code: 'MFA_NOT_ENABLED', error: 'La double authentification n\'est pas activée.' };
  }
  if (mfa.locked_until && new Date(mfa.locked_until) > new Date()) {
    return { ok: false, status: 429, code: 'MFA_LOCKED', error: 'Trop de codes erronés. Réessayez dans 15 minutes.' };
  }

  const code = rawCode.replace(/\s+/g, '');
  const now = new Date().toISOString();

  if (/^\d{6}$/.test(code)) {
    const step = verifyTotp(decryptSecret(mfa.secret_enc), code, mfa.last_used_step ?? null);
    if (step !== null) {
      // Filtre sur last_used_step : deux requêtes simultanées avec le même
      // code ne peuvent pas réussir toutes les deux.
      const { data: updated } = await supabase
        .from('user_mfa')
        .update({ last_used_step: step, failed_attempts: 0, locked_until: null, updated_at: now })
        .eq('user_id', userId)
        .or(`last_used_step.is.null,last_used_step.lt.${step}`)
        .select('user_id')
        .maybeSingle();
      if (updated) return { ok: true, kind: 'totp' };
    }
  } else {
    const hash = hashRecoveryCode(code);
    const codes: string[] = mfa.recovery_codes || [];
    if (normalizeRecoveryCode(code).length === 8 && codes.includes(hash)) {
      const { data: updated } = await supabase
        .from('user_mfa')
        .update({ recovery_codes: codes.filter((c) => c !== hash), failed_attempts: 0, locked_until: null, updated_at: now })
        .eq('user_id', userId)
        .contains('recovery_codes', [hash])
        .select('user_id')
        .maybeSingle();
      if (updated) return { ok: true, kind: 'recovery' };
    }
  }

  const failed = (mfa.failed_attempts || 0) + 1;
  await supabase
    .from('user_mfa')
    .update({
      failed_attempts: failed >= MAX_FAILED_ATTEMPTS ? 0 : failed,
      locked_until: failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MS).toISOString() : null,
      updated_at: now,
    })
    .eq('user_id', userId);
  return { ok: false, status: 401, code: 'MFA_INVALID', error: 'Code incorrect ou expiré.' };
};

const fetchPublicUser = async (userId: string) => {
  const { data } = await getSupabase()
    .from('users')
    .select(`${PUBLIC_USER_COLUMNS}, companies!users_company_id_fkey(status)`)
    .eq('id', userId)
    .maybeSingle();
  return data ? toPublicUser(data, extractCompanyStatus((data as any).companies)) : null;
};

// POST /api/auth/2fa/login - Deuxième étape de la connexion
router.post('/login', verifyCodeLimiter, validate(codeSchema), async (req: Request, res: Response) => {
  const token = req.cookies?.[CHALLENGE_COOKIE];
  let decoded: any;
  try {
    decoded = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    decoded = null;
  }
  if (!decoded?.id || decoded.purpose !== 'mfa') {
    return res.status(401).json({ error: 'Session de connexion expirée. Saisissez à nouveau votre mot de passe.', code: 'MFA_CHALLENGE_EXPIRED' });
  }

  try {
    const supabase = getSupabase();
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, role, token_version, mfa_enabled')
      .eq('id', decoded.id)
      .maybeSingle();
    if (!dbUser || (dbUser.token_version ?? 0) !== (decoded.token_version ?? 0)) {
      return res.status(401).json({ error: 'Session de connexion expirée.', code: 'MFA_CHALLENGE_EXPIRED' });
    }
    if (String(dbUser.role || '').endsWith('_suspended')) {
      return res.status(403).json({ error: 'Ce compte a été suspendu par l\'administrateur.', code: 'ACCOUNT_SUSPENDED' });
    }

    const result = await checkSecondFactor(dbUser.id, req.body.code);
    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error, code: result.code });
    }

    if (result.kind === 'recovery') {
      await sendTransactionalEmail(dbUser.email, 'securityAlert', { ip: getClientIp(req) });
      logger.warn('Connexion avec un code de secours', { userId: dbUser.id });
    }

    res.clearCookie(CHALLENGE_COOKIE, challengeCookieOptions());
    issueSession(res, dbUser);
    return res.json({ user: await fetchPublicUser(dbUser.id) });
  } catch (err) {
    logger.error('MFA login error', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Les routes suivantes gèrent la 2FA du compte connecté.
router.use(requireAuth);

// GET /api/auth/2fa/status
router.get('/status', async (req, res, next) => {
  const user = (req as any).user;
  try {
    const mfa = await loadMfa(user.id);
    return res.json({
      enabled: Boolean(mfa?.enabled_at),
      enabledAt: mfa?.enabled_at || null,
      recoveryCodesLeft: (mfa?.recovery_codes || []).length,
      required: user.mfaSetupRequired || (user.role === 'admin'),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/setup - Génère un secret en attente et son QR code
router.post('/setup', async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const mfa = await loadMfa(user.id);
    if (mfa?.enabled_at) {
      return res.status(409).json({ error: 'La double authentification est déjà active.', code: 'MFA_ALREADY_ENABLED' });
    }

    const secret = generateTotpSecret();
    const { error } = await supabase.from('user_mfa').upsert({
      user_id: user.id,
      pending_secret_enc: encryptSecret(secret),
      pending_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;

    const uri = otpauthUri(secret, user.email);
    const qrSvg = await QRCode.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    return res.json({ secret, otpauthUri: uri, qrSvg });
  } catch (err) {
    logger.error('MFA setup error', err);
    next(err);
  }
});

// POST /api/auth/2fa/enable - Confirme avec un premier code, renvoie les codes de secours
router.post('/enable', verifyCodeLimiter, validate(codeSchema), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const mfa = await loadMfa(user.id);
    if (mfa?.enabled_at) {
      return res.status(409).json({ error: 'La double authentification est déjà active.', code: 'MFA_ALREADY_ENABLED' });
    }
    const pendingFresh = mfa?.pending_created_at && Date.now() - new Date(mfa.pending_created_at).getTime() < PENDING_SETUP_TTL_MS;
    if (!mfa?.pending_secret_enc || !pendingFresh) {
      return res.status(400).json({ error: 'Configuration expirée. Recommencez la configuration.', code: 'MFA_SETUP_EXPIRED' });
    }

    const secret = decryptSecret(mfa.pending_secret_enc);
    const step = verifyTotp(secret, req.body.code.replace(/\s+/g, ''));
    if (step === null) {
      return res.status(400).json({ error: 'Code incorrect. Vérifiez l\'heure de votre téléphone et réessayez.', code: 'MFA_INVALID' });
    }

    const recoveryCodes = generateRecoveryCodes();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('user_mfa')
      .update({
        secret_enc: mfa.pending_secret_enc,
        pending_secret_enc: null,
        pending_created_at: null,
        enabled_at: now,
        last_used_step: step,
        recovery_codes: recoveryCodes.map(hashRecoveryCode),
        failed_attempts: 0,
        locked_until: null,
        updated_at: now,
      })
      .eq('user_id', user.id);
    if (error) throw error;
    await supabase.from('users').update({ mfa_enabled: true }).eq('id', user.id);

    logger.info('Double authentification activée', { userId: user.id });
    return res.json({ enabled: true, recoveryCodes });
  } catch (err) {
    logger.error('MFA enable error', err);
    next(err);
  }
});

// POST /api/auth/2fa/recovery-codes - Nouveaux codes de secours (invalide les anciens)
router.post('/recovery-codes', verifyCodeLimiter, validate(codeSchema), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const check = await checkSecondFactor(user.id, req.body.code);
    if (check.ok === false) return res.status(check.status).json({ error: check.error, code: check.code });

    const recoveryCodes = generateRecoveryCodes();
    const { error } = await getSupabase()
      .from('user_mfa')
      .update({ recovery_codes: recoveryCodes.map(hashRecoveryCode), updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) throw error;
    return res.json({ recoveryCodes });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/disable - Mot de passe + code requis
router.post('/disable', verifyCodeLimiter, validate(disableSchema), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    const hash = dbUser?.passwordHash ?? dbUser?.passwordhash ?? '';
    if (!dbUser || !(await bcrypt.compare(req.body.password, hash))) {
      return res.status(401).json({ error: 'Mot de passe incorrect.', code: 'AUTH_INVALID' });
    }

    const check = await checkSecondFactor(user.id, req.body.code);
    if (check.ok === false) return res.status(check.status).json({ error: check.error, code: check.code });

    const { error } = await supabase.from('user_mfa').delete().eq('user_id', user.id);
    if (error) throw error;
    await supabase.from('users').update({ mfa_enabled: false }).eq('id', user.id);
    await sendTransactionalEmail(dbUser.email, 'securityAlert', { ip: getClientIp(req) });

    logger.warn('Double authentification désactivée', { userId: user.id });
    return res.json({ enabled: false });
  } catch (err) {
    next(err);
  }
});

export default router;
