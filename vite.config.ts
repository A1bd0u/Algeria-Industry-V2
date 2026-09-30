import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
build: {
      rollupOptions: {
        output: {
          // Le lecteur PDF et les graphiques ne sont PAS regroupés ici : un
          // chunk manuel attire aussi leurs dépendances partagées (react-is,
          // use-sync-external-store…), que l'entrée importe, ce qui forçait
          // leur préchargement sur toutes les pages. Laissés à Rollup, ils ne
          // sont chargés qu'avec les pages qui les utilisent (tableau de bord,
          // console, revue KYC).
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) {
                return 'vendor-motion';
              }
              // react-query seulement : react-table ne sert qu'à la console.
              if (/node_modules\/@tanstack\/(react-query|query-core)\//.test(id)) {
                return 'vendor-data';
              }
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },

  };
});
