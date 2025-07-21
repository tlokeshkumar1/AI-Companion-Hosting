import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'https://ai-companion-hosting-backend.onrender.com',
      '/bots': 'https://ai-companion-hosting-backend.onrender.com',
      '/chat': 'https://ai-companion-hosting-backend.onrender.com'
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