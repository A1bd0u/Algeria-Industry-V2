import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { UpstashRateLimitStore, sharedStore } from '../server/utils/rateLimitStore';

describe('Store de rate limiting partagé (Upstash)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test/';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.unstubAllGlobals();
  });

  const redisReply = (results: any[]) => ({ ok: true, json: async () => results.map((result) => ({ result })) });

  it('n\'utilise Redis que s\'il est configuré', () => {
    expect(sharedStore('x')).toBeInstanceOf(UpstashRateLimitStore);
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(sharedStore('x')).toBeUndefined();
  });

  it('incrémente le compteur avec une expiration posée une seule fois', async () => {
    fetchMock.mockResolvedValue(redisReply([3, 0, 42000]));
    const store = new UpstashRateLimitStore('auth');
    store.init({ windowMs: 60000 } as any);

    const result = await store.increment('1.2.3.4');
    expect(result.totalHits).toBe(3);
    expect(result.resetTime!.getTime()).toBeGreaterThan(Date.now() + 40000);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://redis.test/pipeline');
    expect(init.headers.Authorization).toBe('Bearer secret-token');
    expect(JSON.parse(init.body)).toEqual([
      ['INCR', 'rl:auth:1.2.3.4'],
      ['PEXPIRE', 'rl:auth:1.2.3.4', '60000', 'NX'],
      ['PTTL', 'rl:auth:1.2.3.4'],
    ]);
  });

  it('se replie sur la mémoire locale si Redis est injoignable', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    const store = new UpstashRateLimitStore('auth');
    store.init({ windowMs: 60000 } as any);

    expect((await store.increment('k')).totalHits).toBe(1);
    expect((await store.increment('k')).totalHits).toBe(2);
  });

  it('applique la limite commune à toutes les instances', async () => {
    // Redis voit déjà 5 requêtes venant d'autres instances.
    let hits = 5;
    fetchMock.mockImplementation(async () => redisReply([++hits, 0, 30000]));
    const app = express();
    app.use(rateLimit({ store: new UpstashRateLimitStore('test'), windowMs: 60000, max: 6, keyGenerator: () => 'ip' }));
    app.get('/', (_req, res) => res.send('ok'));

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(429);
  });
});
