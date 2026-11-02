import { NextFunction, Request, Response } from 'express';
import { logActivity } from '../services/insightsService';

// Journal d'activité : chaque écriture via l'API (POST, PUT, PATCH, DELETE)
// et chaque réponse en erreur sont enregistrées, avec le compte connecté,
// le statut et la durée. Ni corps de requête, ni cookie, ni adresse IP.

const IGNORED = [
  /^\/api\/analytics\//,
  /^\/api\/stats\/track/,
  /^\/api\/messages\/unread-count/,
  /^\/api\/admin\/pending-counts/,
  /^\/api\/cron\//,
];

// Noms lisibles des actions les plus suivies.
const NAMED: [RegExp, string, string][] = [
  [/^POST \/api\/auth\/login$/, 'auth', 'Connexion'],
  [/^POST \/api\/auth\/logout$/, 'auth', 'Déconnexion'],
  [/^POST \/api\/auth\/register$/, 'auth', 'Inscription'],
  [/^POST \/api\/auth\/verify-email/, 'auth', 'Vérification de l\'e-mail'],
  [/^POST \/api\/auth\/(forgot-password|reset-password)/, 'auth', 'Mot de passe oublié / réinitialisé'],
  [/^POST \/api\/auth\/2fa/, 'auth', 'Double authentification'],
  [/^POST \/api\/messages/, 'messages', 'Message envoyé'],
  [/^POST \/api\/contact/, 'contact', 'Formulaire de contact'],
  [/^POST \/api\/products/, 'products', 'Produit créé'],
  [/^(PUT|PATCH) \/api\/products/, 'products', 'Produit modifié'],
  [/^DELETE \/api\/products/, 'products', 'Produit supprimé'],
  [/^POST \/api\/kyc/, 'kyc', 'Dossier KYC déposé'],
  [/^POST \/api\/subscriptions/, 'billing', 'Souscription'],
  [/^POST \/api\/payments/, 'billing', 'Paiement'],
  [/^POST \/api\/upload/, 'upload', 'Fichier déposé'],
  [/^(POST|DELETE) \/api\/favorites/, 'favorites', 'Favori'],
];

export const describeRequest = (method: string, path: string) => {
  const key = `${method} ${path}`;
  for (const [re, category, action] of NAMED) {
    if (re.test(key)) return { category, action };
  }
  const category = path.split('/')[2] || 'api';
  return { category, action: `${method} ${path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')}` };
};

export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
  const path = req.originalUrl.split('?')[0];
  if (IGNORED.some((re) => re.test(path))) return next();
  const started = process.hrtime.bigint();
  // Code d'erreur renvoyé au client (ex. AUTH_INVALID), sans le reste du corps.
  // Compte renvoyé par la connexion ou l'inscription (la requête n'a pas
  // encore de session à ce moment-là).
  let errorCode: string | null = null;
  let bodyUser: { id?: string; role?: string } | null = null;
  const json = res.json.bind(res);
  res.json = (body: any) => {
    if (body && typeof body.code === 'string') errorCode = body.code.slice(0, 60);
    if (body?.user && typeof body.user.id === 'string') bodyUser = body.user;
    return json(body);
  };

  res.on('finish', () => {
    const write = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
    const status = res.statusCode;
    if (!write && status < 400) return;
    // 401 sur la lecture de session : visiteur non connecté, pas une erreur.
    if (status === 401 && req.method === 'GET') return;
    if (status === 404 && req.method === 'GET') return;

    const { category, action } = describeRequest(req.method, path);
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const durationMs = Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    const details: Record<string, unknown> = {};
    const query = Object.keys(req.query || {});
    if (query.length) details.query = query.slice(0, 10);
    if (errorCode && status >= 400) details.code = errorCode;
    logActivity(req, {
      level, category, action, status, durationMs, details,
      userId: (req as any).user?.id ?? bodyUser?.id ?? null,
      userRole: (req as any).user?.role ?? bodyUser?.role ?? null,
    });
  });
  next();
};
