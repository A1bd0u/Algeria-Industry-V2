import express from 'express';
import { getSupabase } from './db/supabaseClient';
import { escapeHtml } from './utils/html';
import { isUuid } from './middlewares/validateParams';
import { logger } from './utils/logger';

// SEO côté serveur sans migration SSR : pour les fiches entreprise, produit,
// article et appel d'offres, Express lit la fiche en base et injecte titre,
// description, Open Graph, canonical et JSON-LD dans index.html avant l'envoi.

export const SITE_NAME = 'Algeria Industry';
const DEFAULT_DESCRIPTION =
  "Algeria Industry : la marketplace B2B des fournisseurs industriels algériens vérifiés. Trouvez un fournisseur, comparez les produits et obtenez un devis.";

export const getSiteUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Miroir serveur de extractIdFromSlug (src/lib/utils.ts) : "slug--<base64url(id)>".
export const extractIdFromSlug = (slugUrl: string | undefined): string | null => {
  if (!slugUrl) return null;
  if (isUuid(slugUrl)) return slugUrl;
  const encoded = slugUrl.includes('--') ? slugUrl.split('--').pop()! : slugUrl;
  try {
    const decoded = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return isUuid(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image?: string | null;
  type?: string;
  jsonLd?: Record<string, any>[];
  noindex?: boolean;
}

const truncate = (text: string, max = 160) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const breadcrumb = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

// Échappe "<" dans le JSON-LD pour qu'aucune donnée ne puisse fermer la balise script.
const safeJson = (data: any) => JSON.stringify(data).replace(/</g, '\\u003c');

export const renderMeta = (meta: PageMeta) => {
  const siteUrl = getSiteUrl();
  const image = meta.image || `${siteUrl}/og-image.png`;
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (meta.noindex) {
    tags.push('<meta name="robots" content="noindex, follow" />');
  }
  for (const block of meta.jsonLd || []) {
    tags.push(`<script type="application/ld+json">${safeJson(block)}</script>`);
  }
  return tags.join('\n    ');
};

// Remplace le bloc balisé <!--seo:start-->…<!--seo:end--> de index.html.
export const injectMeta = (html: string, meta: PageMeta) =>
  html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${renderMeta(meta)}\n    <!--seo:end-->`);

const companyMeta = async (id: string): Promise<PageMeta | null> => {
  const supabase = getSupabase();
  const { data: c } = await supabase
    .from('companies')
    .select('id, name, description, activity_sector, wilaya, status, owner_id')
    .eq('id', id)
    .maybeSingle();
  if (!c) return null;

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/directory/${id}`;
  const description = truncate(
    c.description || `${c.name}${c.activity_sector ? `, ${c.activity_sector}` : ''}${c.wilaya ? ` à ${c.wilaya}` : ''}. Fiche fournisseur sur ${SITE_NAME}.`
  );
  return {
    title: `${c.name} | ${SITE_NAME}`,
    description,
    canonical,
    type: 'profile',
    // Fiches non revendiquées et sans description : contenu mince, non indexé.
    noindex: !c.owner_id && !c.description,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: c.name,
        description,
        url: canonical,
        ...(c.wilaya && { address: { '@type': 'PostalAddress', addressRegion: c.wilaya, addressCountry: 'DZ' } }),
      },
      breadcrumb([
        { name: 'Accueil', url: `${siteUrl}/` },
        { name: 'Annuaire', url: `${siteUrl}/directory` },
        { name: c.name, url: canonical },
      ]),
    ],
  };
};

const productMeta = async (id: string): Promise<PageMeta | null> => {
  const supabase = getSupabase();
  const { data: p } = await supabase
    .from('products')
    .select('id, name, description, category, price, file_url, status, brand')
    .eq('id', id)
    .maybeSingle();
  if (!p) return null;

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/products/${id}`;
  const description = truncate(p.description || `${p.name}${p.category ? ` — ${p.category}` : ''}. Demandez un devis sur ${SITE_NAME}.`);
  const price = p.price !== null && p.price !== undefined && Number(p.price) > 0 ? Number(p.price) : null;
  return {
    title: `${p.name} | ${SITE_NAME}`,
    description,
    canonical,
    image: p.file_url,
    type: 'product',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description,
        ...(p.file_url && { image: p.file_url }),
        ...(p.brand && { brand: { '@type': 'Brand', name: p.brand } }),
        ...(p.category && { category: p.category }),
        ...(price && {
          offers: { '@type': 'Offer', price, priceCurrency: 'DZD', availability: 'https://schema.org/InStock', url: canonical },
        }),
      },
      breadcrumb([
        { name: 'Accueil', url: `${siteUrl}/` },
        { name: 'Produits', url: `${siteUrl}/products` },
        { name: p.name, url: canonical },
      ]),
    ],
  };
};

const articleMeta = async (id: string): Promise<PageMeta | null> => {
  const supabase = getSupabase();
  const { data: a } = await supabase
    .from('articles')
    .select('id, title, content, image_url, author, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!a) return null;

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/blog/${id}`;
  const description = truncate((a.content || '').replace(/<[^>]*>/g, ' ') || a.title);
  return {
    title: `${a.title} | ${SITE_NAME}`,
    description,
    canonical,
    image: a.image_url,
    type: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        datePublished: a.created_at,
        ...(a.author && { author: { '@type': 'Person', name: a.author } }),
        ...(a.image_url && { image: a.image_url }),
      },
    ],
  };
};

