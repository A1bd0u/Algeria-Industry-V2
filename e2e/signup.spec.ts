import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('Inscription et redirection vers vérification email', async ({ page }) => {
    // Intercepter la requête d'inscription pour éviter de taper dans la vraie base de données
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '123',
            email: 'john.doe@acme.corp',
            role: 'fournisseur',
            isVerified: false
          }
        }),
      });
    });

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

    // Le widget Turnstile devrait se valider automatiquement avec la clé de test
    // On clique sur le bouton de soumission
    await page.click('button[type="submit"]');

    // Attendre la redirection vers la page de succès/vérification
    await page.waitForURL('**/register-success');
    
    // Vérifier qu'on est sur la bonne page
    await expect(page.locator('text=Inscription réussie')).toBeVisible();
  });
});
