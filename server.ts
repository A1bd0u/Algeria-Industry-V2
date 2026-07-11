import express from 'express';
import path from 'path';
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
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    beforeSend(event) {
      if (event.request && event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
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

export async function createApp() {
  const app = express();
  
  // The request handler must be the first middleware on the app
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('http')) {
    Sentry.setupExpressErrorHandler(app);
  }
  
  // Compression (gzip)
  app.use(compression());

  // Configuration du trust proxy
  // 1 = Trust le premier proxy (ex: Cloud Run).
  // Si vous placez Cloudflare devant :
  // - Cloudflare offre un WAF (Web Application Firewall) et une protection anti-DDoS.
  // - Il fait aussi office de CDN pour le cache.
  // - Assurez-vous que l'application n'est accessible que via Cloudflare (règles de pare-feu)
  //   auquel cas vous pouvez utiliser `app.set('trust proxy', true)` ou lister les IPs Cloudflare.
  // - Turnstile s'intègre parfaitement avec Cloudflare (qui gère son backend).
  app.set('trust proxy', 1);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let supabaseDomain = '';
  try {
    if (supabaseUrl) {
      supabaseDomain = new URL(supabaseUrl).origin;
    }
  } catch (e) {
    logger.error('Invalid Supabase URL for CSP config', e);
  }

  // Security HTTP Headers
  app.use(helmet({
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", supabaseDomain].filter(Boolean),
        imgSrc: ["'self'", 'data:', 'blob:', supabaseDomain].filter(Boolean),
      }
    },
    crossOriginEmbedderPolicy: false
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

  // Error handling middleware should be the last middleware
  app.use(errorHandler);

  return app;
}

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = await createApp();


  // Serve uploaded files statically


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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Validation des variables d'environnement obligatoires
  const requiredEnvVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName].trim() === ''
  );

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
