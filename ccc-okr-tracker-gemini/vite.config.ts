import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Base path for Tomcat deployment - use '/' if deploying as ROOT, 
      // or '/okr-frontend/' if deploying to that context path
      base: mode === 'production' ? '/cccokrtracker/' : '/',
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      },
      server: {
        port: 4200,
        host: '0.0.0.0',
      },
      plugins: [react(),tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
