import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../db/supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Colonnes relues en base à chaque requête authentifiée : le rôle, la
// suspension et les statuts de vérification ne sont jamais lus dans le JWT,
// pour qu'un changement côté admin prenne effet immédiatement.
const SESSION_COLUMNS = 'id, name, email, company, company_id, role, token_version, email_verified, kyc_status, mfa_enabled';

// La double authentification est obligatoire pour les admins, sauf
// désactivation explicite (ADMIN_MFA_REQUIRED=false, déconseillé).
export const adminMfaRequired = () => process.env.ADMIN_MFA_REQUIRED !== 'false';

export const mustSetupMfa = (role: string, mfaEnabled: boolean) =>
  role === 'admin' && !mfaEnabled && adminMfaRequired();

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  company: string | null;
  company_id: string | null;
  role: string;
  emailVerified: boolean;
  kycStatus: string;
  // Alias conservé pour le front : vrai uniquement si le KYC est approuvé.
  isVerified: boolean;
  mfaEnabled: boolean;
  // Admin sans double authentification : ses droits admin sont suspendus
  // (rôle ramené à « admin_mfa_pending ») jusqu'à l'activation.
  mfaSetupRequired: boolean;
}

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: number; error: string };

const authenticate = async (req: Request): Promise<AuthResult> => {
  const token = req.cookies?.token;
  if (!token) {
    return { ok: false, status: 401, error: 'Accès refusé. Non authentifié.' };
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return { ok: false, status: 401, error: 'Token invalide ou expiré.' };
  }

  if (!decoded?.id) {
    return { ok: false, status: 401, error: 'Token invalide ou révoqué.' };
  }

  try {
    const supabase = getSupabase();
    const { data: row } = await supabase
      .from('users')
      .select(SESSION_COLUMNS)
      .eq('id', decoded.id)
      .maybeSingle();

    if (!row || (row.token_version ?? 0) !== (decoded.token_version ?? 0)) {
      return { ok: false, status: 401, error: 'Token invalide ou révoqué.' };
    }

    const role: string = row.role || '';
    if (role.endsWith('_suspended')) {
      return { ok: false, status: 403, error: 'Ce compte a été suspendu.' };
    }

    const kycStatus = row.kyc_status || 'none';
    const mfaEnabled = Boolean(row.mfa_enabled);
    const mfaSetupRequired = mustSetupMfa(role, mfaEnabled);
    return {
      ok: true,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        company: row.company ?? null,
        company_id: row.company_id ?? null,
        // Toutes les vérifications « role === 'admin' » échouent tant que la
        // double authentification n'est pas activée.
        role: mfaSetupRequired ? 'admin_mfa_pending' : role,
        emailVerified: Boolean(row.email_verified),
        kycStatus,
        isVerified: kycStatus === 'approved',
        mfaEnabled,
        mfaSetupRequired,
      },
    };
  } catch {
    return { ok: false, status: 401, error: 'Token invalide ou expiré.' };
  }
};

// Utilisateur connecté s'il y en a un, sans exiger de session (routes publiques).
export const getOptionalUser = async (req: Request): Promise<SessionUser | null> => {
  if (!req.cookies?.token) return null;
  const result = await authenticate(req);
  return result.ok ? result.user : null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const result = await authenticate(req);
  if (result.ok === false) {
    return res.status(result.status).json({ error: result.error });
  }
  (req as any).user = result.user;
  next();
};

export const verifyRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await authenticate(req);
    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error });
    }
    (req as any).user = result.user;

    if (result.user.mfaSetupRequired && allowedRoles.includes('admin')) {
      return res.status(403).json({
        error: 'Activez la double authentification pour accéder à la console admin.',
        code: 'MFA_SETUP_REQUIRED',
      });
    }

    if (!allowedRoles.includes(result.user.role)) {
      return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
    }

    next();
  };
};

// Deprecated: use verifyRole instead.
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
    }
    next();
  };
};

// Adresse e-mail confirmée par code : suffit pour écrire des messages ou des avis.
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as SessionUser | undefined;
  if (!user || !user.emailVerified) {
    return res.status(403).json({ error: 'Accès interdit. Adresse e-mail non vérifiée.', code: 'EMAIL_NOT_VERIFIED' });
  }
  next();
};

// Conservé pour compatibilité : même sémantique que requireEmailVerified.
export const requireVerified = requireEmailVerified;

// Dossier KYC approuvé par un admin : requis pour publier produits et appels d'offres.
export const requireKyc = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as SessionUser | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Accès refusé. Non authentifié.' });
  }
  if (user.role === 'admin') {
    return next();
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: 'Accès interdit. Adresse e-mail non vérifiée.', code: 'EMAIL_NOT_VERIFIED' });
  }
  if (user.kycStatus !== 'approved') {
    return res.status(403).json({ error: 'Accès interdit. Vérification KYC requise.', code: 'KYC_REQUIRED' });
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
