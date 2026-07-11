import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

describe('Upload Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();

    // Mock authentication
    vi.mocked(jwt.verify).mockReturnValue({ id: '1', role: 'fournisseur', token_version: 1 } as any);
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdf' } }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://test.url' } })
        })
      }
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  it('devrait rejeter un fichier avec les mauvais magic bytes', async () => {
    // Create a fake file that claims to be a PDF but is just text (bad magic bytes)
    const fakeBuffer = Buffer.from('ceci n\'est pas un pdf');
    
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', ['token=valid-token'])
      .attach('file', fakeBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    // file-type module will not recognize the text buffer as pdf
    expect(res.body.error).toContain('Type de fichier non reconnu');
  });

  it('devrait accepter un vrai fichier PDF', async () => {
    // Create a minimal valid PDF buffer (magic bytes %PDF-)
    const pdfBuffer = Buffer.from('%PDF-1.4\n%EOF');
    
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', ['token=valid-token'])
      .attach('file', pdfBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('http://test.url');
  });
});
