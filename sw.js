// Firebase Messaging (push notifications)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyATm6nPLAWuNcD4tOmDbv6tXhaqe58ScGI",
  authDomain: "jensapp-14069.firebaseapp.com",
  projectId: "jensapp-14069",
  storageBucket: "jensapp-14069.firebasestorage.app",
  messagingSenderId: "839645778268",
  appId: "1:839645778268:web:33c67e451cf4ead30f7199",
  measurementId: "G-BYGVCJGCDM"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message:', payload);

  const notificationTitle = (payload.notification && payload.notification.title) || 'Påminnelse';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || 'Tid for medisin',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'dosevakt-reminder',
    requireInteraction: true,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

const CACHE_NAME = 'jensapp-v25';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './ui.js',
  './data.js',
  './utils.js',
  './config.js',
  './timers.js',
  './spl-tools.js',
  './patient-manager.js',
  './background-service.js',
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

// Install service worker
self.addEventListener('install', event => {
  // Removed skipWaiting to prevent aggressive takeover
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
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const ignoredHosts = [
    'firestore.googleapis.com',
    'firebaseio.com',
    'firebase.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'securetoken.googleapis.com',
    'identitytoolkit.googleapis.com',
    'googleapis.com',
    'gstatic.com',
    'firebaseapp.com'
  ];

  if (ignoredHosts.some(host => url.hostname.includes(host))) {
    return;
  }

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

// Activate service worker - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    // Removed clients.claim() to prevent aggressive page refresh
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
  );
});
