import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initOfflineDb } from './services/offlineDb';

// Initialize offline database before rendering
initOfflineDb().then(() => {
  console.log('Offline database initialized');
}).catch((err) => {
  console.error('Failed to initialize offline database:', err);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration.scope);

      // Cache all loaded scripts and pages for offline use
      if (navigator.serviceWorker.controller) {
        const scripts = Array.from(document.querySelectorAll('script[src]'))
          .map((script) => (script as HTMLScriptElement).src);
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .map((link) => (link as HTMLLinkElement).href);

        // Cache current scripts and styles
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_URLS',
          urls: [...scripts, ...styles],
        });

        // Pre-cache all app pages for offline use
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_ALL_PAGES',
        });
      }

      // When a new service worker is controlling, cache resources
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_ALL_PAGES',
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data?.type === 'SYNC_REQUESTED') {
          // Import dynamically to avoid circular dependencies
          const { processSyncQueue } = await import('./services/syncService');
          await processSyncQueue();
        }
      });

      // Register for background sync if supported
      if ('sync' in registration) {
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-data');
      }

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New version available. Refresh to update.');
            }
          });
        }
      });
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  });
}
