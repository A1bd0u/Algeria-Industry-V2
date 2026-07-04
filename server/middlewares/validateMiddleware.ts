import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Erreur de validation des données',
          details: (error as any).errors || error.issues
        });
      }
      return res.status(500).json({ error: 'Erreur interne de validation' });
    }
  };
};
