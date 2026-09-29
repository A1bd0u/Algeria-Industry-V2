import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('Inscription, vérification du code e-mail puis onboarding', async ({ page }) => {
    // Réponse neutre du serveur : aucune session avant vérification du code.
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, pendingVerification: true, message: 'Code envoyé' }),
      });
    });

    await page.route('**/api/auth/verify-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'John Doe',
            email: 'john.doe@acme.corp',
            role: 'fournisseur',
            emailVerified: true,
            kycStatus: 'none',
            isVerified: false
          }
        }),
      });
    });

    // Stub du widget Turnstile : le test ne dépend pas du réseau Cloudflare.
    await page.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
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

    // Choix de consentement déjà enregistré : le bandeau cookies ne masque pas la page.
    await page.addInitScript(() => localStorage.setItem('ai_cookie_consent_v1', 'rejected'));

    await page.goto('/register');

    // Étape 1 : Choisir le rôle
    await page.click('text=Je suis un Fournisseur');
    await page.click('text=Continuer');

    // Étape 2 : Remplir le formulaire
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="companyName"]', 'Acme Corp');
    await page.fill('input[name="email"]', 'john.doe@acme.corp');
    await page.fill('input[name="password"]', 'StrongPass123!');

    // Le widget Turnstile se valide automatiquement avec la clé de test
    await page.click('button[type="submit"]');

    await page.waitForURL('**/register-success');
    await expect(page.getByRole('heading', { name: 'Vérifiez votre adresse e-mail' })).toBeVisible();
    await expect(page.locator('#verify_email')).toHaveValue('john.doe@acme.corp');

    await page.fill('#verify_code', '123456');
    await page.click('text=Confirmer mon adresse');

    // Onboarding fournisseur en 3 étapes
    await expect(page.getByText('Entreprise et KYC')).toBeVisible();
    await expect(page.getByText('1/3')).toBeVisible();
  });
});
