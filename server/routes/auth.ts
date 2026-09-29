import { logger } from '../utils/logger';
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';
import { authLimiter, authIpLimiter, verifyCodeLimiter } from '../middlewares/rateLimiter';
import { requireAuth } from '../middlewares/authMiddleware';
import { generateReferenceId } from '../utils/reference';
import { sendTransactionalEmail, getAppUrl } from '../services/emailService';
import { issueSession, clearSession } from '../utils/session';
import { getClientIp } from '../utils/clientIp';
import { PUBLIC_USER_COLUMNS, toPublicUser, extractCompanyStatus } from '../utils/userFields';
import { isPasswordPwned } from '../utils/pwnedPasswords';
import { verifyCaptcha } from '../utils/captcha';

const router = express.Router();

export const BCRYPT_COST = 12;
const MAX_FAILED_LOGINS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  captchaToken: z.string({ message: 'Captcha requis' }).min(1, 'Captcha requis')
});

const passwordValidation = z.string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(120),
  email: z.string().email('Email invalide'),
  password: passwordValidation,
  company: z.string().trim().max(200).optional(),
  role: z.enum(['acheteur', 'fournisseur', 'exposant']).optional(),
  captchaToken: z.string({ message: 'Captcha requis' }).min(1, 'Captcha requis')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
  captchaToken: z.string({ message: 'Captcha requis' }).min(1, 'Captcha requis')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  newPassword: passwordValidation
});

const verifyCodeSchema = z.object({
  email: z.string().email('Email invalide'),
  code: z.string().regex(/^\d{6}$/, 'Code invalide')
});

