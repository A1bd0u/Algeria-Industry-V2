import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { apiLimiter } from './server/middlewares/rateLimiter';

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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Trust proxy for rate limiting behind reverse proxies (like Cloud Run)
  app.set('trust proxy', 1);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let supabaseDomain = '';
  try {
    if (supabaseUrl) {
      supabaseDomain = new URL(supabaseUrl).origin;
    }
  } catch (e) {
    console.error('Invalid Supabase URL for CSP config');
  }

  // Security HTTP Headers
  // TODO: Passer cette politique en mode bloquant (retirer reportOnly: true) après une 
  // période de test en staging, une fois qu'on aura vérifié dans les logs qu'aucune 
  // ressource légitime n'est bloquée par erreur.
  app.use(helmet({
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", supabaseDomain].filter(Boolean),
        imgSrc: ["'self'", 'data:', 'blob:', supabaseDomain].filter(Boolean),
        // Les autres directives hériteront de default-src ou des valeurs par défaut strictes de helmet
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // Global Rate Limiting
  app.use('/api', apiLimiter);

  app.use(express.json());
  app.use(cookieParser());

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
    console.error(
      `\x1b[31m[ERREUR CONFIGURATION] Variables d'environnement requises manquantes ou vides : ${missingEnvVars.join(', ')}\x1b[0m`
    );
    console.error("Le serveur ne peut pas démarrer sans ces configurations. Arrêt du processus.");
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVEUR PRINCIPAL] Serveur actif sur http://localhost:${PORT}`);
  });
}

startServer();
