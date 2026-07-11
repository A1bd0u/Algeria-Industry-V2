import { describe, it, expect, vi } from 'vitest';
import { requireAuth, verifyRole, verifyOwnership } from '../server/middlewares/authMiddleware';
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

describe('Middlewares', () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it('requireAuth devrait rejeter si aucun token', async () => {
    const req: any = { cookies: {} };
    const res = mockResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accès refusé. Non authentifié.' });
  });

  it('verifyRole devrait rejeter si le rôle est insuffisant', async () => {
    const req: any = { cookies: { token: 'valid-token' } };
    const res = mockResponse();
    const next = vi.fn();

    vi.mocked(jwt.verify).mockReturnValue({ id: '1', role: 'acheteur', token_version: 1 } as any);
    
    // Mock supabase to return valid token_version
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const middleware = verifyRole(['admin', 'fournisseur']);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accès interdit. Rôle insuffisant.' });
  });

  it('verifyRole devrait accepter si le rôle est suffisant', async () => {
    const req: any = { cookies: { token: 'valid-token' } };
    const res = mockResponse();
    const next = vi.fn();

    vi.mocked(jwt.verify).mockReturnValue({ id: '1', role: 'fournisseur', token_version: 1 } as any);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const middleware = verifyRole(['admin', 'fournisseur']);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('verifyOwnership devrait accepter si le rôle est admin', async () => {
    const req: any = { user: { id: '1', role: 'admin' }, params: { id: '123' } };
    const res = mockResponse();
    const next = vi.fn();

    const middleware = verifyOwnership('products');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('verifyOwnership devrait rejeter si non propriétaire', async () => {
    const req: any = { user: { id: '1', role: 'fournisseur' }, params: { id: '123' } };
    const res = mockResponse();
    const next = vi.fn();

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: '999' } }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const middleware = verifyOwnership('products');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accès refusé. Non propriétaire.' });
  });

  it('verifyOwnership devrait accepter si propriétaire', async () => {
    const req: any = { user: { id: '1', role: 'fournisseur' }, params: { id: '123' } };
    const res = mockResponse();
    const next = vi.fn();

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: '1' } }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const middleware = verifyOwnership('products');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
