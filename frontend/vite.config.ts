import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
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
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      root: __dirname,
      setupFiles: [path.resolve(__dirname, 'src/test/setup.ts')],
      testTimeout: 15000,
    },
  };
});
