import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

test('Souscription : CGV obligatoires, puis facture émise', async ({ page }) => {
  const api = await mockApi(page, SUPPLIER, {
    'GET /api/subscriptions/me': () => ({ body: {
      plan: 'free', planEndsAt: null, limits: { products: 5 }, usage: { products: 2 }, canSubscribe: true,
      subscriptions: [], prices: { basic: 18000, pro: 29900 }, payment: { online: false, rib: '00799999000123456789', beneficiary: 'Industigo SARL' },
    } }),
    'POST /api/subscriptions': (call) => ({ status: 201, body: { id: 'sub-1', invoice_number: 'FA-2026-00001', plan: call.body.plan, amount_dzd: 18000, status: 'pending' } }),
  });

  await page.goto('/dashboard?tab=subscription');
  const choose = page.getByRole('button', { name: /Choisir Basic/i });
  await expect(choose).toBeDisabled();

  await page.getByRole('checkbox').check();
  await expect(page.getByRole('link', { name: 'conditions générales de vente' })).toHaveAttribute('href', '/cgv');
  await expect(choose).toBeEnabled();
  await choose.click();

  await expect(page.getByText(/FA-2026-00001/)).toBeVisible();
  expect(api.find('POST', '/api/subscriptions')?.body).toEqual({ plan: 'basic', acceptTerms: true });
});
