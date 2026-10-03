import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabase } from '../server/db/supabaseClient';
import { sendNotificationEmail } from '../server/services/emailService';
import { missingProfileFields, sendOnboardingReminders } from '../server/services/onboardingReminders';
import { createSupabaseMock, filterValue, Handler } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/services/emailService', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

const NOW = new Date('2026-10-20T08:00:00Z');
const owner = (id: string) => ({ id, email: `${id}@example.com`, name: id, role: 'fournisseur' });
const fullCompany = {
  logo_url: 'https://x/logo.png', description: 'x'.repeat(100), whatsapp: '213555000000', wilaya: 'Sétif', gallery: ['https://x/1.png'],
};

const setup = (handlers: Record<string, Handler>) => {
  const mock = createSupabaseMock({ onboarding_reminders: () => ({ data: [] }), ...handlers });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Relances d\'accompagnement', () => {
  beforeEach(() => vi.mocked(sendNotificationEmail).mockClear());

  it('relance une fois un fournisseur inscrit sans dossier KYC', async () => {
    const mock = setup({
      users: () => ({ data: [{ id: 'u1', email: 'u1@example.com', name: 'Karim' }] }),
      companies: () => ({ data: [] }),
    });
    const counts = await sendOnboardingReminders(NOW);
    expect(counts.kyc).toBe(1);
    expect(sendNotificationEmail).toHaveBeenCalledWith('u1@example.com', expect.objectContaining({ ctaPath: '/kyc-upload' }));

    const users = mock.queries.find((q) => q.table === 'users')!;
    expect(filterValue(users, 'eq', 'kyc_status')?.[1]).toBe('none');
    expect(filterValue(users, 'eq', 'email_verified')?.[1]).toBe(true);
    // Fenêtre : inscrit il y a entre 2 et 30 jours.
    expect(filterValue(users, 'lte', 'created_at')?.[1]).toBe('2026-10-18T08:00:00.000Z');
    expect(filterValue(users, 'gte', 'created_at')?.[1]).toBe('2026-09-20T08:00:00.000Z');
    const insert = mock.queries.find((q) => q.table === 'onboarding_reminders' && q.op === 'insert');
    expect(insert?.payload[0]).toEqual({ user_id: 'u1', kind: 'kyc' });
  });

  it('ne renvoie jamais une relance déjà envoyée', async () => {
    setup({
      users: () => ({ data: [{ id: 'u1', email: 'u1@example.com', name: 'Karim' }] }),
      companies: () => ({ data: [] }),
      onboarding_reminders: (q) => (q.op === 'insert' ? { error: { code: '23505' } } : { data: [] }),
    });
    const counts = await sendOnboardingReminders(NOW);
    expect(counts.kyc).toBe(0);
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('relance une entreprise validée sans produit, pas celle qui en a', async () => {
    setup({
      users: () => ({ data: [] }),
      companies: () => ({ data: [
        { id: 'c1', name: 'SARL Vide', owner: owner('o1'), ...fullCompany },
        { id: 'c2', name: 'SARL Pleine', owner: owner('o2'), ...fullCompany },
      ] }),
      products: () => ({ data: [{ owner_id: 'o2' }] }),
    });
    const counts = await sendOnboardingReminders(NOW);
    expect(counts.firstProduct).toBe(1);
    expect(sendNotificationEmail).toHaveBeenCalledWith('o1@example.com', expect.objectContaining({ ctaPath: '/dashboard?tab=products' }));
    expect(sendNotificationEmail).not.toHaveBeenCalledWith('o2@example.com', expect.anything());
  });

  it('liste ce qui manque à une fiche incomplète', async () => {
    setup({
      users: () => ({ data: [] }),
      companies: () => ({ data: [{ id: 'c1', name: 'SARL Hydro', owner: owner('o1'), ...fullCompany, logo_url: null, whatsapp: '' }] }),
      products: () => ({ data: [{ owner_id: 'o1' }] }),
    });
    const counts = await sendOnboardingReminders(NOW);
    expect(counts.profile).toBe(1);
    const mail = vi.mocked(sendNotificationEmail).mock.calls.find((c) => c[1].ctaPath === '/dashboard?tab=company');
    expect(mail?.[1].intro).toContain('le logo');
    expect(mail?.[1].intro).toContain('WhatsApp');
  });

  it('ignore les comptes non fournisseurs', async () => {
    setup({
      users: () => ({ data: [] }),
      companies: () => ({ data: [{ id: 'c1', name: 'X', owner: { ...owner('a1'), role: 'admin' }, logo_url: null }] }),
      products: () => ({ data: [] }),
    });
    const counts = await sendOnboardingReminders(NOW);
    expect(counts).toEqual({ kyc: 0, firstProduct: 0, profile: 0 });
  });

  it('détecte une fiche complète', () => {
    expect(missingProfileFields(fullCompany)).toEqual([]);
    expect(missingProfileFields({})).toHaveLength(5);
  });
});
