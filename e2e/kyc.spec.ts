import { test, expect } from '@playwright/test';
import { mockApi, SUPPLIER } from './helpers';

test('Dépôt du dossier KYC : quatre documents puis envoi', async ({ page }) => {
  let uploads = 0;
  const api = await mockApi(page, { ...SUPPLIER, kycStatus: 'none' }, {
    'POST /api/upload': (call) => {
      uploads++;
      // Bucket privé par défaut : le serveur renvoie un chemin, jamais une URL publique.
      expect(call.search).toBe('');
      return { body: { url: `${SUPPLIER.id}/doc-${uploads}.pdf`, path: `${SUPPLIER.id}/doc-${uploads}.pdf`, private: true } };
    },
    'POST /api/kyc/submit': () => ({ body: { success: true } }),
  });

  await page.goto('/kyc-upload');
  await page.locator('input[type="text"]').first().fill('Fabrication de pompes industrielles');

  const pdf = { name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') };
  const inputs = page.locator('input[type="file"]');
  await expect(inputs).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await inputs.nth(i).setInputFiles(pdf);
    await expect.poll(() => uploads).toBe(i + 1);
  }

  await page.getByRole('button', { name: /soumettre|envoyer|dossier/i }).click();
  await expect(page.getByText('Demande Envoyée')).toBeVisible();

  const submit = api.find('POST', '/api/kyc/submit');
  expect(submit?.body.activity).toBe('Fabrication de pompes industrielles');
  expect(submit?.body.files.map((f: any) => f.type)).toEqual(['RC', 'NIF', 'NIS', 'RIB']);
  expect(submit?.body.files.every((f: any) => f.url.startsWith(`${SUPPLIER.id}/`))).toBe(true);
});
