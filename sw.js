const CACHE_NAME = 'dosevakt-v15';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './firebase-config.js',
  './dosing-plan.js',
  './medicine-info.js',
  './manifest.json',
  './logo.svg',
  './logo-full.png',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
];

// Install service worker - skip waiting to activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch resources - NETWORK FIRST for HTML/JS, cache fallback for offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Network-first for same-origin requests (your app files)
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the fresh response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for CDN resources (Bootstrap, etc)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});

// Activate service worker - claim clients immediately and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});
