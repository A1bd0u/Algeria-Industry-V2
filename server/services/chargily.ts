import crypto from 'crypto';
import { logger } from '../utils/logger';

// Paiement en ligne CIB / Edahabia via Chargily Pay (API v2).
// Désactivé tant que CHARGILY_SECRET_KEY n'est pas configurée : le client ne
// voit alors que le paiement par virement.
//   CHARGILY_SECRET_KEY : clé secrète (test_sk_… ou live_sk_…)
//   CHARGILY_MODE       : "live" pour la production, sinon environnement de test

const MIN_AMOUNT_DZD = 50;

export const isOnlinePaymentEnabled = () => Boolean(process.env.CHARGILY_SECRET_KEY);

const apiBase = () =>
  process.env.CHARGILY_MODE === 'live'
    ? 'https://pay.chargily.net/api/v2'
    : 'https://pay.chargily.net/test/api/v2';

export interface CheckoutRequest {
  amount: number;
  description: string;
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  locale?: 'fr' | 'ar' | 'en';
}

export interface Checkout {
  id: string;
  checkoutUrl: string;
}

export const createCheckout = async (req: CheckoutRequest): Promise<Checkout> => {
  const secret = process.env.CHARGILY_SECRET_KEY;
  if (!secret) throw new Error('Paiement en ligne non configuré');
  if (req.amount < MIN_AMOUNT_DZD) throw new Error('Montant inférieur au minimum accepté');

  const response = await fetch(`${apiBase()}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(req.amount),
      currency: 'dzd',
      success_url: req.successUrl,
      failure_url: req.failureUrl,
      webhook_endpoint: req.webhookUrl,
      description: req.description,
      locale: req.locale || 'fr',
      metadata: req.metadata,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id || !data?.checkout_url) {
    logger.error('Chargily checkout error', { status: response.status, message: data?.message });
    throw new Error('Le service de paiement est indisponible. Réessayez plus tard ou payez par virement.');
  }
  return { id: String(data.id), checkoutUrl: String(data.checkout_url) };
};

// Signature du webhook : HMAC-SHA256 du corps brut avec la clé secrète,
// transmise en hexadécimal dans l'en-tête « signature ».
export const verifyWebhookSignature = (rawBody: Buffer, signature: string | undefined): boolean => {
  const secret = process.env.CHARGILY_SECRET_KEY;
  if (!secret || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature.toLowerCase(), 'hex'));
};
