import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../db/supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.id) {
      const supabase = getSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('token_version')
        .eq('id', decoded.id)
        .maybeSingle();
        
      if (!user || user.token_version !== decoded.token_version) {
        return res.status(401).json({ error: 'Token invalide ou révoqué.' });
      }
    }

    (req as any).user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const verifyRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (decoded.id) {
        const supabase = getSupabase();
        const { data: user } = await supabase
          .from('users')
          .select('token_version')
          .eq('id', decoded.id)
          .maybeSingle();
          
        if (!user || user.token_version !== decoded.token_version) {
          return res.status(401).json({ error: 'Token invalide ou révoqué.' });
        }
      }

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

export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !user.isVerified) {
    return res.status(403).json({ error: 'Accès interdit. Compte non vérifié.' });
  }
  next();
};

export const verifyOwnership = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
    }

    if (user.role === 'admin') {
      return next();
    }

    const itemId = req.params.id;
    if (!itemId) {
      return res.status(400).json({ error: 'ID requis' });
    }

    try {
      const supabase = getSupabase();
      const { data: item, error } = await supabase
        .from(tableName)
        .select('owner_id')
        .eq('id', itemId)
        .maybeSingle();

      if (error || !item) {
        return res.status(404).json({ error: 'Élément introuvable' });
      }

      if (item.owner_id !== user.id) {
        return res.status(403).json({ error: 'Accès refusé. Non propriétaire.' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la vérification des droits' });
    }
  };
};
