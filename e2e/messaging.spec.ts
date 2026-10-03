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
