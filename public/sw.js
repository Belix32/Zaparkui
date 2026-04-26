// Service Worker for Zaparkyi PWA
const CACHE_VERSION = 'v3';
const CACHE_NAME = `zaparkyi-${CACHE_VERSION}`;

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k.startsWith('zaparkyi-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // Skip cross-origin
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Return cached if network fails
        return caches.match(request).then(r => r || caches.match('/'));
      })
  );
});