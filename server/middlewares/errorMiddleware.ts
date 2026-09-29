import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|captcha|code|nif|rc$/i;

// Masque récursivement les champs sensibles avant journalisation.
export const redact = (value: any, depth = 0): any => {
  if (value === null || typeof value !== 'object' || depth > 5) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, any> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out;
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Ni les en-têtes (cookie de session) ni le corps brut (mots de passe) ne sont journalisés.
  logger.error({
    message: err?.message,
    stack: err?.stack,
    url: req.originalUrl || req.url,
    method: req.method,
    body: redact(req.body),
  });

  Sentry.captureException(err);

  const statusCode = err?.status || err?.statusCode || 500;
  let message = 'Une erreur interne est survenue.';

  // Seules les erreurs client explicitement levées par le code sont exposées ;
  // les erreurs base de données (détails SQL) ne quittent jamais le serveur.
  if (statusCode < 500 && err?.expose !== false && err?.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err?.message }),
  });
};
