import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { logAdminAction } from '../server/utils/auditLogger';
import { sendNotificationEmail } from '../server/services/emailService';
import { createSupabaseMock, filterValue, sessionRow, usersHandler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/utils/auditLogger', () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../server/services/emailService', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

const CATALOGUE_ID = '66666666-6666-4666-8666-666666666666';
const COMPANY_ID = '77777777-7777-4777-8777-777777777777';
const admin = sessionRow({ role: 'admin', company_id: null });

const catalogueRow = (status: string) => ({
  id: CATALOGUE_ID, title: 'Catalogue pompes', status, company_id: COMPANY_ID,
  owner: { name: 'Karim', email: 'karim@example.com' },
});

describe('Modération des catalogues PDF', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
    vi.mocked(logAdminAction).mockClear();
    vi.mocked(sendNotificationEmail).mockClear();
  });

  it('est réservée aux administrateurs', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const list = await request(app).get('/api/admin/catalogues').set('Cookie', ['token=t']);
    expect(list.status).toBe(403);
    const patch = await request(app).patch(`/api/admin/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']).send({ status: 'removed', reason: 'Test' });
    expect(patch.status).toBe(403);
    expect(mock.queries.some((q) => q.table === 'catalogues')).toBe(false);
  });

  it('liste les catalogues retirés', async () => {
    const mock = createSupabaseMock({ users: usersHandler(admin), catalogues: () => ({ data: [catalogueRow('removed')] }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get('/api/admin/catalogues?status=removed').set('Cookie', ['token=t']);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(filterValue(mock.queries.find((q) => q.table === 'catalogues')!, 'eq', 'status')?.[1]).toBe('removed');
  });

  it('exige un motif pour retirer un catalogue', async () => {
    const mock = createSupabaseMock({ users: usersHandler(admin) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).patch(`/api/admin/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']).send({ status: 'removed' });
    expect(res.status).toBe(400);
    expect(mock.queries.some((q) => q.table === 'catalogues')).toBe(false);
  });

  it('retire avec motif, journalise et prévient le fournisseur', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(admin),
      catalogues: (q) => {
        if (q.op === 'select') return { data: catalogueRow('published') };
        if (q.op === 'update') return { data: { ...catalogueRow('removed'), ...q.payload } };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).patch(`/api/admin/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t'])
      .send({ status: 'removed', reason: 'Document vide, illisible ou corrompu' });
    expect(res.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'catalogues' && q.op === 'update');
    expect(update?.payload).toMatchObject({ status: 'removed', removal_reason: 'Document vide, illisible ou corrompu' });
    expect(update?.payload.removed_at).toBeTruthy();
    expect(logAdminAction).toHaveBeenCalledWith(expect.anything(), 'catalogue_status_change', expect.objectContaining({ catalogueId: CATALOGUE_ID, to: 'removed' }));
    expect(sendNotificationEmail).toHaveBeenCalledWith('karim@example.com', expect.objectContaining({ ctaPath: '/dashboard?tab=catalogues' }));
  });

  it('remet en ligne en effaçant le motif, sans e-mail', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(admin),
      catalogues: (q) => {
        if (q.op === 'select') return { data: catalogueRow('removed') };
        if (q.op === 'update') return { data: { ...catalogueRow('published'), ...q.payload } };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).patch(`/api/admin/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']).send({ status: 'published' });
    expect(res.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'catalogues' && q.op === 'update');
    expect(update?.payload).toEqual({ status: 'published', removal_reason: null, removed_at: null });
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('journalise la suppression définitive par un admin', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(admin),
      catalogues: (q) => (q.op === 'select' ? { data: { id: CATALOGUE_ID, company_id: COMPANY_ID, pdf_url: 'https://x/a.pdf' } } : undefined),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).delete(`/api/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']);
    expect(res.status).toBe(204);
    expect(logAdminAction).toHaveBeenCalledWith(expect.anything(), 'catalogue_delete', expect.objectContaining({ catalogueId: CATALOGUE_ID }));
  });
});
