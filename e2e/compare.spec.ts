import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

const PRODUCT = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Pompe centrifuge PRD-001',
  category: 'Hydraulique & pneumatique',
  price: 120000,
  priceValue: 120000,
  images: [],
  features: ['Débit 50 m³/h', 'Corps en fonte'],
  specs: { Région: 'Alger' },
  companyName: 'SARL Hydro Sud',
  companyId: '22222222-2222-4222-8222-222222222222',
  companyVerified: true,
  sellerId: null,
};

const slug = `pompe-centrifuge-prd-001--${Buffer.from(PRODUCT.id).toString('base64').replace(/=/g, '')}`;

test('Comparateur : la sélection survit au rechargement et à l\'accès direct', async ({ page }) => {
  await mockApi(page, null, {
    [`GET /api/products/${PRODUCT.id}`]: () => ({ body: { product: PRODUCT, similar: [] } }),
  });

  await page.goto(`/products/${slug}`);
  await page.getByRole('button', { name: 'Comparer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Comparé' })).toBeVisible();

  // Accès direct (nouvel onglet, lien partagé, rechargement) : la liste est toujours là.
  await page.goto('/compare');
  await expect(page.getByRole('heading', { name: 'Comparaison technique' })).toBeVisible();
  await expect(page.getByRole('link', { name: PRODUCT.name })).toBeVisible();
  await expect(page.getByText('Corps en fonte')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: PRODUCT.name })).toBeVisible();

  await page.getByRole('button', { name: 'Vider la liste' }).click();
  await expect(page.getByText('Comparaison vide')).toBeVisible();
});

test('Comparer avec : catalogue du secteur, ajout depuis une carte, fermeture de la barre', async ({ page }) => {
  const OTHER = {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Vérin hydraulique Ø80',
    category: 'Hydraulique & pneumatique',
    price: 45000,
    images: [],
    company_name: 'Mécanova Rouiba',
    created_at: '2026-01-01T00:00:00Z',
  };
  const api = await mockApi(page, null, {
    [`GET /api/products/${PRODUCT.id}`]: () => ({ body: { product: PRODUCT, similar: [] } }),
    'GET /api/products': () => ({ body: { data: [OTHER], total: 1, page: 1, totalPages: 1 } }),
  });

  await page.goto(`/products/${slug}`);
  await page.getByRole('button', { name: 'Comparer avec un autre produit' }).click();

  // Catalogue du secteur du produit, le produit est déjà dans la sélection.
  await expect(page).toHaveURL(/\/products\?category=M%C3%A9canique/);
  await expect.poll(() => api.calls.some((c) => c.path === '/api/products' && c.search.includes('category='))).toBe(true);

  // Ajout du second produit depuis sa carte.
  const card = page.locator('article', { hasText: OTHER.name });
  await card.getByRole('button', { name: 'Comparer' }).click();
  await expect(card.getByRole('button', { name: 'Comparé' })).toBeVisible();

  // La barre montre 2 produits et se ferme sans vider la sélection.
  // Panneau déplié : sa croix reste à l'écran et le ferme.
  await page.getByRole('button', { name: /Comparer/ }).filter({ has: page.locator('img') }).first().click();
  const panel = page.getByRole('dialog', { name: 'Comparaison technique' });
  await expect(panel).toBeInViewport();
  const close = panel.getByRole('button', { name: 'Fermer le comparateur' });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(panel).toBeHidden();
  await expect(close).toBeHidden();

  await page.goto('/compare');
  await expect(page.getByRole('link', { name: PRODUCT.name })).toBeVisible();
  await expect(page.getByRole('link', { name: OTHER.name })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ajouter un produit' })).toBeVisible();

  // La croix quitte la comparaison sans vider la sélection.
  await page.getByRole('button', { name: 'Fermer la comparaison' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goto('/compare');
  await expect(page.getByRole('link', { name: OTHER.name })).toBeVisible();
});
