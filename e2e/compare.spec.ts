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
