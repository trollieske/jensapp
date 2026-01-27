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
      
      const vapidKey = 'BLkqloSX7qq4Yrd8vKupIY7J1fJ7CcGVawW_iw783Rqa74YUcIarXq9DIOLpl8OTVVmFuZeJS69xjaWCfWeYfy4';
      
      const getTokenPromise = ('serviceWorker' in navigator)
        ? navigator.serviceWorker.register('./sw.js').then((registration) => {
            return messaging.getToken({
              vapidKey: vapidKey,
              serviceWorkerRegistration: registration
            });
          })
        : messaging.getToken({ vapidKey: vapidKey });

      getTokenPromise.then((currentToken) => {
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          // Save token to localStorage for later use
          localStorage.setItem('fcmToken', currentToken);
          
          // Save token to Firestore via HTTP function (public)
          fetch('https://us-central1-jensapp-14069.cloudfunctions.net/saveFcmTokenHttp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: currentToken, userId: currentUser })
          })
            .then((response) => {
              if (!response.ok) throw new Error('HTTP ' + response.status);
              return response.json();
            })
            .then((result) => {
              console.log('Token saved to Firestore:', result);
              showToast('✓ Push-varsler aktivert!');
            })
            .catch((error) => {
              console.error('Error saving token:', error);
              showToast('⚠️ Kunne ikke lagre push-token');
            });
        } else {
          console.log('No registration token available');
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token:', err);
        showToast('⚠️ Kunne ikke aktivere push-varsler');
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

// Test daily report email
function sendTestDailyReport() {
  showToast('📧 Sender test-rapport...');
  
  fetch('https://us-central1-jensapp-14069.cloudfunctions.net/testDailyReport', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then((result) => {
      console.log('Test report result:', result);
      if (result.success) {
        showToast('✅ Rapport sendt! Sjekk e-posten din.');
      } else {
        showToast('⚠️ Feil: ' + (result.error || 'Ukjent feil'));
      }
    })
    .catch((error) => {
      console.error('Error sending test report:', error);
      showToast('⚠️ Feil ved sending: ' + error.message);
    });
}

// Test push notification
function toggleDebugPanel() {
  const panel = document.getElementById('debugPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
}

function fetchPushStatus() {
  showToast('🧾 Henter push-status...');
  fetch('https://us-central1-jensapp-14069.cloudfunctions.net/debugPushStatus', {
    method: 'GET'
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || ('HTTP ' + response.status));
      return data;
    })
    .then((data) => {
      console.log('Push status:', data);
      showToast(`🔔 Tokens: ${data.tokenCount} (sist: ${data.latestUpdatedAt || 'ukjent'})`);
    })
    .catch((err) => {
      console.error('Push status error:', err);
      showToast('⚠️ Push-status: ' + err.message);
    });
}

function sendTestPushNotification() {
  showToast('🔔 Sender test-push...');
  
  fetch('https://us-central1-jensapp-14069.cloudfunctions.net/testPush', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  })
    .then(async (response) => {
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // Ignore JSON parse errors
      }

      if (!response.ok) {
        throw new Error(data.error || ('HTTP ' + response.status));
      }

      return data;
    })
    .then((result) => {
      console.log('Test push result:', result);
      if (result.success) {
        showToast(`✅ Test-push sendt (${result.successCount}/${result.tokenCount})`);
      } else {
        showToast('⚠️ ' + (result.error || 'Ukjent feil'));
      }
    })
    .catch((error) => {
      console.error('Error sending test push:', error);
      showToast('⚠️ Feil ved test-push: ' + error.message);
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
let usersData = {}; // Cache of user data from Firestore

function showUserSelector() {
  const modal = document.getElementById('userSelectorModal');
  if (modal) {
    // Load users from Firestore
    loadUsersFromFirestore().then(() => {
      renderUserButtons();
    });
    
    const bsModal = new bootstrap.Modal(modal, {
      backdrop: 'static',
      keyboard: false
    });
    bsModal.show();
  }
}

function loadUsersFromFirestore() {
  if (!db) {
    // Fallback to localStorage if Firestore not ready
    return Promise.resolve();
  }
  
  return db.collection('users').get().then((snapshot) => {
    usersData = {};
    snapshot.forEach((doc) => {
      usersData[doc.id] = doc.data();
    });
  }).catch((error) => {
    console.error('Error loading users:', error);
  });
}

function renderUserButtons() {
  const defaultContainer = document.getElementById('defaultUsersContainer');
  const savedContainer = document.getElementById('savedUsersContainer');
  
  if (!defaultContainer) return;
  
  // Get all users (from Firestore or localStorage fallback)
  const allUsers = Object.keys(usersData).length > 0 
    ? Object.keys(usersData) 
    : JSON.parse(localStorage.getItem('allUsers') || '["Tom-Erik", "Mari"]');
  
  let defaultHtml = '';
  let savedHtml = '';
  
  allUsers.forEach(username => {
    const userData = usersData[username] || {};
    const email = userData.email || '';
    const emailBadge = email ? `<span style="font-size: 0.7rem; color: #4CAF50;">📧</span>` : '';
    const icon = username === 'Tom-Erik' ? '👨' : username === 'Mari' ? '👩' : '👤';
    const bgColor = username === 'Tom-Erik' ? '#E3F2FD' : username === 'Mari' ? '#FCE4EC' : '#E8F5E9';
    const isDefault = username === 'Tom-Erik' || username === 'Mari';
    
    const buttonHtml = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <button onclick="selectUser('${username}')" 
                style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; cursor: pointer; flex: 1; text-align: left;">
          <div style="width: 48px; height: 48px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #333;">${username} ${emailBadge}</div>
            <div style="font-size: 0.8rem; color: #888;">${email || 'Trykk for å logge inn'}</div>
          </div>
        </button>
        <button onclick="event.stopPropagation(); editUser('${username}')" 
                style="background: #f0f0f0; border: none; color: #666; font-size: 1rem; cursor: pointer; padding: 12px; border-radius: 10px;" title="Rediger">
          <i class="bi bi-pencil"></i>
        </button>
      </div>`;
    
    if (isDefault) {
      defaultHtml += buttonHtml;
    } else {
      savedHtml += buttonHtml;
    }
  });
  
  // Ensure Tom-Erik and Mari are always shown
  if (!allUsers.includes('Tom-Erik')) {
    defaultHtml = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <button onclick="selectUser('Tom-Erik')" 
                style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; cursor: pointer; flex: 1; text-align: left;">
          <div style="width: 48px; height: 48px; background: #E3F2FD; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👨</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #333;">Tom-Erik</div>
            <div style="font-size: 0.8rem; color: #888;">Trykk for å logge inn</div>
          </div>
        </button>
        <button onclick="event.stopPropagation(); editUser('Tom-Erik')" 
                style="background: #f0f0f0; border: none; color: #666; font-size: 1rem; cursor: pointer; padding: 12px; border-radius: 10px;" title="Rediger">
          <i class="bi bi-pencil"></i>
        </button>
      </div>` + defaultHtml;
  }
  if (!allUsers.includes('Mari')) {
    defaultHtml += `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <button onclick="selectUser('Mari')" 
                style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; cursor: pointer; flex: 1; text-align: left;">
          <div style="width: 48px; height: 48px; background: #FCE4EC; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👩</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #333;">Mari</div>
            <div style="font-size: 0.8rem; color: #888;">Trykk for å logge inn</div>
          </div>
        </button>
        <button onclick="event.stopPropagation(); editUser('Mari')" 
                style="background: #f0f0f0; border: none; color: #666; font-size: 1rem; cursor: pointer; padding: 12px; border-radius: 10px;" title="Rediger">
          <i class="bi bi-pencil"></i>
        </button>
      </div>`;
  }
  
  defaultContainer.innerHTML = defaultHtml;
  if (savedContainer) savedContainer.innerHTML = savedHtml;
}

function showAddUserModal(prefillName = '') {
  document.getElementById('editingUserId').value = '';
  document.getElementById('newUserName').value = prefillName || '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserDailyReport').checked = false;
  document.getElementById('newUserMissedMedAlert').checked = false;
  document.getElementById('addUserModalTitle').textContent = 'Ny bruker';
  document.getElementById('customUserInput').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
  modal.show();
}

function editUser(username) {
  const userData = usersData[username] || {};
  
  document.getElementById('editingUserId').value = username;
  document.getElementById('newUserName').value = username;
  document.getElementById('newUserEmail').value = userData.email || '';
  document.getElementById('newUserDailyReport').checked = userData.dailyReport || false;
  document.getElementById('newUserMissedMedAlert').checked = userData.missedMedAlert || false;
  document.getElementById('addUserModalTitle').textContent = 'Rediger ' + username;
  
  const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
  modal.show();
}

function closeAddUserModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
  if (modal) modal.hide();
}

function saveUser() {
  const editingId = document.getElementById('editingUserId').value;
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const dailyReport = document.getElementById('newUserDailyReport').checked;
  const missedMedAlert = document.getElementById('newUserMissedMedAlert').checked;
  
  if (!name) {
    showToast('⚠️ Navn er påkrevd');
    return;
  }
  
  // Validate email if provided
  if (email && !email.includes('@')) {
    showToast('⚠️ Ugyldig e-postadresse');
    return;
  }
  
  const userData = {
    name: name,
    email: email || null,
    dailyReport: email ? dailyReport : false,
    missedMedAlert: email ? missedMedAlert : false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  if (db) {
    // If editing and name changed, delete old doc
    const savePromise = editingId && editingId !== name
      ? db.collection('users').doc(editingId).delete().then(() => 
          db.collection('users').doc(name).set(userData))
      : db.collection('users').doc(name).set(userData, { merge: true });
    
    savePromise.then(() => {
      usersData[name] = userData;
      if (editingId && editingId !== name) {
        delete usersData[editingId];
      }
      
      closeAddUserModal();
      renderUserButtons();
      showToast(`✓ ${editingId ? 'Bruker oppdatert' : 'Bruker lagt til'}`);
      
      // If this was a new user from the input field, select them
      if (!editingId) {
        selectUser(name);
      }
    }).catch((error) => {
      console.error('Error saving user:', error);
      showToast('⚠️ Kunne ikke lagre bruker');
    });
  } else {
    // Fallback to localStorage
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    if (!allUsers.includes(name)) {
      allUsers.push(name);
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
    closeAddUserModal();
    renderUserButtons();
    if (!editingId) selectUser(name);
  }
}

function removeUser(username) {
  if (confirm(`Vil du fjerne ${username}?`)) {
    if (db) {
      db.collection('users').doc(username).delete().then(() => {
        delete usersData[username];
        renderUserButtons();
        showToast(`✓ ${username} fjernet`);
      });
    } else {
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const filtered = allUsers.filter(u => u !== username);
      localStorage.setItem('allUsers', JSON.stringify(filtered));
      renderUserButtons();
    }
  }
}

function selectUser(username) {
  if (!username || username.trim() === '') return;
  
  username = username.trim();
  currentUser = username;
  localStorage.setItem('currentUser', username);
  
  // Ensure user exists in Firestore
  if (db && !usersData[username]) {
    db.collection('users').doc(username).set({
      name: username,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    usersData[username] = { name: username };
  }
  
  // Also keep localStorage in sync
  const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
  if (!allUsers.includes(username)) {
    allUsers.push(username);
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
  }
  
  updateUserDisplay();
  
  const modal = document.getElementById('userSelectorModal');
  if (modal) {
    const instance = bootstrap.Modal.getInstance(modal);
    if (instance) instance.hide();
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
      logs.push({ ...doc.data(), id: doc.id });
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
      reminders.push({ ...doc.data(), id: doc.id });
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
  
  // Remove client id to avoid clashes
  delete log.id;
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
  
  // Remove client id to avoid clashes
  delete reminder.id;
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
  
  console.log('Attempting to delete log with ID:', logId);
  
  return db.collection('logs').doc(String(logId)).delete()
    .then(() => {
      console.log('Log deleted successfully:', logId);
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
