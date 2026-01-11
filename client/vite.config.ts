import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Disable code splitting - bundle everything together for offline support
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Increase chunk size warning limit since we're bundling everything
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['quanly.tuanbui.click'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
