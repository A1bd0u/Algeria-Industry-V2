import { test, expect } from '@playwright/test';

test.describe('Vendor Product Creation', () => {
  test('Création d\'un produit par un fournisseur', async ({ page, context }) => {
    // Intercepter l'appel "/api/auth/me" pour simuler un utilisateur connecté en tant que fournisseur
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'vendor123',
            name: 'Fournisseur Test',
            email: 'fournisseur@test.com',
            role: 'fournisseur',
            isVerified: true,
            emailVerified: true,
            kycStatus: 'approved',
            companyStatus: 'approved'
          }
        }),
      });
    });

    // Envoi de photo : le stockage renvoie l'URL publique du fichier déposé.
    const PHOTO_URL = 'http://localhost:3000/placeholder.svg?e2e=photo';
    await page.route('**/api/upload**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: PHOTO_URL }) });
    });

    // Intercepter la requête de création de produit
    let createdPayload: any = null;
    await page.route('**/api/products', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'prod123',
            name: 'Nouveau Produit B2B',
            category: 'Standard',
            price: 500,
            status: 'Actif'
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Injecter un token bidon pour que le frontend croit qu'on est connecté
    await context.addCookies([
      { name: 'token', value: 'fake-jwt-token', domain: 'localhost', path: '/' }
    ]);

    // Choix de consentement déjà enregistré : le bandeau cookies ne masque pas la page.
    await page.addInitScript(() => localStorage.setItem('ai_cookie_consent_v1', 'rejected'));

    // Aller sur le tableau de bord fournisseur - onglet produits
    await page.goto('/dashboard?tab=products');

    // Cliquer sur le bouton "Ajouter"
    await page.click('text=Ajouter');

    // Remplir le formulaire
    await page.fill('input[name="name"]', 'Nouveau Produit B2B');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="price"]', '500');
    await page.fill('textarea[name="description"]', 'Description de mon super produit B2B pour le test e2e.');
    
    // Sans photo, le formulaire refuse l'envoi.
    await page.click('button:has-text("Ajouter au catalogue")');
    await expect(page.getByRole('alert')).toContainText('photo');
    expect(createdPayload).toBeNull();

    // Ajouter une photo (PNG 1 × 1), mise au carré puis déposée.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('input[type="file"]', { name: 'pompe.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByText('Principale')).toBeVisible();

    // Soumettre le formulaire
    await page.click('button:has-text("Ajouter au catalogue")');

    // Vérifier le succès : on doit voir le produit dans la liste ou un message de succès
    // Le dashboard devrait rafraichir ou afficher une notification.
    // Par exemple, on peut vérifier que le texte "Nouveau Produit B2B" apparait dans la page
    // Ou si la modale se ferme
    await expect(page.locator('text=Nouveau Produit B2B').first()).toBeVisible();
    expect(createdPayload).toMatchObject({ name: 'Nouveau Produit B2B', images: [PHOTO_URL], file_url: PHOTO_URL });
  });
});
