const CACHE_NAME = 'ledger-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch event - cache same-origin GET requests only
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Let the browser handle API calls, cross-origin requests, and non-GET requests.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(async (response) => {
        if (response) {
          return response;
        }

        try {
          const networkResponse = await fetch(request);

          // Cache successful same-origin basic responses for future offline use.
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch {
          // Fallback app shell for navigations when network is unavailable.
          if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) {
              return fallback;
            }
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
