import { MemoryStore } from 'express-rate-limit';
import type { IncrementResponse, Options, Store } from 'express-rate-limit';
import { logger } from './logger';

// Store de rate limiting partagé entre les instances Cloud Run, via l'API
// REST d'Upstash Redis (HTTPS : pas de connexion TCP persistante à gérer).
//   UPSTASH_REDIS_REST_URL   : https://<base>.upstash.io
//   UPSTASH_REDIS_REST_TOKEN : jeton d'accès
// Sans configuration, chaque limiteur garde le store mémoire (une instance).
// Si Redis est injoignable, le compteur mémoire de l'instance prend le relais :
// la limite reste appliquée, seulement moins précise.

const REDIS_TIMEOUT_MS = 800;

export const isSharedRateLimitEnabled = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

type RedisCommand = (string | number)[];

const pipeline = async (commands: RedisCommand[]): Promise<any[]> => {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/+$/, '');
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands.map((command) => command.map(String))),
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Upstash HTTP ${response.status}`);
  const results: any[] = await response.json();
  const failed = results.find((r) => r?.error);
  if (failed) throw new Error(`Upstash: ${failed.error}`);
  return results.map((r) => r?.result);
};

export class UpstashRateLimitStore implements Store {
  localKeys = false;
  prefix: string;
  private windowMs = 60_000;
  private fallback = new MemoryStore();
  private lastErrorLog = 0;

  constructor(name: string) {
    this.prefix = `rl:${name}:`;
  }

  init(options: Options) {
    this.windowMs = options.windowMs;
    this.fallback.init(options);
  }

  private onError(err: unknown) {
    // Un log par minute au plus pour ne pas inonder les journaux en cas de panne.
    if (Date.now() - this.lastErrorLog > 60_000) {
      this.lastErrorLog = Date.now();
      logger.error('Rate limit Redis indisponible, repli sur la mémoire locale', err);
    }
  }

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = this.prefix + key;
    try {
      // Fenêtre fixe : le premier hit pose l'expiration (NX), les suivants
      // incrémentent sans la prolonger.
      const [hits, , ttl] = await pipeline([
        ['INCR', redisKey],
        ['PEXPIRE', redisKey, this.windowMs, 'NX'],
        ['PTTL', redisKey],
      ]);
      const remainingMs = Number(ttl) > 0 ? Number(ttl) : this.windowMs;
      return { totalHits: Number(hits), resetTime: new Date(Date.now() + remainingMs) };
    } catch (err) {
      this.onError(err);
      return this.fallback.increment(key);
    }
  }

  async decrement(key: string) {
    try {
      await pipeline([['DECR', this.prefix + key]]);
    } catch (err) {
      this.onError(err);
      this.fallback.decrement(key);
    }
  }

  async resetKey(key: string) {
    try {
      await pipeline([['DEL', this.prefix + key]]);
    } catch (err) {
      this.onError(err);
      this.fallback.resetKey(key);
    }
  }
}

// Un store distinct par limiteur (express-rate-limit refuse de partager une instance).
export const sharedStore = (name: string): Store | undefined =>
  isSharedRateLimitEnabled() ? new UpstashRateLimitStore(name) : undefined;
