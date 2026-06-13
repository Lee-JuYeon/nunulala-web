import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  // SEC-14: prefer .ts over any stray .js build artifact so edited source always wins
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.json'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://api.nunulala.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        download: resolve(__dirname, 'download.html'),
      },
    },
  },
});
