import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, filterValue, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';
import {
  base32Encode, currentStep, decryptSecret, encryptSecret, generateTotpSecret, hashRecoveryCode, totpAt, verifyTotp,
} from '../server/utils/totp';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn((payload: any) => (payload.purpose === 'mfa' ? 'challenge-token' : 'session-token')),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/services/emailService', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ success: true }),
  getAppUrl: () => 'https://app.test',
}));

process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SECRET = generateTotpSecret();

const cookies = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
};

const setup = (handlers: Record<string, Handler>) => {
  const mock = createSupabaseMock(handlers);
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

const enabledMfa = (overrides: Record<string, any> = {}) => ({
  user_id: USER_ID,
  secret_enc: encryptSecret(SECRET),
  enabled_at: new Date().toISOString(),
  last_used_step: null,
  recovery_codes: [hashRecoveryCode('abcd-1234')],
  failed_attempts: 0,
  locked_until: null,
  ...overrides,
});

const mfaTable = (row: any): Handler => (q) => {
  if (q.op === 'select') return { data: row };
  if (q.op === 'update') return { data: { user_id: USER_ID } };
};

describe('TOTP (RFC 6238)', () => {
  const rfcSecret = base32Encode(Buffer.from('12345678901234567890'));

  it('respecte les vecteurs de test de la RFC', () => {
    expect(totpAt(rfcSecret, Math.floor(59 / 30))).toBe('287082');
    expect(totpAt(rfcSecret, Math.floor(1111111109 / 30))).toBe('081804');
    expect(totpAt(rfcSecret, Math.floor(2000000000 / 30))).toBe('279037');
  });

  it('accepte une période de décalage et refuse le rejeu', () => {
    const now = Date.now();
    const step = currentStep(now);
    expect(verifyTotp(SECRET, totpAt(SECRET, step - 1), null, now)).toBe(step - 1);
    expect(verifyTotp(SECRET, totpAt(SECRET, step - 3), null, now)).toBeNull();
    expect(verifyTotp(SECRET, totpAt(SECRET, step), step, now)).toBeNull();
    expect(verifyTotp(SECRET, 'abcdef', null, now)).toBeNull();
  });

  it('chiffre le secret de façon authentifiée', () => {
    const enc = encryptSecret(SECRET);
    expect(enc).not.toContain(SECRET);
    expect(decryptSecret(enc)).toBe(SECRET);
    const parts = enc.split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => decryptSecret(parts.join(':'))).toThrow();
  });
});

