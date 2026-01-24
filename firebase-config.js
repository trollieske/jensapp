// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyATm6nPLAWuNcD4tOmDbv6tXhaqe58ScGI",
  authDomain: "jensapp-14069.firebaseapp.com",
  projectId: "jensapp-14069",
  storageBucket: "jensapp-14069.firebasestorage.app",
  messagingSenderId: "839645778268",
  appId: "1:839645778268:web:33c67e451cf4ead30f7199",
  measurementId: "G-BYGVCJGCDM"
};

// Initialize Firebase (will be loaded from CDN in index.html)
let app;
let messaging;

function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    console.log('Firebase initialized');
    setupMessaging();
  } else {
    console.error('Firebase not loaded');
  }
}

function setupMessaging() {
  // Request permission for notifications
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      messaging.getToken({ 
        vapidKey: 'BLkqloSX7qq4Yrd8vKupIY7J1fJ7CcGVawW_iw783Rqa74YUcIarXq9DIOLpl8OTVVmFuZeJS69xjaWCfWeYfy4' 
      }).then((currentToken) => {
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          // Save token to localStorage for later use
          localStorage.setItem('fcmToken', currentToken);
          showToast('✓ Push-varsler aktivert!');
        } else {
          console.log('No registration token available');
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token:', err);
      });
    } else {
      console.log('Notification permission denied');
    }
  });
  
  // Handle foreground messages
  messaging.onMessage((payload) => {
    console.log('Message received:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icon.png',
      badge: '/icon.png'
    };
    
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  });
}

// Schedule a reminder using Firebase
function scheduleFirebaseReminder(name, time) {
  const token = localStorage.getItem('fcmToken');
  if (!token) {
    console.log('No FCM token available');
    return;
  }
  
  // Calculate time until reminder
  const [hours, minutes] = time.split(':');
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (reminderTime < now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const delay = reminderTime - now;
  
  // Use setTimeout as fallback for now
  // In production, you'd send this to a backend/Cloud Function
  setTimeout(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(name, {
          body: `Tid for ${name}`,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: 'reminder-' + Date.now(),
          requireInteraction: true
        });
      });
    }
  }, delay);
}
