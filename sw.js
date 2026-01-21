
const CACHE_NAME = 'elimusmart-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './types.ts',
  './App.tsx'
];

// Install Event: Cache Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for internal resources
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the successful response if it's from our origin
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(event.request);
      })
  );
});