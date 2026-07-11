import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Logger l'erreur côté serveur
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  // Capture Sentry (optionnel si Sentry l'a déjà intercepté, mais par sécurité)
  Sentry.captureException(err);

  // Message générique pour le client en production
  const statusCode = err.status || err.statusCode || 500;
  let message = 'Une erreur interne est survenue.';
  let details = undefined;

  if (process.env.NODE_ENV !== 'production') {
    message = err.message || message;
    details = err.stack;
  } else {
    // Si l'erreur est prévisible et sécurisée à exposer (ex: 400 Bad Request)
    if (statusCode < 500 && err.message) {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details })
  });
};
