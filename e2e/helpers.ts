import type { Page, Route } from '@playwright/test';

// Scénarios e2e sans base de données : l'API est simulée route par route et
// chaque requête envoyée par l'interface est enregistrée pour être vérifiée.

export type ApiCall = { method: string; path: string; search: string; body: any };
type Reply = { status?: number; body?: any } | undefined;
export type ApiHandler = (call: ApiCall) => Reply | Promise<Reply>;

export const SUPPLIER = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Karim Benali',
  email: 'karim@hydrosud.dz',
  role: 'fournisseur',
  company: 'SARL Hydro Sud',
  company_id: '22222222-2222-4222-8222-222222222222',
  emailVerified: true,
  kycStatus: 'approved',
};

export async function mockApi(page: Page, user: Record<string, any> | null, handlers: Record<string, ApiHandler> = {}) {
  const calls: ApiCall[] = [];
  // Bandeau cookies déjà réglé : il ne masque pas les boutons.
  await page.addInitScript(() => localStorage.setItem('ai_cookie_consent_v1', 'rejected'));
  await page.context().addCookies([{ name: 'token', value: 'e2e-token', domain: 'localhost', path: '/' }]);

  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body: any = null;
    try { body = request.postDataJSON(); } catch { body = request.postData(); }
    const call: ApiCall = { method: request.method(), path: url.pathname, search: url.search, body };
    calls.push(call);

    // Gestionnaire le plus précis d'abord : « POST /api/catalogues » avant « /api/catalogues ».
    const key = Object.keys(handlers)
      .filter((k) => {
        const [method, path] = k.includes(' ') ? k.split(' ') : [null, k];
        return (!method || method === call.method) && (call.path === path || call.path.startsWith(`${path}/`));
      })
      .sort((a, b) => b.length - a.length)[0];
    const reply = key ? await handlers[key](call) : undefined;
    if (reply) {
      return route.fulfill({ status: reply.status || 200, contentType: 'application/json', body: JSON.stringify(reply.body ?? {}) });
    }
    if (call.path === '/api/auth/me') {
      return route.fulfill({ status: user ? 200 : 401, contentType: 'application/json', body: JSON.stringify(user ? { user } : { error: 'x' }) });
    }
    // Par défaut : liste vide, sans erreur.
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  return {
    calls,
    find: (method: string, path: string) => calls.find((c) => c.method === method && c.path === path),
  };
}
