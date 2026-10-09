import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../db/supabaseClient';
import { getEntitlements, type ApiScope } from '../services/integrations/entitlements';
import { API_KEY_PREFIX, hashApiKey } from '../services/integrations/signature';
import type { SessionUser } from './authMiddleware';

// Authentification de l'API publique par clé :
//   Authorization: Bearer ind_live_…
// La clé est retrouvée par son empreinte. Le compte est relu à chaque appel :
// suspension, perte du KYC ou fin de l'offre Pro prennent effet aussitôt.

const USER_COLUMNS = 'id, name, email, company, company_id, role, email_verified, kyc_status';
const TOUCH_INTERVAL_MS = 5 * 60_000;

const deny = (res: Response, status: number, code: string, error: string) => res.status(status).json({ error, code });

export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.get('authorization') || '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key.startsWith(API_KEY_PREFIX) || key.length > 200) {
    return deny(res, 401, 'API_KEY_MISSING', 'Clé d\'API manquante : en-tête « Authorization: Bearer <clé> ».');
  }

  try {
    const supabase = getSupabase();
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('id, user_id, scopes, revoked_at, last_used_at')
      .eq('key_hash', hashApiKey(key))
      .maybeSingle();
    if (!apiKey || apiKey.revoked_at) return deny(res, 401, 'API_KEY_INVALID', 'Clé d\'API invalide ou révoquée.');

    const { data: row } = await supabase.from('users').select(USER_COLUMNS).eq('id', apiKey.user_id).maybeSingle();
    if (!row || String(row.role || '').endsWith('_suspended')) return deny(res, 403, 'ACCOUNT_SUSPENDED', 'Compte suspendu.');

    const user: SessionUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company ?? null,
      company_id: row.company_id ?? null,
      role: row.role,
      emailVerified: Boolean(row.email_verified),
      kycStatus: row.kyc_status || 'none',
      isVerified: row.kyc_status === 'approved',
      mfaEnabled: false,
      mfaSetupRequired: false,
    };
    const rights = await getEntitlements(user);
    if (!rights.apiKeys) return deny(res, 403, 'API_NOT_ALLOWED', 'L\'API n\'est plus incluse dans votre offre.');

    // Permissions effectives : celles de la clé, dans la limite des droits actuels.
    const scopes = (apiKey.scopes as ApiScope[]).filter((s) => rights.scopes.includes(s));
    (req as any).user = user;
    (req as any).apiScopes = scopes;

    if (!apiKey.last_used_at || Date.now() - new Date(apiKey.last_used_at).getTime() > TOUCH_INTERVAL_MS) {
      supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id).then(() => undefined, () => undefined);
    }
    next();
  } catch {
    return deny(res, 500, 'API_AUTH_FAILED', 'Authentification impossible pour le moment.');
  }
};

export const requireScope = (scope: ApiScope) => (req: Request, res: Response, next: NextFunction) => {
  const scopes = ((req as any).apiScopes || []) as ApiScope[];
  if (!scopes.includes(scope)) return deny(res, 403, 'API_SCOPE_MISSING', `Permission « ${scope} » requise pour cette clé.`);
  next();
};
