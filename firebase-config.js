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
let db;

// Current user (TEL or Mari or custom)
window.currentUser = null; // Initialized in initializeFirebase via restoreUserSession

// Global data arrays (synced with Firestore)
window.logs = [];
window.reminders = [];
window.checklistItems = {}; // Global checklist items
window.customPlans = []; // Global for custom plans
window.customMedicines = {}; // Global for custom medicines
window.fcmToken = null; // Global FCM token
window.usersData = {}; // Cache of user data from Firestore

function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
          console.log('The current browser does not support persistence.');
        }
      });
    
    console.log('Firebase initialized with Firestore');
    
    // Only setup messaging if permission is already granted to avoid prompt on load
    if (Notification.permission === 'granted' && typeof setupMessaging === 'function') {
      setupMessaging();
    }
    
    // Restore user session if available
    if (typeof restoreUserSession === 'function') {
        restoreUserSession();
    }

    // Show user selector if no user selected
    if (!window.currentUser && typeof showUserSelector === 'function') {
      showUserSelector();
    } else {
      if (typeof updateUserDisplay === 'function') updateUserDisplay();
      if (typeof startRealtimeSync === 'function') startRealtimeSync();
    }
  } else {
    console.error('Firebase not loaded');
  }
}
