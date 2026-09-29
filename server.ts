import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { apiLimiter } from './server/middlewares/rateLimiter';
import { errorHandler } from './server/middlewares/errorMiddleware';
import { logger } from './server/utils/logger';
import { getSupabase } from './server/db/supabaseClient';

// Initialisation de Sentry
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('http')) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Échantillonnage réduit (coût) : 10 % des transactions.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        delete event.request.cookies;
        // Le corps peut contenir des mots de passe ou des codes.
        delete event.request.data;
      }
      return event;
    }
  });
}

import authRoutes from './server/routes/auth';
import tenderRoutes from './server/routes/tenders';
import companyRoutes from './server/routes/companies';
import catalogueRoutes from './server/routes/catalogues';
import productRoutes from './server/routes/products';
import messageRoutes from './server/routes/messages';
import articleRoutes from './server/routes/articles';
import eventRoutes from './server/routes/events';
import rfqRoutes from './server/routes/rfqs';
import kycRoutes from './server/routes/kyc';
import favoriteRoutes from './server/routes/favorites';
import adRoutes from './server/routes/ads';
import userRoutes from './server/routes/users';
import uploadRoutes from './server/routes/upload';
import statsRoutes from './server/routes/stats';
import aiRoutes from './server/routes/ai';
import adminRoutes from './server/routes/admin';
import searchRoutes from './server/routes/search';
import contactRoutes from './server/routes/contact';
import { seoRouter, resolveMeta, injectMeta } from './server/seo';

export async function createApp() {
  const app = express();
  
  // The request handler must be the first middleware on the app
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('http')) {
    Sentry.setupExpressErrorHandler(app);
  }
  
  // Compression (gzip)
  app.use(compression());

  // Trust proxy : 1 = le load balancer Cloud Run. Derrière Cloudflare, l'IP
  // réelle du visiteur est lue dans CF-Connecting-IP (BEHIND_CLOUDFLARE=true,
  // voir server/utils/clientIp.ts) ; n'accepter alors que le trafic Cloudflare.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));
  app.disable('x-powered-by');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let supabaseDomain = '';
  try {
    if (supabaseUrl) {
      supabaseDomain = new URL(supabaseUrl).origin;
    }
  } catch (e) {
    logger.error('Invalid Supabase URL for CSP config', e);
  }

  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  const sentryOrigins = ['https://*.ingest.sentry.io', 'https://*.ingest.de.sentry.io', 'https://*.ingest.us.sentry.io'];

  // Security HTTP Headers
  // - frame-ancestors 'none' : pas de clickjacking de la console admin.
  // - pas d'unsafe-eval ; connect-src limité à Supabase, Sentry et Turnstile.
  // - le websocket (HMR Vite) n'est autorisé qu'en développement.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", supabaseDomain, ...sentryOrigins, 'https://challenges.cloudflare.com', ...(isDev ? ['ws:', 'wss:'] : [])].filter(Boolean),
        imgSrc: ["'self'", 'data:', 'blob:', supabaseDomain, 'https:'].filter(Boolean),
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com', ...(isDev ? ["'unsafe-eval'"] : [])],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // Global Rate Limiting
  app.use('/api', apiLimiter);

  // Limiter la taille du payload JSON pour prévenir les attaques d'épuisement de mémoire (ex: 2mb)
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Endpoints de supervision (Probes)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (req, res) => {
    try {
      const supabase = getSupabase();
      // Vérification basique de la connexion à la base de données
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      res.json({ status: 'ready', database: 'connected' });
    } catch (err: any) {
      logger.error('Readiness check failed:', err.message);
      res.status(503).json({ status: 'not ready', error: 'Database unavailable' });
    }
  });

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tenders', tenderRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/catalogues', catalogueRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/articles', articleRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/rfqs', rfqRoutes);
  app.use('/api/kyc', kycRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/campaigns', adRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/contact', contactRoutes);

  // Route API inconnue : 404 JSON plutôt que la page SPA.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ressource introuvable', code: 'NOT_FOUND' });
  });

  // robots.txt et sitemaps générés depuis la base.
  app.use(seoRouter);

  // Error handling middleware should be the last middleware
  app.use(errorHandler);

  return app;
}

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = await createApp();


  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

    // Les assets fingerprintés sont mis en cache longtemps ; index.html jamais.
    app.use('/assets', express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(distPath, { index: false }));

    // Balises SEO (titre, description, Open Graph, canonical, JSON-LD) injectées côté serveur.
    app.get('*', async (req, res) => {
      const meta = await resolveMeta(req.path);
      res.set('Cache-Control', 'no-cache');
      res.type('html').send(injectMeta(indexHtml, meta));
    });
  }

  // Validation des variables d'environnement obligatoires.
  // GEMINI_API_KEY est optionnelle : sans elle, la traduction renvoie 503.
  const requiredEnvVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    ...(process.env.NODE_ENV === 'production' ? ['APP_URL', 'RESEND_API_KEY', 'SENDER_EMAIL', 'TURNSTILE_SECRET_KEY'] : [])
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName].trim() === ''
  );

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.error('[ERREUR CONFIGURATION] JWT_SECRET doit contenir au moins 32 caractères.');
    process.exit(1);
  }

  if (missingEnvVars.length > 0) {
    logger.error(`[ERREUR CONFIGURATION] Variables d'environnement requises manquantes ou vides : ${missingEnvVars.join(', ')}`);
    logger.error("Le serveur ne peut pas démarrer sans ces configurations. Arrêt du processus.");
    process.exit(1);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[SERVEUR PRINCIPAL] Serveur actif sur http://localhost:${PORT}`);
  });

  // Configuration des timeouts pour prévenir l'épuisement des connexions
  // Légèrement supérieur au timeout d'un Load Balancer (ex: 60s pour AWS ALB, GCP Cloud Run)
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
