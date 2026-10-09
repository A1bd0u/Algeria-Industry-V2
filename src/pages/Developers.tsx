import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { cn } from '../lib/utils';

// Documentation des intégrations : flux catalogue, webhooks et API v1.
// Les exemples de code restent identiques dans toutes les langues.

const Code = ({ children }: { children: string }) => (
  <pre dir="ltr" className="overflow-x-auto rounded-xl bg-[#1a1a1a] text-gray-100 p-4 text-xs leading-relaxed"><code>{children}</code></pre>
);

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/me', scope: '—', key: 'me' },
  { method: 'GET', path: '/api/v1/products', scope: 'products:read', key: 'list' },
  { method: 'GET', path: '/api/v1/products/{reference}', scope: 'products:read', key: 'get' },
  { method: 'PUT', path: '/api/v1/products/{reference}', scope: 'products:write', key: 'put' },
  { method: 'POST', path: '/api/v1/products/batch', scope: 'products:write', key: 'batch' },
  { method: 'DELETE', path: '/api/v1/products/{reference}', scope: 'products:write', key: 'delete' },
  { method: 'GET', path: '/api/v1/messages', scope: 'messages:read', key: 'messages' },
] as const;

const EVENTS = ['quote_request.received', 'message.received', 'catalog.sync_completed'] as const;

const SECTIONS = ['start', 'feed', 'webhooks', 'api', 'tools'] as const;

