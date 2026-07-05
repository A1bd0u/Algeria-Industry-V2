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

  // Security HTTP Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for development/vite
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
  app.use('/api/ads', adRoutes);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVEUR PRINCIPAL] Serveur actif sur http://localhost:${PORT}`);
  });
}

startServer();
