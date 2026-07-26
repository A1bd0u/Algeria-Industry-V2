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

describe('Companies Ownership', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  it('devrait refuser la modification si l\'utilisateur n\'est pas propriétaire', async () => {
    // Mock user as someone who doesn't own the company
    vi.mocked(jwt.verify).mockReturnValue({ id: 'user-2', role: 'fournisseur', token_version: 1 } as any);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => {
        // Mock company with owner_id = 'user-1'
        return Promise.resolve({ data: { owner_id: 'user-1' } });
      })
    };
    
    // The second call is to check token version in auth middleware. Let's make it more robust.
    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } })
        };
      }
      if (table === 'companies') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: 'user-1' } })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    mockSupabase.from = fromMock;

    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const res = await request(app)
      .put('/api/companies/comp-123')
      .set('Cookie', ['token=valid-token'])
      .send({
        name: 'Updated Company'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Non autorisé à modifier cette entreprise');
  });

  it('devrait autoriser la modification si l\'utilisateur est propriétaire', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'fournisseur', token_version: 1 } as any);

    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } })
        };
      }
      if (table === 'companies') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: 'user-1' } }),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'comp-123', name: 'Updated Company' } })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const mockSupabase = { from: fromMock };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const res = await request(app)
      .put('/api/companies/comp-123')
      .set('Cookie', ['token=valid-token'])
      .send({
        name: 'Updated Company'
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Company');
  });

  it('devrait autoriser la modification si l\'utilisateur est admin', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: 'admin-1', role: 'admin', token_version: 1 } as any);

    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } })
        };
      }
      if (table === 'companies') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: 'user-1' } }),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'comp-123', name: 'Updated Company' } })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const mockSupabase = { from: fromMock };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const res = await request(app)
      .put('/api/companies/comp-123')
      .set('Cookie', ['token=valid-token'])
      .send({
        name: 'Updated Company'
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Company');
  });
});
