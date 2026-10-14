import type { NextFunction, Request, Response } from 'express';

// Micro-cache des lectures publiques (catalogue, annuaire, actualités).
// Seules les requêtes anonymes passent par le cache : un visiteur connecté
// (cookie de session ou clé d'API) reçoit toujours une réponse fraîche, qui
// peut dépendre de ses droits. Toute écriture sur l'API vide le cache.

type Entry = { body: string; contentType: string; expires: number };

const MAX_ENTRIES = 500;
const store = new Map<string, Entry>();

export const clearPublicCache = () => store.clear();

const isAnonymous = (req: Request) => !req.cookies?.token && !req.headers.authorization;

export const publicCache = (ttlSeconds: number, { enabled = process.env.NODE_ENV !== 'test' } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!enabled || req.method !== 'GET' || !isAnonymous(req)) return next();

    // Le navigateur peut réutiliser la réponse brièvement ; elle varie selon la session.
    res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 5}`);
    res.vary('Cookie');

    const key = req.originalUrl;
    const hit = store.get(key);
    if (hit && hit.expires > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.type(hit.contentType).send(hit.body);
    }
    if (hit) store.delete(key);

    res.set('X-Cache', 'MISS');
    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
        store.set(key, { body: JSON.stringify(body), contentType: 'application/json; charset=utf-8', expires: Date.now() + ttlSeconds * 1000 });
      } else {
        res.set('Cache-Control', 'no-store');
      }
      return json(body);
    };
    next();
  };

// À placer avant les routes : une création, modification ou suppression rend
// le cache obsolète.
export const invalidateOnWrite = (req: Request, _res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') clearPublicCache();
  next();
};
