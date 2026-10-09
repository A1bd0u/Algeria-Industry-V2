import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';

// Requêtes sortantes vers une adresse fournie par un client (webhook, flux
// catalogue). Garde-fous contre la falsification de requêtes côté serveur :
//   - https uniquement (http accepté en développement local) ;
//   - aucune adresse privée, locale ou réservée, contrôlée sur l'adresse IP
//     réellement utilisée pour la connexion (pas de contournement par DNS) ;
//   - pas de redirection suivie, délai et taille de réponse bornés.

export class SafeFetchError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const ipv4ToInt = (ip: string) => ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;

const IPV4_BLOCKED: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];

export const isPublicIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const value = ipv4ToInt(ip);
    return !IPV4_BLOCKED.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (value & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicIp(mapped[1]);
    if (lower === '::' || lower === '::1') return false;
    // fc00::/7 (adresses uniques locales), fe80::/10 (lien local), ff00::/8 (multidiffusion).
    if (/^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff')) return false;
    // 2001:db8::/32 (documentation), 64:ff9b::/96 (traduction NAT64).
    if (lower.startsWith('2001:db8') || lower.startsWith('64:ff9b')) return false;
    return true;
  }
  return false;
};

const allowHttp = () => process.env.NODE_ENV !== 'production' && process.env.INTEGRATIONS_ALLOW_HTTP === 'true';
const allowPrivate = () => process.env.NODE_ENV !== 'production' && process.env.INTEGRATIONS_ALLOW_PRIVATE === 'true';

// Contrôle de forme d'une adresse saisie par un client (avant toute requête).
export const validateOutboundUrl = (raw: string): URL => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeFetchError('URL_INVALID', 'Adresse invalide.');
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && allowHttp())) {
    throw new SafeFetchError('URL_NOT_HTTPS', "L'adresse doit commencer par https://.");
  }
  if (url.username || url.password) {
    throw new SafeFetchError('URL_CREDENTIALS', "Pas d'identifiants dans l'adresse : utilisez un jeton dans le chemin ou la requête.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!allowPrivate() && (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal'))) {
    throw new SafeFetchError('URL_PRIVATE', 'Adresse locale ou privée refusée.');
  }
  if (!allowPrivate() && net.isIP(host) && !isPublicIp(host)) {
    throw new SafeFetchError('URL_PRIVATE', 'Adresse locale ou privée refusée.');
  }
  return url;
};

// Résolution DNS contrôlée : la connexion n'a lieu que vers une IP publique.
const guardedLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return (callback as any)(err);
    const list = (addresses as unknown as dns.LookupAddress[]) || [];
    const usable = allowPrivate() ? list : list.filter((a) => isPublicIp(a.address));
    if (usable.length === 0) {
      return (callback as any)(new SafeFetchError('URL_PRIVATE', 'Adresse locale ou privée refusée.'));
    }
    if ((options as any)?.all) return (callback as any)(null, usable);
    return (callback as any)(null, usable[0].address, usable[0].family);
  });
};

export type SafeResponse = { status: number; headers: http.IncomingHttpHeaders; body: Buffer };

export const safeRequest = (
  rawUrl: string,
  opts: { method?: 'GET' | 'POST'; headers?: Record<string, string>; body?: string; timeoutMs?: number; maxBytes?: number } = {},
): Promise<SafeResponse> => {
  const url = validateOutboundUrl(rawUrl);
  const { method = 'GET', headers = {}, body, timeoutMs = 10_000, maxBytes = 1_000_000 } = opts;
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method,
      headers: { 'User-Agent': 'Industigo-Integrations/1.0', ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}) },
      lookup: guardedLookup,
      timeout: timeoutMs,
    }, (res) => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          req.destroy(new SafeFetchError('RESPONSE_TOO_LARGE', `Réponse trop volumineuse (plus de ${Math.round(maxBytes / 1_000_000)} Mo).`));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new SafeFetchError('TIMEOUT', 'Le serveur distant ne répond pas (délai dépassé).')));
    req.on('error', (err) => reject(err instanceof SafeFetchError ? err : new SafeFetchError('NETWORK', err.message || 'Erreur réseau.')));
    if (body) req.write(body);
    req.end();
  });
};
