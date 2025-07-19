import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/bots': 'http://localhost:8000',
      '/chat': 'http://localhost:8000'
    }
  },
  base: '/',
  // This will ensure that all routes fall back to index.html
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  }
});