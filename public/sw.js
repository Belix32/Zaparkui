// Service Worker for Zaparkyi PWA
// Cache versioning: Update CACHE_VERSION to invalidate old caches
const CACHE_VERSION = 'v2';
const CACHE_NAME = `zaparkyi-${CACHE_VERSION}`;
const RUNTIME_CACHE = `zaparkyi-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `zaparkyi-data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('zaparkyi-');
          })
          .map((name) => {
            if (name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== DATA_CACHE) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API requests (let them go to network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'document' ||
             request.destination === 'script' ||
             request.destination === 'style') {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle image requests
async function handleImageRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response('', {
      status: 404,
      statusText: 'Not found',
    });
  }
}

// Handle static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response('', {
      status: 404,
      statusText: 'Not found',
    });
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Return cached index.html for offline navigation
    const fallback = await cache.match('/index.html');
    if (fallback) {
      return fallback;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (payload && Array.isArray(payload.urls)) {
        event.waitUntil(
          caches.open(RUNTIME_CACHE).then((cache) => {
            return cache.addAll(payload.urls);
          })
        );
      }
      break;

    case 'GET_VERSION':
      event.respondWith(
        Promise.resolve({ version: CACHE_VERSION })
      );
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});