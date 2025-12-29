import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './ui',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'ui/index.html'),
        app: resolve(__dirname, 'ui/app.html'),
      },
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/device': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/walrus': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/price': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/snapshot': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/verify': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/latest': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

