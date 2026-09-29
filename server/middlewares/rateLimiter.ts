import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import { getClientIp } from '../utils/clientIp';

// NB : le store par défaut est en mémoire. Cloud Run pouvant lancer plusieurs
// instances, brancher un store partagé (Redis/Upstash) avant le lancement public.

const ipKey = (req: Request) => ipKeyGenerator(getClientIp(req));

// Clé IP + e-mail : les opérateurs mobiles algériens placent beaucoup
// d'abonnés derrière une même IP (CGNAT), un quota par IP seule bloquerait
// des utilisateurs légitimes.
const ipEmailKey = (req: Request) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ipKey(req)}|${email}`;
};

// Global API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: ipKey,
  message: {
    error: 'Trop de requêtes. Veuillez réessayer dans une minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentification : connexion, inscription, mot de passe oublié, renvoi de code.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: ipEmailKey,
  message: {
    error: 'Trop de tentatives d\'authentification. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Plafond par IP, toutes adresses e-mail confondues, pour limiter
// l'énumération massive depuis une seule source.
export const authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: ipKey,
  message: {
    error: 'Trop de tentatives d\'authentification. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Vérification du code e-mail (6 chiffres) : limite stricte par IP + e-mail.
export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: ipEmailKey,
  message: {
    error: 'Trop de tentatives de vérification. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Formulaires publics (contact, demande de publicité)
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: ipKey,
  message: {
    error: 'Trop de messages envoyés. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints limiter (Gemini API)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: ipKey,
  message: {
    error: 'Limite de requêtes IA atteinte. Veuillez réessayer dans une minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
