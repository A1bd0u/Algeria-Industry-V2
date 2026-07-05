import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const verifyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      
      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide ou expiré.' });
    }
  };
};

// Deprecated: use verifyRole instead. Keeping it for backward compatibility or replace it.
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
    }
    next();
  };
};
