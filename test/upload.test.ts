import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(() => 'signed-token'),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

describe('Upload Integration', () => {
  let app: express.Express;
  let mock: ReturnType<typeof createSupabaseMock>;
  const session = sessionRow();

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: session.id, token_version: 1 } as any);
    mock = createSupabaseMock({ users: usersHandler(session) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  });

  it('devrait rejeter un fichier avec les mauvais magic bytes', async () => {
    const fakeBuffer = Buffer.from('ceci n\'est pas un pdf');

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', ['token=valid-token'])
      .attach('file', fakeBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Type de fichier non reconnu');
  });

  it('range un document KYC dans le bucket privé, sous le dossier de l\'utilisateur, sans URL publique', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4\n%EOF');

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', ['token=valid-token'])
      .attach('file', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.private).toBe(true);
    expect(res.body.url.startsWith(`${session.id}/`)).toBe(true);
    expect(mock.client.storage.from).toHaveBeenCalledWith('kyc-documents');
    expect(mock.storageBucket.getPublicUrl).not.toHaveBeenCalled();
  });

  it('renvoie une URL publique pour une image produit', async () => {
    const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

    const res = await request(app)
      .post('/api/upload?bucket=product-images')
      .set('Cookie', ['token=valid-token'])
      .attach('file', pngBuffer, { filename: 'p.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.url.startsWith('https://cdn.test/')).toBe(true);
  });
});
