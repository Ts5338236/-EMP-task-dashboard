import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/health': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/mock': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 15000,
    },
  };
});