const defaultMeta = (path: string): PageMeta => {
  const siteUrl = getSiteUrl();
  const noindexPaths = ['/search', '/dashboard', '/extranet', '/login', '/register', '/forgot-password', '/reset-password', '/kyc-upload', '/favorites', '/compare'];
  return {
    title: `${SITE_NAME} — Fournisseurs industriels algériens vérifiés`,
    description: DEFAULT_DESCRIPTION,
    canonical: `${siteUrl}${path === '/' ? '/' : path}`,
    noindex: noindexPaths.some((p) => path === p || path.startsWith(`${p}/`)),
    jsonLd: path === '/' ? [{
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${siteUrl}/`,
      logo: `${siteUrl}/favicon.svg`,
    }] : [],
  };
};

const META_TIMEOUT_MS = 1500;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

// La page ne doit jamais attendre la base plus de 1,5 s : au-delà, balises par défaut.
export const resolveMeta = async (path: string): Promise<PageMeta> => {
  const meta = await withTimeout(resolveMetaFromDb(path), META_TIMEOUT_MS);
  return meta || defaultMeta(path);
};

const resolveMetaFromDb = async (path: string): Promise<PageMeta> => {
  try {
    const match = path.match(/^\/(directory|products|blog)\/([^/?#]+)\/?$/);
    if (match) {
      const id = extractIdFromSlug(decodeURIComponent(match[2]));
      if (id) {
        const resolver = match[1] === 'directory' ? companyMeta : match[1] === 'products' ? productMeta : articleMeta;
        const meta = await resolver(id);
        if (meta) return meta;
      }
    }
  } catch (err) {
    logger.warn('SEO meta resolution failed', err);
  }
  return defaultMeta(path);
};

// ---------------------------------------------------------------------------
// robots.txt et sitemap dynamiques
// ---------------------------------------------------------------------------

const SITEMAP_LIMIT = 5000;

const urlEntry = (loc: string, lastmod?: string, changefreq = 'weekly', priority = '0.7') =>
  `  <url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

const wrapUrlset = (entries: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

export const seoRouter = express.Router();

seoRouter.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl();
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /dashboard',
      'Disallow: /extranet',
      'Disallow: /search',
      'Disallow: /kyc-upload',
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

seoRouter.get('/sitemap.xml', (req, res) => {
  const siteUrl = getSiteUrl();
  const parts = ['pages', 'companies', 'products', 'articles'];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts
      .map((p) => `  <sitemap><loc>${siteUrl}/sitemaps/${p}.xml</loc></sitemap>`)
      .join('\n')}\n</sitemapindex>\n`
  );
});

seoRouter.get('/sitemaps/:part.xml', async (req, res) => {
  const siteUrl = getSiteUrl();
  try {
    const supabase = getSupabase();
    let entries: string[] = [];

    switch (req.params.part) {
      case 'pages':
        entries = [
          urlEntry(`${siteUrl}/`, undefined, 'daily', '1.0'),
          urlEntry(`${siteUrl}/directory`, undefined, 'daily', '0.9'),
          urlEntry(`${siteUrl}/products`, undefined, 'daily', '0.9'),
          urlEntry(`${siteUrl}/tarifs`, undefined, 'monthly', '0.6'),
          urlEntry(`${siteUrl}/blog`, undefined, 'weekly', '0.8'),
          urlEntry(`${siteUrl}/events`, undefined, 'weekly', '0.7'),
          urlEntry(`${siteUrl}/catalogues`, undefined, 'weekly', '0.7'),
          urlEntry(`${siteUrl}/contact`, undefined, 'yearly', '0.4'),
          urlEntry(`${siteUrl}/faq`, undefined, 'monthly', '0.4'),
        ];
        break;
      case 'companies': {
        // Entreprises vérifiées uniquement.
        const { data } = await supabase
          .from('companies')
          .select('id, updated_at, created_at')
          .eq('status', 'approved')
          .limit(SITEMAP_LIMIT);
        entries = (data || []).map((c: any) => urlEntry(`${siteUrl}/directory/${c.id}`, c.updated_at || c.created_at));
        break;
      }
      case 'products': {
        const { data } = await supabase
          .from('products')
          .select('id, updated_at, created_at')
          .in('status', ['Actif', 'active'])
          .limit(SITEMAP_LIMIT);
        entries = (data || []).map((p: any) => urlEntry(`${siteUrl}/products/${p.id}`, p.updated_at || p.created_at));
        break;
      }
      case 'articles': {
        const { data } = await supabase
          .from('articles')
          .select('id, updated_at, created_at')
          .eq('status', 'published')
          .limit(SITEMAP_LIMIT);
        entries = (data || []).map((a: any) => urlEntry(`${siteUrl}/blog/${a.id}`, a.updated_at || a.created_at, 'monthly', '0.6'));
        break;
      }
      default:
        return res.status(404).type('text/plain').send('Not found');
    }

    res.set('Cache-Control', 'public, max-age=3600');
    return res.type('application/xml').send(wrapUrlset(entries));
  } catch (err) {
    logger.error('Sitemap generation failed', err);
    return res.status(500).type('text/plain').send('Sitemap indisponible');
  }
});
