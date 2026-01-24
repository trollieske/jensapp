// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
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
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification.title || 'Påminnelse';
  const notificationOptions = {
    body: payload.notification.body || 'Tid for medisin',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'reminder-notification',
    requireInteraction: true,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  // Open the app
  event.waitUntil(
    clients.openWindow('/')
  );
});
