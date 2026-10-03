import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

test('Import CSV : aperçu ligne par ligne, seules les lignes valides sont envoyées', async ({ page }) => {
  const api = await mockApi(page, SUPPLIER, {
    'GET /api/products/my': () => ({ body: [] }),
    'POST /api/products/import': (call) => ({ status: 201, body: { created: call.body.rows.length } }),
  });

  await page.goto('/dashboard?tab=products');
  await page.getByRole('button', { name: 'Importer' }).click();

  const csv = 'nom;categorie;prix;description\r\nPompe centrifuge inox;B2;185 000;Inox 316L\r\nVanne papillon;Z9;abc;\r\n';
  await page.getByLabel('Choisir un fichier').setInputFiles({ name: 'produits.csv', mimeType: 'text/csv', buffer: Buffer.from('﻿' + csv) });

  await expect(page.getByText('1 ligne(s) prête(s), 1 à corriger')).toBeVisible();
  await expect(page.getByText('catégorie inconnue · prix invalide')).toBeVisible();

  await page.getByRole('button', { name: 'Importer 1 produit(s)' }).click();
  await expect(page.getByText(/1 produit\(s\) importé\(s\) en brouillon/)).toBeVisible();

  const rows = api.find('POST', '/api/products/import')?.body.rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ line: 2, name: 'Pompe centrifuge inox', price: 185000 });
});
