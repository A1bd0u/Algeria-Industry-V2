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
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
                return 'vendor-pdf';
              }
              if (id.includes('recharts') || id.includes('d3-') || id.includes('d3-shape')) {
                return 'vendor-charts';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@supabase') || id.includes('@tanstack')) {
                return 'vendor-data';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-map';
              }
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },

  };
});
