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
let auth;

// Current user (TEL or Mari or custom)
window.currentUser = null;
window.currentUserId = null; // Added for Auth UID

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
    auth = firebase.auth();
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
          console.log('The current browser does not support persistence.');
        }
      });
    
    console.log('Firebase initialized with Firestore & Auth');

    // Auth State Listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            window.currentUser = user.displayName || user.email.split('@')[0];
            window.currentUserId = user.uid;
            
            // Sync user data to Firestore
            db.collection('users').doc(user.uid).set({
                name: window.currentUser,
                email: user.email,
                photoURL: user.photoURL || null,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            if (typeof updateUserDisplay === 'function') updateUserDisplay();
            if (typeof startRealtimeSync === 'function') startRealtimeSync();

            // Hide login modal if open
            const modalEl = document.getElementById('loginModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }

                // Trigger Home Logo Animation
                const logoContainer = document.getElementById('welcome-logo-container');
                if (logoContainer) {
                    // Small delay to ensure view is ready/visible
                    setTimeout(() => {
                        logoContainer.style.opacity = '1';
                        logoContainer.style.transform = 'scale(1)';
                    }, 300);
                }
            } else {
            // User is signed out
            console.log('User signed out');
            window.currentUser = null;
            window.currentUserId = null;
            
            if (typeof updateUserDisplay === 'function') updateUserDisplay();
            
            // Show login modal
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
        }
    });
    
    // Only setup messaging if permission is already granted to avoid prompt on load
    if (Notification.permission === 'granted' && typeof setupMessaging === 'function') {
      setupMessaging();
    }
  } else {
    console.error('Firebase not loaded');
  }
}

// Auth Functions
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Login failed:', error);
        alert('Innlogging feilet: ' + error.message);
    });
}

function loginWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

function registerWithEmail(email, password, name) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: name
            });
        });
}

function logout() {
    auth.signOut().then(() => {
        window.location.reload();
    });
}