const resendCodeSchema = z.object({
  email: z.string().email('Email invalide'),
  captchaToken: z.string({ message: 'Captcha requis' }).min(1, 'Captcha requis')
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

const readPasswordHash = (row: any): string => row?.passwordHash ?? row?.passwordhash ?? '';

const fetchPublicUser = async (userId: string) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('users')
    .select(`${PUBLIC_USER_COLUMNS}, companies!users_company_id_fkey(status)`)
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return toPublicUser(data, extractCompanyStatus((data as any).companies));
};

const storeVerificationCode = async (email: string, name: string) => {
  const supabase = getSupabase();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase.from('email_verification_codes').delete().eq('email', email);
  await supabase.from('email_verification_codes').insert({ email, code, expires_at: expiresAt });
  await sendTransactionalEmail(email, 'verificationCode', { name, code });
};

// API - Auth - Get Current User
// Les données viennent exclusivement de la base, via une liste blanche de colonnes.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await fetchPublicUser((req as any).user.id);
    if (!user) {
      return res.status(401).json({ error: 'Session expirée ou invalide' });
    }
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

// API - Auth - Login
router.post('/login', authIpLimiter, authLimiter, validate(loginSchema), async (req, res) => {
  const { password, captchaToken } = req.body;
  const email = normalizeEmail(req.body.email);

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  try {
    const supabase = getSupabase();
    const ipAddress = getClientIp(req);

    // Délai progressif plutôt que blocage sec : après 5 échecs, l'attente
    // double à chaque nouvel échec (1, 2, 4… min, plafonnée à 15 min).
    // La réinitialisation du mot de passe par e-mail efface le compteur.
    const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('attempt_time')
      .eq('email', email)
      .gte('attempt_time', windowStart)
      .order('attempt_time', { ascending: false });

    const failedCount = attempts?.length || 0;
    if (failedCount >= MAX_FAILED_LOGINS && attempts?.[0]) {
      const delayMs = Math.min(2 ** (failedCount - MAX_FAILED_LOGINS) * 60 * 1000, LOGIN_WINDOW_MS);
      const retryAt = new Date(attempts[0].attempt_time).getTime() + delayMs;
      if (Date.now() < retryAt) {
        res.setHeader('Retry-After', Math.ceil((retryAt - Date.now()) / 1000).toString());
        return res.status(429).json({
          error: 'Trop de tentatives. Réessayez dans quelques minutes ou réinitialisez votre mot de passe.',
          code: 'LOGIN_THROTTLED'
        });
      }
    }

    // select('*') reste côté serveur : le hash n'est jamais renvoyé.
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    const isValid = dbUser ? await bcrypt.compare(password, readPasswordHash(dbUser)) : false;

    if (!dbUser || !isValid) {
      await supabase.from('login_attempts').insert({
        email,
        ip_address: ipAddress,
        attempt_time: new Date().toISOString()
      });

      if (dbUser && failedCount + 1 === MAX_FAILED_LOGINS) {
        await sendTransactionalEmail(dbUser.email, 'securityAlert', { ip: ipAddress });
      }

      return res.status(401).json({ error: 'Email ou mot de passe incorrect', code: 'AUTH_INVALID' });
    }

    if (dbUser.role && String(dbUser.role).endsWith('_suspended')) {
      return res.status(403).json({ error: 'Ce compte a été suspendu par l\'administrateur.', code: 'ACCOUNT_SUSPENDED' });
    }

    await supabase.from('login_attempts').delete().eq('email', email);

    issueSession(res, dbUser);

    const user = await fetchPublicUser(dbUser.id);
    return res.json({ user });
  } catch (err: any) {
    logger.error("Login Error:", err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API - Auth - Register
// Réponse identique que l'adresse soit libre ou déjà utilisée (pas d'énumération) :
// la session n'est ouverte qu'après vérification du code reçu par e-mail.
const REGISTER_RESPONSE = {
  success: true,
  pendingVerification: true,
  message: 'Si cette adresse peut être utilisée, un code de vérification vient d\'y être envoyé.'
};

router.post('/register', authIpLimiter, authLimiter, validate(registerSchema), async (req, res) => {
  const { name, company, role, password, captchaToken } = req.body;
  const email = normalizeEmail(req.body.email);

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  if (await isPasswordPwned(password)) {
    return res.status(400).json({
      error: 'Ce mot de passe figure dans des fuites de données connues. Choisissez-en un autre.',
      code: 'PASSWORD_PWNED'
    });
  }

  try {
    const supabase = getSupabase();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name')
      .ilike('email', email)
      .maybeSingle();

    if (existingUser) {
      await sendTransactionalEmail(email, 'accountExists', {
        name: existingUser.name || 'Utilisateur',
        resetUrl: `${getAppUrl()}/forgot-password`
      });
      return res.json(REGISTER_RESPONSE);
    }

    const hashedPassword = await hashPassword(password);
    const cRole = role || 'acheteur';
    const cCompany = company || null;

    const { data: newUserRow, error: insertError } = await supabase
      .from('users')
      .insert([{
        reference_id: generateReferenceId('USR'),
        name,
        email,
        company: cCompany,
        role: cRole,
        passwordHash: hashedPassword,
        email_verified: false,
        kyc_status: 'none'
      }])
      .select('id')
      .single();

    if (insertError || !newUserRow) {
      logger.error('Register insert error', insertError);
      return res.status(500).json({ error: 'Erreur lors de l\'inscription. Veuillez réessayer.' });
    }

    // Fournisseurs et exposants : l'entreprise est créée dès l'inscription.
    if ((cRole === 'fournisseur' || cRole === 'exposant') && cCompany) {
      const { data: companyRow, error: companyError } = await supabase
        .from('companies')
        .insert([{
          reference_id: generateReferenceId('CMP'),
          name: cCompany,
          owner_id: newUserRow.id,
          status: 'unverified'
        }])
        .select('id')
        .single();

      if (companyRow && !companyError) {
        await supabase.from('users').update({ company_id: companyRow.id }).eq('id', newUserRow.id);
      } else {
        logger.error('Company creation error on register', companyError);
      }
    }

    await storeVerificationCode(email, name);

    return res.json(REGISTER_RESPONSE);
  } catch (err: any) {
    logger.error("Register Error:", err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API - Auth - Forgot Password
router.post('/forgot-password', authIpLimiter, authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const { captchaToken } = req.body;
  const email = normalizeEmail(req.body.email);
  const neutral = { success: true, message: 'Si cette adresse existe, un email a été envoyé.' };

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  try {
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .ilike('email', email)
      .maybeSingle();

    if (!user) {
      return res.json(neutral);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

    if (insertError) {
      logger.error("Error inserting reset token:", insertError);
      return res.status(500).json({ error: 'Erreur lors de la génération du lien de réinitialisation' });
    }

    await sendTransactionalEmail(user.email, 'resetPassword', {
      name: user.name || 'Utilisateur',
      resetUrl: `${getAppUrl()}/reset-password?token=${resetToken}`
    });

    return res.json(neutral);
  } catch (err: any) {
    logger.error("Forgot Password Error:", err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API - Auth - Reset Password
router.post('/reset-password', authIpLimiter, validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const supabase = getSupabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: resetRecord } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .maybeSingle();

    if (!resetRecord) {
      return res.status(400).json({ error: 'Jeton de réinitialisation invalide ou déjà utilisé.', code: 'RESET_TOKEN_INVALID' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Le jeton de réinitialisation a expiré.', code: 'RESET_TOKEN_EXPIRED' });
    }

    if (await isPasswordPwned(newPassword)) {
      return res.status(400).json({
        error: 'Ce mot de passe figure dans des fuites de données connues. Choisissez-en un autre.',
        code: 'PASSWORD_PWNED'
      });
    }

    const passwordHash = await hashPassword(newPassword);

    const { data: userRecord } = await supabase
      .from('users')
      .select('token_version, email')
      .eq('id', resetRecord.user_id)
      .maybeSingle();
    const nextVersion = (userRecord?.token_version || 0) + 1;

    // Nouveau token_version : toutes les sessions ouvertes sont invalidées.
    const { error: updateError } = await supabase
      .from('users')
      .update({ passwordHash, token_version: nextVersion })
      .eq('id', resetRecord.user_id);

    if (updateError) {
      logger.error("Error updating user password:", updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe.' });
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    // Déblocage : la preuve de possession de la boîte e-mail efface les échecs de connexion.
    if (userRecord?.email) {
      await supabase.from('login_attempts').delete().eq('email', normalizeEmail(userRecord.email));
    }

    return res.json({ success: true, message: 'Votre mot de passe a été réinitialisé avec succès.' });
  } catch (err: any) {
    logger.error("Reset Password Error:", err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API - Auth - Logout
router.post('/logout', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '', { ignoreExpiration: true }) as any;
      if (decoded?.id) {
        const supabase = getSupabase();
        const { data: user } = await supabase.from('users').select('token_version').eq('id', decoded.id).maybeSingle();
        if (user) {
          await supabase.from('users').update({ token_version: (user.token_version || 0) + 1 }).eq('id', decoded.id);
        }
      }
    } catch (err) {
      logger.error("Logout token invalidation error", err);
    }
  }

  clearSession(res);
  return res.json({ success: true, message: 'Déconnexion réussie' });
});

// API - Auth - Verify Code
// Un code valide prouve la possession de la boîte e-mail : il confirme l'adresse
// et ouvre la session (fin du parcours d'inscription).
router.post('/verify-code', authIpLimiter, verifyCodeLimiter, validate(verifyCodeSchema), async (req, res) => {
  const { code } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    const supabase = getSupabase();

    const { data: verifyRecord } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!verifyRecord) {
      return res.status(400).json({ error: 'Code invalide ou expiré', code: 'CODE_INVALID' });
    }

    if ((verifyRecord.attempts || 0) >= 5) {
      return res.status(400).json({ error: 'Trop de tentatives échouées. Veuillez demander un nouveau code.', code: 'CODE_TOO_MANY_ATTEMPTS' });
    }

    if (new Date(verifyRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Le code a expiré. Veuillez en demander un nouveau.', code: 'CODE_EXPIRED' });
    }

    const expected = Buffer.from(String(verifyRecord.code));
    const received = Buffer.from(code);
    const matches = expected.length === received.length && crypto.timingSafeEqual(expected, received);

    if (!matches) {
      await supabase
        .from('email_verification_codes')
        .update({ attempts: (verifyRecord.attempts || 0) + 1 })
        .eq('id', verifyRecord.id);
      return res.status(400).json({ error: 'Code invalide', code: 'CODE_INVALID' });
    }

    await supabase.from('email_verification_codes').delete().eq('id', verifyRecord.id);

    const { data: userRow } = await supabase
      .from('users')
      .update({ email_verified: true })
      .ilike('email', email)
      .select('id, token_version, role')
      .maybeSingle();

    if (!userRow) {
      return res.status(400).json({ error: 'Code invalide ou expiré', code: 'CODE_INVALID' });
    }

    if (!String(userRow.role || '').endsWith('_suspended')) {
      issueSession(res, userRow);
    }

    const user = await fetchPublicUser(userRow.id);
    return res.json({ success: true, message: 'Email vérifié avec succès', user });
  } catch (err) {
    logger.error('Verify code error', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API - Auth - Resend Code
router.post('/resend-code', authIpLimiter, authLimiter, validate(resendCodeSchema), async (req, res) => {
  const { captchaToken } = req.body;
  const email = normalizeEmail(req.body.email);
  const neutral = { success: true, message: 'Si un compte non vérifié existe pour cette adresse, un code a été envoyé.' };

  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  try {
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('name, email_verified')
      .ilike('email', email)
      .maybeSingle();

    // Aucun code pour une adresse inconnue ou déjà vérifiée.
    if (user && !user.email_verified) {
      await storeVerificationCode(email, user.name || 'Utilisateur');
    }

    return res.json(neutral);
  } catch (err) {
    logger.error('Resend code error', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
