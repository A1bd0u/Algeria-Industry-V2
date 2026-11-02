import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

test('Analytique : visite anonyme sans consentement (ni visiteur ni compte rattaché)', async ({ page }) => {
  const api = await mockApi(page, null);
  await page.goto('/');
  await page.goto('/faq');
  // Les événements partent au changement de visibilité de l'onglet.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => api.calls.filter((c) => c.path === '/api/analytics/collect').length, { timeout: 15000 }).toBeGreaterThan(0);

  const batch = api.calls.find((c) => c.path === '/api/analytics/collect')!.body;
  expect(batch.consent).toBe(false);
  expect(batch.visitorId).toBeNull();
  expect(batch.events.some((e: any) => e.type === 'pageview')).toBe(true);
  const stored = await page.evaluate(() => [localStorage.getItem('icx-vid'), sessionStorage.getItem('icx-sid')]);
  expect(stored).toEqual([null, null]);
});

test('Console admin : parcours visiteurs et journal d\'activité', async ({ page }) => {
  const admin = { id: '99999999-9999-4999-8999-999999999999', name: 'Admin', email: 'admin@icomexpo.dz', role: 'admin', emailVerified: true };
  await mockApi(page, admin, {
    '/api/admin/insights/overview': () => ({
      body: {
        days: 7,
        truncated: false,
        totals: { events: 12, pageviews: 5, sessions: 2, visitors: 1, users: 1, consentRate: 50, avgSessionSeconds: 95, pagesPerSession: 2.5, bounceRate: 50, errors: 0 },
        daily: [{ day: '2026-11-01', pageviews: 5, sessions: 2, clicks: 3 }],
        hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, value: hour === 10 ? 5 : 0 })),
        pages: [{ name: '/companies', value: 3 }],
        entries: [], exits: [], flows: [{ name: '/ → /companies', value: 2 }], timeOnPage: [], scrollDepth: [],
        clicks: [{ name: 'Contacter · /companies', value: 2 }], searches: [], outbound: [], errors: [], referrers: [],
        browsers: [{ name: 'Chrome', value: 2 }], browserVersions: [], os: [], devices: [], screens: [], languages: [], countries: [],
      },
    }),
    '/api/admin/insights/activity': () => ({
      body: {
        data: [{ id: 1, created_at: new Date().toISOString(), level: 'warn', category: 'auth', action: 'Connexion', status: 401, duration_ms: 42, details: { code: 'AUTH_INVALID' }, method: 'POST', path: '/api/auth/login' }],
        total: 1, page: 1, limit: 100,
      },
    }),
    '/api/admin/pending-counts': () => ({ body: {} }),
  });

  await page.goto('/extranet');
  await page.getByRole('button', { name: 'Parcours visiteurs' }).first().click();
  await expect(page.getByText('/ → /companies')).toBeVisible();
  await expect(page.getByText('Contacter · /companies')).toBeVisible();

  await page.getByRole('button', { name: "Journal d'activité" }).first().click();
  await expect(page.getByText('AUTH_INVALID')).toBeVisible();
  await expect(page.getByText('HTTP 401')).toBeVisible();
});
