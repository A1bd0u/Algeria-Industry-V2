import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { redact } from '../server/middlewares/errorMiddleware';
import { renderTemplate } from '../server/services/emailService';
import { createSupabaseMock, sessionRow, usersHandler, filterValue } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(() => 'signed-token'),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/utils/auditLogger', () => ({
  logAdminAction: vi.fn(),
}));

const TARGET_ID = '77777777-7777-4777-8777-777777777777';

describe('Régressions de sécurité P0', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
  });

  // P0-1 : politiques RLS
  it('P0-1 : la migration supprime les clauses IS NULL et protège le hash', () => {
    const dir = path.join(__dirname, '..', 'supabase', 'migrations');
    const file = fs.readdirSync(dir).find((f) => f.includes('security_p0_hardening'));
    expect(file).toBeDefined();
    const sql = fs.readFileSync(path.join(dir, file!), 'utf-8');
    expect(sql).toContain('DROP POLICY IF EXISTS "Allow users to write own profile and admins all"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Allow owner and admin to write companies"');
    expect(sql).not.toMatch(/OR\s+public\.get_current_user_id\(\)\s+IS\s+NULL/i);
    expect(sql).not.toMatch(/OR\s+owner_id\s+IS\s+NULL/i);
    expect(sql).toMatch(/REVOKE SELECT, INSERT, UPDATE ON public\.users FROM anon, authenticated/);
  });

  // P0-2 : /me ne renvoie jamais le hash, pas de repli sur le JWT
  it('P0-2 : /api/auth/me renvoie une liste blanche de colonnes', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow(), () => ({
        data: { ...sessionRow(), passwordHash: '$2a$12$secret', passwordhash: '$2a$12$secret', companies: { status: 'approved' } },
      })),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/auth/me').set('Cookie', ['token=t']);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('$2a$');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('token_version');
    const select = mock.queries.find((q) => q.table === 'users' && q.columns?.includes('reference_id'));
    expect(select?.columns).not.toContain('*');
  });

  it('P0-2 : /api/auth/me refuse un JWT dont l\'utilisateur n\'existe pas (pas de repli)', async () => {
    const mock = createSupabaseMock({ users: usersHandler(null) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/auth/me').set('Cookie', ['token=t']);
    expect(res.status).toBe(401);
  });

  // P0-3 : OAuth simulé supprimé
  it('P0-3 : les routes OAuth simulées n\'existent plus', async () => {
    const url = await request(app).get('/api/auth/oauth/url?provider=google');
    const cb = await request(app).get('/api/auth/oauth/callback/google?code=anything');
    expect(url.status).toBe(404);
    expect(cb.status).toBe(404);
    expect(cb.headers['set-cookie']).toBeUndefined();
  });

  // P0-4 : injection de filtre PostgREST
  it('P0-4 : un conversationId non-UUID est rejeté avant toute requête', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app)
      .get('/api/messages/x),or(sender_id.neq.00000000-0000-0000-0000-000000000000')
      .set('Cookie', ['token=t']);

    expect(res.status).toBe(400);
    expect(mock.queries.some((q) => q.table === 'messages')).toBe(false);
  });

  it('P0-4 : un id de /api/users/:id/details non-UUID est rejeté', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'admin' })) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/users/1,receiver_id.neq.x/details').set('Cookie', ['token=t']);
    expect(res.status).toBe(400);
  });

  // P0-5 : rôle et suspension relus en base, token_version incrémenté
  it('P0-5 : un JWT "admin" d\'un utilisateur rétrogradé n\'ouvre pas la console', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', role: 'admin', token_version: 1 } as any);
    const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'acheteur' })) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/users').set('Cookie', ['token=t']);
    expect(res.status).toBe(403);
  });

  it('P0-5 : un changement de rôle incrémente token_version', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow({ role: 'admin' }), (q) => {
        if (q.op === 'select' && q.columns === 'email, role') return { data: { email: 't@x.dz', role: 'fournisseur' } };
        if (q.op === 'select' && q.columns === 'token_version') return { data: { token_version: 4 } };
      }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app)
      .put(`/api/users/${TARGET_ID}/role`)
      .set('Cookie', ['token=t'])
      .send({ role: 'acheteur' });

    expect(res.status).toBe(200);
    const bump = mock.queries.find((q) => q.table === 'users' && q.op === 'update' && q.payload.token_version !== undefined);
    expect(bump?.payload.token_version).toBe(5);
  });

  it('P0-5 : un rôle inconnu est refusé', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'admin' })) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app)
      .put(`/api/users/${TARGET_ID}/role`)
      .set('Cookie', ['token=t'])
      .send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });

  // P0-8 : pas d'e-mail des auteurs d'avis, pas de kyc_requests public
  it('P0-8 : les avis n\'exposent que le nom de l\'auteur', async () => {
    const mock = createSupabaseMock({
      reviews: () => ({ data: [{ id: 'r1', rating: 5, comment: 'Top', created_at: 'now', users: { name: 'Ali', email: 'ali@x.dz' } }] }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get(`/api/companies/${TARGET_ID}/reviews`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('ali@x.dz');
    const select = mock.queries.find((q) => q.table === 'reviews');
    expect(select?.columns).not.toContain('email');
    expect(filterValue(select!, 'eq', 'company_id')).toEqual(['company_id', TARGET_ID]);
  });

  it('P0-8 : la fiche entreprise publique ne joint pas kyc_requests', async () => {
    const mock = createSupabaseMock({ companies: () => ({ data: { id: TARGET_ID, name: 'ACME' } }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get(`/api/companies/${TARGET_ID}`);

    expect(res.status).toBe(200);
    const select = mock.queries.find((q) => q.table === 'companies');
    expect(select?.columns).not.toContain('kyc_requests');
    expect(select?.columns).not.toContain('nif');
  });

  // P0-9 : journaux sans secrets
  it('P0-9 : le gestionnaire d\'erreurs masque mots de passe et jetons', () => {
    const out = redact({ email: 'a@b.c', password: 'x', newPassword: 'y', nested: { token: 't', captchaToken: 'c' } });
    expect(out).toEqual({ email: 'a@b.c', password: '[REDACTED]', newPassword: '[REDACTED]', nested: { token: '[REDACTED]', captchaToken: '[REDACTED]' } });
  });

  it('P0-9 : Sentry Replay masque tout le texte côté client', () => {
    const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.tsx'), 'utf-8');
    expect(main).not.toContain('maskAllText: false');
  });

  // P0-10 : CSP
  it('P0-10 : la CSP interdit l\'intégration en iframe et unsafe-eval', async () => {
    const res = await request(app).get('/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/connect-src[^;]*\sws:/);
  });

  // P0-11 : statistiques admin
  it('P0-11 : /api/stats/admin est réservé aux admins', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'acheteur' })) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/stats/admin').set('Cookie', ['token=t']);
    expect(res.status).toBe(403);
  });

  // P0-12 : signalement sans dépublication
  it('P0-12 : un signalement crée une ligne reports sans modifier le produit', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow({ role: 'acheteur' })),
      products: () => ({ data: { id: TARGET_ID } }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app)
      .post(`/api/products/${TARGET_ID}/report`)
      .set('Cookie', ['token=t'])
      .send({ reason: 'Contenu trompeur' });

    expect(res.status).toBe(200);
    expect(mock.queries.some((q) => q.table === 'products' && q.op === 'update')).toBe(false);
    const report = mock.queries.find((q) => q.table === 'reports');
    expect(report?.op).toBe('upsert');
    expect(report?.payload[0]).toMatchObject({ target_type: 'product', target_id: TARGET_ID, status: 'pending' });
  });

  // P1 : échappement HTML des templates e-mail
  it('P1 : les variables des e-mails sont échappées', () => {
    const html = renderTemplate('kycRejected', { name: '<script>alert(1)</script>', reason: 'x', kycUrl: 'https://a' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  // P1 : pas de fuite de message SQL
  it('P1 : une erreur base de données ne fuit pas vers le client', async () => {
    const mock = createSupabaseMock({
      products: () => ({ data: null, error: { message: 'relation "products" does not exist', code: '42P01' } }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('relation');
  });

  // Données publiques trop larges
  it('les campagnes publiques ne renvoient que les publicités publiées, sans user_id', async () => {
    const mock = createSupabaseMock({ ads: () => ({ data: [] }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    await request(app).get('/api/campaigns');
    const select = mock.queries.find((q) => q.table === 'ads');
    expect(select?.columns).not.toContain('user_id');
    expect(filterValue(select!, 'in', 'status')).toBeDefined();
  });

  it('les anciennes API d\'appels d\'offres et de RFQ n\'existent plus', async () => {
    for (const path of ['/api/rfqs', '/api/tenders']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(404);
    }
  });
});
