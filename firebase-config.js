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
let currentUser = localStorage.getItem('currentUser') || null;

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
    setupMessaging();
    
    // Show user selector if no user selected
    if (!currentUser) {
      showUserSelector();
    } else {
      updateUserDisplay();
      startRealtimeSync();
    }
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

// User Management
function showUserSelector() {
  const modal = document.getElementById('userSelectorModal');
  if (modal) {
    const bsModal = new bootstrap.Modal(modal, {
      backdrop: 'static',
      keyboard: false
    });
    bsModal.show();
  }
}

function selectUser(username) {
  currentUser = username;
  localStorage.setItem('currentUser', username);
  updateUserDisplay();
  
  const modal = document.getElementById('userSelectorModal');
  if (modal) {
    bootstrap.Modal.getInstance(modal).hide();
  }
  
  showToast(`✓ Logget inn som ${username}`);
  startRealtimeSync();
}

function switchUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showUserSelector();
}

function updateUserDisplay() {
  const display = document.getElementById('currentUserDisplay');
  if (display) {
    display.textContent = currentUser || 'Ingen';
  }
  
  // Update welcome screen
  const welcomeName = document.getElementById('welcomeUserName');
  if (welcomeName) {
    welcomeName.textContent = currentUser || 'Bruker';
  }
}

// Firestore Sync Functions
function startRealtimeSync() {
  if (!db || !currentUser) return;
  
  // Check if we need to migrate localStorage data
  migrateLocalStorageToFirestore();
  
  // Listen to logs collection
  db.collection('logs').onSnapshot((snapshot) => {
    logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    // Update all displays
    if (typeof displayToday === 'function') displayToday();
    if (typeof displayHistory === 'function') displayHistory();
    if (typeof displayStats === 'function') displayStats();
    if (typeof displayChecklist === 'function') displayChecklist();
  });
  
  // Listen to reminders collection
  db.collection('reminders').onSnapshot((snapshot) => {
    reminders = [];
    snapshot.forEach((doc) => {
      reminders.push({ id: doc.id, ...doc.data() });
    });
    
    if (typeof displayReminders === 'function') displayReminders();
    if (typeof scheduleReminders === 'function') scheduleReminders();
  });
}

function saveLogToFirestore(log) {
  if (!db || !currentUser) {
    console.error('Firestore not initialized or no user selected');
    return Promise.reject('No user selected');
  }
  
  // Add user info to log
  log.loggedBy = currentUser;
  log.loggedAt = firebase.firestore.FieldValue.serverTimestamp();
  
  return db.collection('logs').add(log)
    .then((docRef) => {
      console.log('Log saved with ID:', docRef.id);
      return docRef.id;
    })
    .catch((error) => {
      console.error('Error saving log:', error);
      throw error;
    });
}

function saveReminderToFirestore(reminder) {
  if (!db || !currentUser) {
    console.error('Firestore not initialized or no user selected');
    return Promise.reject('No user selected');
  }
  
  // Add user info
  reminder.createdBy = currentUser;
  reminder.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  
  return db.collection('reminders').add(reminder)
    .then((docRef) => {
      console.log('Reminder saved with ID:', docRef.id);
      return docRef.id;
    })
    .catch((error) => {
      console.error('Error saving reminder:', error);
      throw error;
    });
}

function deleteLogFromFirestore(logId) {
  if (!db) return Promise.reject('Firestore not initialized');
  
  return db.collection('logs').doc(logId).delete()
    .then(() => {
      console.log('Log deleted:', logId);
    })
    .catch((error) => {
      console.error('Error deleting log:', error);
      throw error;
    });
}

function deleteReminderFromFirestore(reminderId) {
  if (!db) return Promise.reject('Firestore not initialized');
  
  return db.collection('reminders').doc(reminderId).delete()
    .then(() => {
      console.log('Reminder deleted:', reminderId);
    })
    .catch((error) => {
      console.error('Error deleting reminder:', error);
      throw error;
    });
}

// Migrate localStorage data to Firestore (one-time)
function migrateLocalStorageToFirestore() {
  // Check if migration has already been done
  const migrated = localStorage.getItem('firestoreMigrated');
  if (migrated === 'true') {
    console.log('Data already migrated to Firestore');
    return;
  }
  
  // Get localStorage data
  const localLogs = JSON.parse(localStorage.getItem('logs') || '[]');
  const localReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  
  if (localLogs.length === 0 && localReminders.length === 0) {
    console.log('No localStorage data to migrate');
    localStorage.setItem('firestoreMigrated', 'true');
    return;
  }
  
  console.log(`Migrating ${localLogs.length} logs and ${localReminders.length} reminders to Firestore...`);
  
  // Migrate logs
  const logPromises = localLogs.map(log => {
    log.loggedBy = log.loggedBy || currentUser;
    log.loggedAt = firebase.firestore.FieldValue.serverTimestamp();
    return db.collection('logs').add(log);
  });
  
  // Migrate reminders
  const reminderPromises = localReminders.map(reminder => {
    reminder.createdBy = reminder.createdBy || currentUser;
    reminder.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    return db.collection('reminders').add(reminder);
  });
  
  Promise.all([...logPromises, ...reminderPromises])
    .then(() => {
      console.log('Migration completed successfully!');
      localStorage.setItem('firestoreMigrated', 'true');
      showToast('✓ Historikk importert til Firestore!');
    })
    .catch((error) => {
      console.error('Migration error:', error);
      showToast('⚠️ Feil ved import av historikk');
    });
}
