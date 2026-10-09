import crypto from 'crypto';

// Signature des webhooks, à la manière de Stripe :
//   X-Industigo-Signature: t=<horodatage unix>,v1=<HMAC-SHA256 hex de "t.corps">
// Le destinataire recalcule l'empreinte avec son secret et refuse les envois
// de plus de 5 minutes (protection contre le rejeu).

export const signPayload = (secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)) => {
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
};

export const verifySignature = (secret: string, body: string, header: string, toleranceSeconds = 300, now = Math.floor(Date.now() / 1000)) => {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1 || Math.abs(now - timestamp) > toleranceSeconds) return false;
  const expected = Buffer.from(signPayload(secret, body, timestamp).split('v1=')[1], 'hex');
  const received = Buffer.from(parts.v1, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

// Clés d'API : « ind_live_ » + 32 octets aléatoires. Seule l'empreinte
// SHA-256 est stockée ; le préfixe affiché permet de reconnaître la clé.
export const API_KEY_PREFIX = 'ind_live_';

export const generateApiKey = () => {
  const key = API_KEY_PREFIX + crypto.randomBytes(32).toString('base64url');
  return { key, prefix: key.slice(0, API_KEY_PREFIX.length + 6), hash: hashApiKey(key) };
};

export const hashApiKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

export const generateWebhookSecret = () => 'whsec_' + crypto.randomBytes(24).toString('base64url');
