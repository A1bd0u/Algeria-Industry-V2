import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): boolean =>
  typeof value === 'string' && UUID_REGEX.test(value);

// Valide que chaque paramètre de route listé est un UUID avant toute requête.
// Empêche l'injection de filtres PostgREST via les valeurs concaténées dans .or(...).
export const requireUuidParams = (...names: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of names) {
      if (!isUuid(req.params[name])) {
        return res.status(400).json({ error: 'Identifiant invalide', code: 'INVALID_ID' });
      }
    }
    next();
  };
};
