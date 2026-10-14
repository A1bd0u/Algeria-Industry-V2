import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { clearPublicCache, invalidateOnWrite, publicCache } from '../server/middlewares/publicCache';

const buildApp = () => {
  let calls = 0;
  const app = express();
  app.use(cookieParser());
  app.use('/api', invalidateOnWrite);
  app.get('/api/items', publicCache(60, { enabled: true }), (_req, res) => {
    calls += 1;
    res.json({ calls });
  });
  app.get('/api/missing', publicCache(60, { enabled: true }), (_req, res) => {
    calls += 1;
    res.status(404).json({ calls });
  });
  app.post('/api/items', (_req, res) => res.json({ ok: true }));
  return { app, calls: () => calls };
};

describe('cache des lectures publiques', () => {
  beforeEach(() => clearPublicCache());

  it('sert la deuxième lecture anonyme depuis le cache', async () => {
    const { app, calls } = buildApp();
    const first = await request(app).get('/api/items');
    const second = await request(app).get('/api/items');
    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body).toEqual({ calls: 1 });
    expect(calls()).toBe(1);
    expect(first.headers['cache-control']).toContain('public');
    expect(first.headers.vary).toContain('Cookie');
  });

  it('ne met jamais en cache un visiteur connecté', async () => {
    const { app, calls } = buildApp();
    await request(app).get('/api/items');
    const res = await request(app).get('/api/items').set('Cookie', ['token=abc']);
    expect(res.headers['x-cache']).toBeUndefined();
    expect(res.body).toEqual({ calls: 2 });
    expect(calls()).toBe(2);
  });

  it('vide le cache après une écriture', async () => {
    const { app } = buildApp();
    await request(app).get('/api/items');
    await request(app).post('/api/items');
    const res = await request(app).get('/api/items');
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.body).toEqual({ calls: 2 });
  });

  it('ne garde pas les erreurs', async () => {
    const { app, calls } = buildApp();
    await request(app).get('/api/missing');
    const res = await request(app).get('/api/missing');
    expect(res.status).toBe(404);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(calls()).toBe(2);
  });
});