describe('Connexion avec double authentification', () => {
  let app: express.Express;
  const passwordHash = bcrypt.hashSync('StrongPassword123', 4);
  const dbUser = { id: USER_ID, email: 'admin@example.com', role: 'admin', token_version: 1, passwordHash, mfa_enabled: true };

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockImplementation(((token: string) => {
      if (token === 'challenge-token') return { id: USER_ID, token_version: 1, purpose: 'mfa' };
      if (token === 'session-token') return { id: USER_ID, token_version: 1 };
      throw new Error('invalid');
    }) as any);
  });

  it('n\'ouvre pas de session après le mot de passe seul', async () => {
    setup({ users: (q) => (q.op === 'select' ? { data: dbUser } : undefined) });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'StrongPassword123', captchaToken: 'x' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mfaRequired: true });
    const set = cookies(res);
    expect(set.some((c) => c.startsWith('token='))).toBe(false);
    expect(set.some((c) => c.startsWith('mfa_challenge=challenge-token') && c.includes('HttpOnly'))).toBe(true);
  });

  it('refuse le second facteur sans jeton d\'étape', async () => {
    setup({});
    const res = await request(app).post('/api/auth/2fa/login').send({ code: '123456' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('MFA_CHALLENGE_EXPIRED');
  });

  it('refuse un jeton de session utilisé comme jeton d\'étape', async () => {
    setup({});
    const res = await request(app)
      .post('/api/auth/2fa/login')
      .set('Cookie', ['mfa_challenge=session-token'])
      .send({ code: '123456' });
    expect(res.status).toBe(401);
  });

  it('ouvre la session avec un code TOTP valide', async () => {
    const mock = setup({
      users: (q) => (q.op === 'select' ? { data: dbUser } : undefined),
      user_mfa: mfaTable(enabledMfa()),
    });
    const res = await request(app)
      .post('/api/auth/2fa/login')
      .set('Cookie', ['mfa_challenge=challenge-token'])
      .send({ code: totpAt(SECRET, currentStep()) });

    expect(res.status).toBe(200);
    expect(cookies(res).some((c) => c.startsWith('token=session-token'))).toBe(true);
    const update = mock.queries.find((q) => q.table === 'user_mfa' && q.op === 'update');
    expect(update?.payload.last_used_step).toBe(currentStep());
    expect(filterValue(update!, 'or')).toBeTruthy();
  });

  it('compte un échec et refuse un code erroné', async () => {
    const mock = setup({
      users: (q) => (q.op === 'select' ? { data: dbUser } : undefined),
      user_mfa: mfaTable(enabledMfa({ failed_attempts: 4 })),
    });
    const wrong = totpAt(SECRET, currentStep() + 5);
    const res = await request(app)
      .post('/api/auth/2fa/login')
      .set('Cookie', ['mfa_challenge=challenge-token'])
      .send({ code: wrong });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('MFA_INVALID');
    expect(cookies(res).some((c) => c.startsWith('token='))).toBe(false);
    const update = mock.queries.find((q) => q.table === 'user_mfa' && q.op === 'update');
    expect(update?.payload.locked_until).toBeTruthy();
  });

  it('bloque les tentatives pendant le verrouillage, même avec le bon code', async () => {
    setup({
      users: (q) => (q.op === 'select' ? { data: dbUser } : undefined),
      user_mfa: mfaTable(enabledMfa({ locked_until: new Date(Date.now() + 60000).toISOString() })),
    });
    const res = await request(app)
      .post('/api/auth/2fa/login')
      .set('Cookie', ['mfa_challenge=challenge-token'])
      .send({ code: totpAt(SECRET, currentStep()) });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('MFA_LOCKED');
  });

  it('accepte un code de secours et le consomme', async () => {
    const mock = setup({
      users: (q) => (q.op === 'select' ? { data: dbUser } : undefined),
      user_mfa: mfaTable(enabledMfa()),
    });
    const res = await request(app)
      .post('/api/auth/2fa/login')
      .set('Cookie', ['mfa_challenge=challenge-token'])
      .send({ code: 'ABCD-1234' });

    expect(res.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'user_mfa' && q.op === 'update');
    expect(update?.payload.recovery_codes).toEqual([]);
  });

  it('un code e-mail ne remplace pas le second facteur', async () => {
    setup({
      email_verification_codes: (q) => (q.op === 'select'
        ? { data: { id: 'c1', code: '123456', attempts: 0, expires_at: new Date(Date.now() + 60000).toISOString() } }
        : undefined),
      users: (q) => (q.op === 'update' ? { data: { id: USER_ID, token_version: 1, role: 'admin', mfa_enabled: true } } : undefined),
    });
    const res = await request(app).post('/api/auth/verify-code').send({ email: 'admin@example.com', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.loginRequired).toBe(true);
    expect(cookies(res).some((c) => c.startsWith('token='))).toBe(false);
  });
});

describe('2FA obligatoire pour les admins', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('bloque la console admin tant que la 2FA n\'est pas active', async () => {
    setup({ users: usersHandler(sessionRow({ role: 'admin', mfa_enabled: false })) });
    const res = await request(app).get('/api/admin/billing/summary').set('Cookie', ['token=t']);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('MFA_SETUP_REQUIRED');
  });

  it('retire aussi les passe-droits admin des autres routes', async () => {
    setup({
      users: usersHandler(sessionRow({ role: 'admin', mfa_enabled: false, kyc_status: 'none' })),
    });
    const res = await request(app).post('/api/products').set('Cookie', ['token=t']).send({ name: 'Produit', price: 1 });
    expect(res.status).toBe(403);
  });

  it('active la 2FA après confirmation d\'un premier code', async () => {
    const pending = { user_id: USER_ID, pending_secret_enc: encryptSecret(SECRET), pending_created_at: new Date().toISOString(), enabled_at: null };
    const mock = setup({
      users: usersHandler(sessionRow({ role: 'admin', mfa_enabled: false })),
      user_mfa: (q) => (q.op === 'select' ? { data: pending } : undefined),
    });
    const res = await request(app)
      .post('/api/auth/2fa/enable')
      .set('Cookie', ['token=t'])
      .send({ code: totpAt(SECRET, currentStep()) });

    expect(res.status).toBe(200);
    expect(res.body.recoveryCodes).toHaveLength(10);
    const mfaUpdate = mock.queries.find((q) => q.table === 'user_mfa' && q.op === 'update');
    expect(mfaUpdate?.payload.secret_enc).toBe(pending.pending_secret_enc);
    expect(mfaUpdate?.payload.recovery_codes).not.toContain(res.body.recoveryCodes[0]);
    const userUpdate = mock.queries.find((q) => q.table === 'users' && q.op === 'update');
    expect(userUpdate?.payload).toEqual({ mfa_enabled: true });
  });

  it('refuse l\'activation avec un code faux', async () => {
    setup({
      users: usersHandler(sessionRow({ role: 'admin', mfa_enabled: false })),
      user_mfa: (q) => (q.op === 'select'
        ? { data: { user_id: USER_ID, pending_secret_enc: encryptSecret(SECRET), pending_created_at: new Date().toISOString() } }
        : undefined),
    });
    const res = await request(app)
      .post('/api/auth/2fa/enable')
      .set('Cookie', ['token=t'])
      .send({ code: totpAt(SECRET, currentStep() + 10) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MFA_INVALID');
  });

  it('génère un QR code sans stocker le secret en clair', async () => {
    const mock = setup({ users: usersHandler(sessionRow({ role: 'admin', mfa_enabled: false })) });
    const res = await request(app).post('/api/auth/2fa/setup').set('Cookie', ['token=t']).send({});
    expect(res.status).toBe(200);
    expect(res.body.qrSvg).toContain('<svg');
    expect(res.body.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
    const upsert = mock.queries.find((q) => q.table === 'user_mfa' && q.op === 'upsert');
    expect(upsert?.payload.pending_secret_enc).not.toContain(res.body.secret);
    expect(decryptSecret(upsert!.payload.pending_secret_enc)).toBe(res.body.secret);
  });
});

describe('Réinitialisation de la 2FA par un admin', () => {
  let app: express.Express;
  const TARGET = '44444444-4444-4444-8444-444444444444';

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('interdit à un admin de réinitialiser sa propre 2FA', async () => {
    setup({ users: usersHandler(sessionRow({ role: 'admin' })) });
    const res = await request(app).post(`/api/users/${USER_ID}/reset-mfa`).set('Cookie', ['token=t']);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MFA_SELF_RESET');
  });

  it('supprime le secret, ferme les sessions et journalise', async () => {
    const mock = setup({
      users: usersHandler(sessionRow({ role: 'admin' }), (q) => {
        if (q.op === 'select' && q.columns === 'id, email') return { data: { id: TARGET, email: 'cible@example.com' } };
        if (q.op === 'select') return { data: { token_version: 3 } };
      }),
    });
    const res = await request(app).post(`/api/users/${TARGET}/reset-mfa`).set('Cookie', ['token=t']);
    expect(res.status).toBe(200);
    expect(mock.queries.some((q) => q.table === 'user_mfa' && q.op === 'delete' && filterValue(q, 'eq', 'user_id')?.[1] === TARGET)).toBe(true);
    const updates = mock.queries.filter((q) => q.table === 'users' && q.op === 'update').map((q) => q.payload);
    expect(updates).toContainEqual({ mfa_enabled: false });
    expect(updates.some((p) => 'token_version' in p)).toBe(true);
    expect(mock.queries.some((q) => q.table === 'audit_logs' && q.op === 'insert')).toBe(true);
  });

  it('refuse un non-admin', async () => {
    setup({ users: usersHandler(sessionRow({ role: 'fournisseur' })) });
    const res = await request(app).post(`/api/users/${TARGET}/reset-mfa`).set('Cookie', ['token=t']);
    expect(res.status).toBe(403);
  });
});