export default function Developers() {
  const { t, i18n } = useTranslation();
  const base = absoluteUrl('').replace(/\/$/, '');

  return (
    <>
      <SEO title={t('developers.seoTitle')} description={t('developers.seoDescription')} url={absoluteUrl('/developers')} />
      <div className={cn('bg-neutral-bg min-h-screen py-12', i18n.language?.startsWith('ar') && 'font-arabic')}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-3">{t('developers.title')}</h1>
          <p className="text-gray-600 max-w-2xl mb-6">{t('developers.intro')}</p>
          <nav aria-label={t('developers.toc')} className="flex flex-wrap gap-2 mb-10">
            {SECTIONS.map((s) => (
              <a key={s} href={`#${s}`} className="rounded-full bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-secondary hover:text-secondary">{t(`developers.${s}.title`)}</a>
            ))}
          </nav>

          <div className="space-y-12 text-gray-700 leading-relaxed">
            <section id="start" className="space-y-3">
              <h2 className="text-2xl font-bold text-primary">{t('developers.start.title')}</h2>
              <ol className="list-decimal ps-5 space-y-1.5">
                <li>{t('developers.start.step1')}</li>
                <li>{t('developers.start.step2')}</li>
                <li>{t('developers.start.step3')}</li>
              </ol>
              <p className="text-sm">{t('developers.start.plans')} <Link to="/tarifs" className="text-secondary font-semibold hover:underline">{t('developers.start.seePlans')}</Link></p>
              <Link to="/dashboard?tab=integrations" className="btn-primary w-fit">{t('developers.start.cta')}</Link>
            </section>

            <section id="feed" className="space-y-3">
              <h2 className="text-2xl font-bold text-primary">{t('developers.feed.title')}</h2>
              <p>{t('developers.feed.text')}</p>
              <ul className="list-disc ps-5 space-y-1">
                <li>{t('developers.feed.columns')}</li>
                <li>{t('developers.feed.matching')}</li>
                <li>{t('developers.feed.newProducts')}</li>
                <li>{t('developers.feed.missing')}</li>
                <li>{t('developers.feed.limits')}</li>
              </ul>
              <Code>{`reference;nom;categorie;prix;description
POMP-15KW;Pompe centrifuge inox 15 kW;B2;185000;Corps inox 316L, débit 60 m3/h
GANT-NIT-100;Gants nitrile (carton de 100);E3;;Prix sur devis`}</Code>
            </section>

            <section id="webhooks" className="space-y-3">
              <h2 className="text-2xl font-bold text-primary">{t('developers.webhooks.title')}</h2>
              <p>{t('developers.webhooks.text')}</p>
              <ul className="space-y-1.5">
                {EVENTS.map((e) => (
                  <li key={e}><code dir="ltr" className="font-mono text-sm text-primary">{e}</code> · {t(`integrations.events.${e.replace('.', '_')}`)}</li>
                ))}
              </ul>
              <p>{t('developers.webhooks.payload')}</p>
              <Code>{`POST https://votre-crm.example/hooks/industigo
Content-Type: application/json
X-Industigo-Event: quote_request.received
X-Industigo-Delivery: 6f1c…
X-Industigo-Signature: t=1760000000,v1=5d2a…

{
  "id": "6f1c…",
  "event": "quote_request.received",
  "created_at": "2026-10-09T10:15:00.000Z",
  "data": {
    "message_id": "…",
    "text": "Demande de devis de SARL Exemple pour : …",
    "note": "500 unités, livraison à Sétif",
    "sender": { "id": "…", "name": "Karim B.", "company": "SARL Exemple", "email": "achat@exemple.dz" },
    "products": [{ "id": "…", "name": "Pompe centrifuge inox 15 kW", "reference": "POMP-15KW", "platform_reference": "PRD-…" }],
    "reply_url": "${base}/dashboard?tab=messages&to=…"
  }
}`}</Code>
              <p>{t('developers.webhooks.consent')}</p>
              <h3 className="text-lg font-bold text-primary pt-2">{t('developers.webhooks.verifyTitle')}</h3>
              <p>{t('developers.webhooks.verifyText')}</p>
              <Code>{`// Node.js (Express) : corps brut nécessaire pour vérifier la signature.
const crypto = require('crypto');

app.post('/hooks/industigo', express.raw({ type: 'application/json' }), (req, res) => {
  const header = req.get('X-Industigo-Signature') || '';
  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const expected = crypto.createHmac('sha256', process.env.INDUSTIGO_WEBHOOK_SECRET)
    .update(t + '.' + req.body).digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;
  if (!fresh || !v1 || !crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))) {
    return res.status(400).end();
  }
  const event = JSON.parse(req.body);
  // … créer la piste dans le CRM, puis répondre vite :
  res.status(200).end();
});`}</Code>
              <Code>{`<?php // PHP
$body = file_get_contents('php://input');
parse_str(str_replace(',', '&', $_SERVER['HTTP_X_INDUSTIGO_SIGNATURE'] ?? ''), $sig);
$expected = hash_hmac('sha256', $sig['t'] . '.' . $body, getenv('INDUSTIGO_WEBHOOK_SECRET'));
if (abs(time() - (int) $sig['t']) > 300 || !hash_equals($expected, $sig['v1'] ?? '')) {
  http_response_code(400); exit;
}
$event = json_decode($body, true);`}</Code>
              <p>{t('developers.webhooks.retries')}</p>
            </section>

            <section id="api" className="space-y-3">
              <h2 className="text-2xl font-bold text-primary">{t('developers.api.title')}</h2>
              <p>{t('developers.api.text')}</p>
              <Code>{`curl ${base}/api/v1/products?updated_since=2026-10-01T00:00:00Z \\
  -H "Authorization: Bearer ind_live_…"`}</Code>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-bg text-start">
                    <tr>
                      <th className="p-3 text-start font-semibold">{t('developers.api.endpoint')}</th>
                      <th className="p-3 text-start font-semibold">{t('developers.api.scope')}</th>
                      <th className="p-3 text-start font-semibold">{t('developers.api.description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENDPOINTS.map((e) => (
                      <tr key={`${e.method} ${e.path}`} className="border-t border-gray-100 align-top">
                        <td className="p-3 font-mono text-xs whitespace-nowrap" dir="ltr"><span className="font-bold text-secondary">{e.method}</span> {e.path}</td>
                        <td className="p-3 font-mono text-xs whitespace-nowrap" dir="ltr">{e.scope}</td>
                        <td className="p-3">{t(`developers.api.endpoints.${e.key}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="text-lg font-bold text-primary pt-2">{t('developers.api.upsertTitle')}</h3>
              <Code>{`curl -X PUT ${base}/api/v1/products/POMP-15KW \\
  -H "Authorization: Bearer ind_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Pompe centrifuge inox 15 kW", "category": "B2", "price": 185000,
        "description": "Corps inox 316L, débit 60 m3/h" }'`}</Code>
              <ul className="list-disc ps-5 space-y-1">
                <li>{t('developers.api.fields')}</li>
                <li>{t('developers.api.photo')}</li>
                <li>{t('developers.api.batch')}</li>
                <li>{t('developers.api.errors')}</li>
                <li>{t('developers.api.limits')}</li>
              </ul>
            </section>

            <section id="tools" className="space-y-3">
              <h2 className="text-2xl font-bold text-primary">{t('developers.tools.title')}</h2>
              <ul className="list-disc ps-5 space-y-1.5">
                <li>{t('developers.tools.nocode')}</li>
                <li>{t('developers.tools.odoo')}</li>
                <li>{t('developers.tools.sage')}</li>
                <li>{t('developers.tools.help')} <Link to="/contact" className="text-secondary font-semibold hover:underline">{t('developers.tools.contact')}</Link></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
