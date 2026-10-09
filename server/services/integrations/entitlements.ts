import type { SessionUser } from '../../middlewares/authMiddleware';
import { getCompanyPlan, type CompanyPlan } from '../billingService';

// Droits d'intégration selon le rôle et l'offre :
//   - fournisseur Basic : flux catalogue quotidien ;
//   - fournisseur Pro / membre fondateur : flux horaire, webhooks, clés d'API ;
//   - acheteur : webhooks et clé d'API en lecture de ses messages (gratuit).
// Publier des produits (flux, API en écriture) exige un KYC approuvé.

export const API_SCOPES = ['products:read', 'products:write', 'messages:read'] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export const WEBHOOK_EVENTS = ['message.received', 'quote_request.received', 'catalog.sync_completed'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type Entitlements = {
  plan: CompanyPlan;
  feed: boolean;
  feedHourly: boolean;
  webhooks: boolean;
  apiKeys: boolean;
  scopes: ApiScope[];
  events: WebhookEvent[];
};

const SUPPLIER_ROLES = ['fournisseur', 'exposant'];
const PREMIUM: CompanyPlan[] = ['pro', 'founder'];

export const isSupplier = (user: Pick<SessionUser, 'role'>) => SUPPLIER_ROLES.includes(user.role);

export const entitlementsFor = (user: Pick<SessionUser, 'role' | 'emailVerified' | 'kycStatus'>, plan: CompanyPlan): Entitlements => {
  const none: Entitlements = { plan, feed: false, feedHourly: false, webhooks: false, apiKeys: false, scopes: [], events: [] };
  if (!user.emailVerified) return none;
  if (user.role === 'admin') {
    return { plan, feed: true, feedHourly: true, webhooks: true, apiKeys: true, scopes: [...API_SCOPES], events: [...WEBHOOK_EVENTS] };
  }
  if (isSupplier(user)) {
    const kyc = user.kycStatus === 'approved';
    const premium = PREMIUM.includes(plan);
    return {
      plan,
      feed: kyc && plan !== 'free',
      feedHourly: kyc && premium,
      webhooks: premium,
      apiKeys: premium,
      scopes: premium ? (kyc ? ['products:read', 'products:write', 'messages:read'] : ['products:read', 'messages:read']) : [],
      events: premium ? [...WEBHOOK_EVENTS] : [],
    };
  }
  if (user.role === 'acheteur') {
    return { plan, feed: false, feedHourly: false, webhooks: true, apiKeys: true, scopes: ['messages:read'], events: ['message.received'] };
  }
  return none;
};

export const getEntitlements = async (user: SessionUser): Promise<Entitlements> =>
  entitlementsFor(user, isSupplier(user) ? await getCompanyPlan(user.company_id) : 'free');
