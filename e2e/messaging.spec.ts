import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

const SELLER = '33333333-3333-4333-8333-333333333333';

test('Messagerie : demande de devis pré-remplie envoyée au fournisseur', async ({ page }) => {
  const sent: any[] = [];
  const api = await mockApi(page, { ...SUPPLIER, role: 'acheteur', company_id: null }, {
    'GET /api/messages/conversations': () => ({ body: [{ id: SELLER, name: 'EURL Métal Est', lastMessage: '', unread: 0 }] }),
    [`GET /api/messages/${SELLER}`]: () => ({ body: sent }),
    'POST /api/messages': (call) => {
      sent.push({ id: `m${sent.length}`, sender_id: SUPPLIER.id, receiver_id: SELLER, text: call.body.text, created_at: new Date().toISOString() });
      return { status: 201, body: sent[sent.length - 1] };
    },
  });

  const text = 'Bonjour, je souhaite un devis pour la pompe PRD-001.';
  await page.goto(`/dashboard?tab=messages&to=${SELLER}&text=${encodeURIComponent(text)}`);
  const input = page.getByRole('textbox', { name: 'Écrivez votre message...' });
  await expect(input).toHaveValue(text);

  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByText(text)).toBeVisible();
  expect(api.find('POST', '/api/messages')?.body).toEqual({ text, receiver_id: SELLER });
});

// Widget Turnstile simulé : le test ne dépend pas du réseau Cloudflare.
const stubTurnstile = async (page: any) => {
  await page.route('https://challenges.cloudflare.com/turnstile/**', async (route: any) => {
    const onload = new URL(route.request().url()).searchParams.get('onload');
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render: function (el, opts) { setTimeout(function () { opts.callback && opts.callback('e2e-token'); }, 50); return 'w1'; },
          reset: function () {}, remove: function () {}, execute: function () {},
          getResponse: function () { return 'e2e-token'; }, isExpired: function () { return false; },
          ready: function (cb) { cb(); }
        };
        ${onload ? `window['${onload}'] && window['${onload}']();` : ''}
      `,
    });
  });
};

test('Messagerie : un visiteur doit créer un compte, puis retrouve la conversation', async ({ page }) => {
  await stubTurnstile(page);
  const buyer = { id: '55555555-5555-4555-8555-555555555555', name: 'Amine Haddad', email: 'amine@usine.dz', role: 'acheteur', emailVerified: true, kycStatus: 'none' };
  const api = await mockApi(page, null, {
    'POST /api/auth/register': () => ({ body: { success: true, pendingVerification: true } }),
    'POST /api/auth/verify-code': () => ({ body: { success: true, user: buyer } }),
    [`GET /api/messages/contact/${SELLER}`]: () => ({ body: { id: SELLER, name: 'EURL Métal Est' } }),
    'GET /api/messages/conversations': () => ({ body: [] }),
    [`GET /api/messages/${SELLER}`]: () => ({ body: [] }),
  });

  // Bouton « Contacter » d'une fiche : la messagerie demande une connexion.
  await page.goto(`/dashboard?tab=messages&to=${SELLER}`);
  await page.waitForURL('**/login?redirect=**');
  await expect(page.getByText('Un compte est nécessaire pour écrire à un fournisseur')).toBeVisible();

  // Le lien d'inscription garde la destination et présélectionne « acheteur ».
  await page.getByRole('link', { name: 'Créer un compte acheteur gratuit' }).click();
  await page.waitForURL('**/register?role=acheteur&redirect=**');
  await page.fill('input[name="lastName"]', 'Haddad');
  await page.fill('input[name="firstName"]', 'Amine');
  await page.fill('input[name="companyName"]', 'Usine Haddad');
  await page.fill('input[name="email"]', 'amine@usine.dz');
  await page.fill('input[name="password"]', 'StrongPass123!');
  await page.click('button[type="submit"]');

  // Code reçu par e-mail, puis retour direct à la conversation avec le fournisseur.
  await page.waitForURL('**/register-success');
  expect(api.find('POST', '/api/auth/register')?.body.role).toBe('acheteur');
  await page.fill('#verify_code', '123456');
  await page.click('text=Confirmer mon adresse');
  await page.waitForURL(`**/dashboard?tab=messages&to=${SELLER}`);
  await expect(page.getByRole('heading', { name: 'EURL Métal Est' })).toBeVisible();
  await expect(page.getByText('Écrivez votre premier message à EURL Métal Est.')).toBeVisible();
  expect(api.find('GET', `/api/messages/contact/${SELLER}`)).toBeTruthy();
});

test('Messagerie : envoi bloqué tant que l\'adresse e-mail n\'est pas confirmée', async ({ page }) => {
  await mockApi(page, { ...SUPPLIER, role: 'acheteur', company_id: null, emailVerified: false }, {
    'GET /api/messages/conversations': () => ({ body: [{ id: SELLER, name: 'EURL Métal Est', lastMessage: { text: 'Bonjour', time: '10:00' }, unread: 1 }] }),
    [`GET /api/messages/${SELLER}`]: () => ({ body: [] }),
  });
  await page.goto(`/dashboard?tab=messages&to=${SELLER}`);
  await expect(page.getByText('Confirmez votre adresse e-mail pour pouvoir envoyer des messages.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Écrivez votre message...' })).toBeDisabled();
});
