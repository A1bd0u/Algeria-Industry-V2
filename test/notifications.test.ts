import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSupabase } from '../server/db/supabaseClient';
import {
  alertAdminsKycSubmitted,
  notifyInvoiceIssued,
  notifyPaymentReceived,
} from '../server/services/notificationService';
import { createSupabaseMock } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

// Client Resend simulé : chaque e-mail parti est enregistré ici.
const sent: any[] = [];
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: async (mail: any) => { sent.push(mail); return { data: { id: 'x' }, error: null }; } };
  },
}));

describe('E-mails de facturation et alertes', () => {
  beforeEach(() => {
    sent.length = 0;
    process.env.RESEND_API_KEY = 're_test';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.ADMIN_ALERT_EMAILS;
  });

  it('envoie la facture au titulaire joint à l\'abonnement', async () => {
    vi.mocked(getSupabase).mockReturnValue(createSupabaseMock().client as any);
    await notifyInvoiceIssued({
      id: 's1', invoice_number: 'AI-2026-0007', plan: 'basic', amount_dzd: 18000,
      user: [{ email: 'owner@example.com', name: 'Owner' }],
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('owner@example.com');
    expect(sent[0].subject).toContain('AI-2026-0007');
    expect(sent[0].html).toContain('Owner');
    expect(sent[0].html).toContain('18');
  });

  it('relit l\'adresse en base quand l\'abonnement n\'a pas de jointure', async () => {
    const mock = createSupabaseMock({ users: () => ({ data: { email: 'db@example.com', name: 'Db' } }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    await notifyPaymentReceived({ id: 's1', invoice_number: 'AI-1', plan: 'pro', amount_dzd: 29900, user_id: 'u1', ends_at: '2027-10-01T00:00:00Z' });
    expect(sent[0].to).toBe('db@example.com');
  });

  it('ne fait jamais échouer l\'appelant', async () => {
    vi.mocked(getSupabase).mockImplementation(() => { throw new Error('base indisponible'); });
    await expect(notifyPaymentReceived({ id: 's1', plan: 'pro', amount_dzd: 1, user_id: 'u1' })).resolves.toBeUndefined();
  });

  it('prévient les adresses ADMIN_ALERT_EMAILS d\'un nouveau dossier KYC', async () => {
    process.env.ADMIN_ALERT_EMAILS = 'a@example.com, b@example.com';
    vi.mocked(getSupabase).mockReturnValue(createSupabaseMock().client as any);
    await alertAdminsKycSubmitted('Acme SARL', 'Karim');
    expect(sent.map((mail) => mail.to).sort()).toEqual(['a@example.com', 'b@example.com']);
    expect(sent[0].html).toContain('Acme SARL');
  });
});
