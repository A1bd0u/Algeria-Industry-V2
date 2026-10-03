import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

test('Catalogue PDF : dépôt du fichier puis publication', async ({ page }) => {
  const list: any[] = [];
  const PDF_URL = `https://cdn.test/storage/v1/object/public/product-images/${SUPPLIER.id}/catalogue.pdf`;
  const api = await mockApi(page, SUPPLIER, {
    'GET /api/catalogues/mine': () => ({ body: { data: list, limit: 5, used: list.length, plan: 'basic' } }),
    'POST /api/upload': (call) => {
      expect(call.search).toBe('?bucket=product-images');
      return { body: { url: PDF_URL, path: `${SUPPLIER.id}/catalogue.pdf` } };
    },
    'POST /api/catalogues': (call) => {
      const created = { id: 'c1', status: 'published', created_at: new Date().toISOString(), ...call.body };
      list.push(created);
      return { status: 201, body: created };
    },
  });

  await page.goto('/dashboard?tab=catalogues');
  await expect(page.getByText('0 / 5 catalogue(s)')).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({ name: 'catalogue-pompes-2026.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
  // Le titre est proposé à partir du nom du fichier.
  await expect(page.getByLabel('Titre')).toHaveValue('catalogue pompes 2026');
  await page.getByLabel('Titre').fill('Catalogue pompes 2026');
  await page.getByRole('button', { name: 'Publier le catalogue' }).click();

  await expect(page.getByText('Catalogue publié.')).toBeVisible();
  await expect(page.getByText('1 / 5 catalogue(s)')).toBeVisible();
  expect(api.find('POST', '/api/catalogues')?.body).toMatchObject({ title: 'Catalogue pompes 2026', pdf_url: PDF_URL });
});
