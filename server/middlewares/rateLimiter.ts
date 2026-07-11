import rateLimit from 'express-rate-limit';

// Global API limiter
// Utilisé pour les routes publiques ou générales
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limite chaque IP à 100 requêtes par minute
  message: {
    error: 'Trop de requêtes. Veuillez réessayer dans une minute.'
  },
  standardHeaders: true, // Retourne les infos dans les en-têtes `RateLimit-*`
  legacyHeaders: false, // Désactive les en-têtes `X-RateLimit-*`
});

// Authentication routes limiter
// Profil très strict pour protéger login, register, forgot-password contre le brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par 15 minutes pour l'authentification
  message: {
    error: 'Trop de tentatives d\'authentification. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints limiter (Gemini API)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limite chaque IP à 10 requêtes par minute
  message: {
    error: 'Limite de requêtes IA atteinte. Veuillez réessayer dans une minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

