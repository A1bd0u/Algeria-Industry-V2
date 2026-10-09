import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

const PRO_RIGHTS = {
  plan: 'pro', feed: true, feedHourly: true, webhooks: true, apiKeys: true,
  scopes: ['products:read', 'products:write', 'messages:read'],
  events: ['message.received', 'quote_request.received', 'catalog.sync_completed'],
};

test('Intégrations : flux catalogue, webhook vers le CRM et clé d\'API', async ({ page }) => {
  const state: any = { rights: PRO_RIGHTS, feed: null, webhooks: [], apiKeys: [] };
  const api = await mockApi(page, SUPPLIER, {
    'GET /api/integrations': () => ({ body: state }),
    'PUT /api/integrations/feed': (call) => {
      state.feed = { id: 'f1', ...call.body, last_run_at: null, last_status: null, last_report: null, next_run_at: new Date().toISOString() };
      return { body: state.feed };
    },
    'POST /api/integrations/webhooks': (call) => {
      const hook = { id: 'w1', url: call.body.url, events: call.body.events, active: true, disabled_reason: null, last_delivery_at: null, last_status: null };
      state.webhooks.push(hook);
      return { status: 201, body: { ...hook, secret: 'whsec_demo123' } };
    },
    'POST /api/integrations/api-keys': (call) => {
      const k = { id: 'k1', name: call.body.name, prefix: 'ind_live_abc123', scopes: call.body.scopes, last_used_at: null, created_at: new Date().toISOString() };
      state.apiKeys.push(k);
      return { status: 201, body: { ...k, key: 'ind_live_abc123secret' } };
    },
  });

  await page.goto('/dashboard?tab=integrations');
  await expect(page.getByRole('heading', { name: 'Intégrations ERP et CRM' })).toBeVisible();

  // Flux catalogue : fichier exporté par l'ERP, relu chaque heure.
  await page.getByLabel('Adresse du fichier').fill('https://erp.hydrosud.dz/export/articles.csv');
  await page.getByLabel('Fréquence').selectOption('hourly');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Synchronisation enregistrée. Elle aura lieu au prochain passage.')).toBeVisible();
  expect(api.find('PUT', '/api/integrations/feed')?.body).toMatchObject({ url: 'https://erp.hydrosud.dz/export/articles.csv', frequency: 'hourly' });

  // Webhook : le secret n'est montré qu'une fois.
  await page.getByLabel('Adresse de réception').fill('https://crm.hydrosud.dz/hooks/industigo');
  await page.getByRole('button', { name: 'Ajouter le webhook' }).click();
  await expect(page.getByText('whsec_demo123')).toBeVisible();
  await expect(page.getByText('https://crm.hydrosud.dz/hooks/industigo')).toBeVisible();
  expect(api.find('POST', '/api/integrations/webhooks')?.body.events).toEqual(PRO_RIGHTS.events);

  // Clé d'API.
  await page.getByLabel('Nom de la clé').fill('ERP Sage');
  await page.getByRole('button', { name: 'Créer la clé' }).click();
  await expect(page.getByText('ind_live_abc123secret')).toBeVisible();
  await expect(page.getByText('ERP Sage')).toBeVisible();
});

test('Intégrations : offre gratuite, sections verrouillées', async ({ page }) => {
  await mockApi(page, SUPPLIER, {
    'GET /api/integrations': () => ({ body: { rights: { plan: 'free', feed: false, feedHourly: false, webhooks: false, apiKeys: false, scopes: [], events: [] }, feed: null, webhooks: [], apiKeys: [] } }),
  });
  await page.goto('/dashboard?tab=integrations');
  await expect(page.getByText('Incluse dans les offres Basic (chaque jour) et Pro (chaque heure), une fois l\'entreprise vérifiée.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voir les offres' })).toHaveCount(3);
  await expect(page.getByLabel('Adresse de réception')).toHaveCount(0);
});
