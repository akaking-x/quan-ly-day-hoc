const CACHE_VERSION = 'v5';
const STATIC_CACHE = `qldh-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `qldh-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Static assets to precache (must exist)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('qldh-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper functions
const isNavigationRequest = (request) => {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
};

const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

const isAssetRequest = (url) => {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)(\?.*)?$/.test(url.pathname);
};

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin requests except for CDN assets
  if (url.origin !== self.location.origin) {
    // Allow caching of CDN assets
    if (isAssetRequest(url)) {
      event.respondWith(networkFirstThenCache(request));
    }
    return;
  }

  // API requests - network only, let the app handle offline with IndexedDB
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Offline - Đang sử dụng dữ liệu đã lưu',
              offline: true
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Navigation requests - network first, fallback to cache
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] Navigation failed, trying cache');
          // Try to return cached page
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html for SPA routing
          const indexResponse = await caches.match('/');
          if (indexResponse) {
            return indexResponse;
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Asset requests (JS, CSS, images) - cache first, then network
  if (isAssetRequest(url)) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // Other requests - network first, fallback to cache
  event.respondWith(networkFirstThenCache(request));
});

// Cache first, then network strategy
async function cacheFirstThenNetwork(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached response and update cache in background
    updateCache(request);
    return cachedResponse;
  }

  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Asset fetch failed:', request.url);
    // Return empty response for failed assets
    if (request.url.endsWith('.js')) {
      return new Response('/* Offline */', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    if (request.url.endsWith('.css')) {
      return new Response('/* Offline */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    return new Response('', { status: 503 });
  }
}

// Network first, then cache strategy
async function networkFirstThenCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Background cache update
function updateCache(request) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {
      // Ignore network errors during background update
    });
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CACHE_URLS' && Array.isArray(urls)) {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return Promise.all(
          urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                // Ignore failed fetches
              });
          })
        );
      })
    );
  }

  if (type === 'CACHE_ALL_PAGES') {
    // Pre-cache all app pages
    const pagesToCache = [
      '/',
      '/login',
      '/students',
      '/groups',
      '/attendance',
      '/payments',
      '/notes',
      '/settings',
      '/guide',
    ];

    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return Promise.all(
          pagesToCache.map((page) => {
            return fetch(page)
              .then((response) => {
                if (response.ok) {
                  return cache.put(page, response);
                }
              })
              .catch(() => {});
          })
        );
      })
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_REQUESTED' });
        });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Quản Lý Dạy Học', {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
      })
    );
  }
});
