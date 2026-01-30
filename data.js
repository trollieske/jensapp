/**
 * Data Management Module
 * Handles Firestore interactions, user management, and data synchronization
 */

// Helper to get collection reference based on current patient
function getCollectionRef(collectionName) {
    if (!db) return null;
    
    // Legacy support / Fallback
    // 'jens-legacy' is a reserved ID for the original root-level data
    if (!window.currentPatientId || window.currentPatientId === 'jens-legacy') {
        // console.log('Using root collection for legacy patient');
        return db.collection(collectionName);
    }
    
    // Patient-scoped collection
    // checklist is special: patients/{id}/checklist/global
    if (collectionName === 'checklist') {
        return db.collection('patients').doc(window.currentPatientId).collection('checklist');
    }
    
    return db.collection('patients').doc(window.currentPatientId).collection(collectionName);
}

// Save log to Firestore
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
    
    const collection = getCollectionRef('logs');
    if (!collection) return Promise.reject('Firestore error');
    
    return collection.add(log)
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
    
    const collection = getCollectionRef('reminders');
    if (!collection) return Promise.reject('Firestore error');
    
    return collection.add(reminder)
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
    
    const collection = getCollectionRef('logs');
    if (!collection) return Promise.reject('Firestore error');

    return collection.doc(String(logId)).delete()
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
    
    const collection = getCollectionRef('reminders');
    if (!collection) return Promise.reject('Firestore error');
    
    return collection.doc(reminderId).delete()
        .then(() => {
            console.log('Reminder deleted:', reminderId);
        })
        .catch((error) => {
            console.error('Error deleting reminder:', error);
            throw error;
        });
}

function updateReminderInFirestore(reminderId, updates) {
    if (!db) return Promise.reject('Firestore not initialized');
    
    const collection = getCollectionRef('reminders');
    if (!collection) return Promise.reject('Firestore error');

    return collection.doc(reminderId).update(updates)
        .then(() => {
            console.log('Reminder updated:', reminderId);
        })
        .catch((error) => {
            console.error('Error updating reminder:', error);
            throw error;
        });
}

function saveChecklistToFirestore(items) {
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    const collection = getCollectionRef('checklist');
    if (!collection) return;
    
    return collection.doc('global').set(items)
        .then(() => {
            console.log('Checklist saved to Firestore');
        })
        .catch((error) => {
            console.error('Error saving checklist:', error);
            throw error;
        });
}

function saveCustomPlanToFirestore(plan) {
    if (!db || !currentUser) {
        console.error('Firestore not initialized or no user selected');
        return Promise.reject('No user selected');
    }
    
    delete plan.id; // Let Firestore generate ID
    plan.createdBy = currentUser;
    plan.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    const collection = getCollectionRef('customPlans');
    if (!collection) return Promise.reject('Firestore error');
    
    return collection.add(plan)
        .then((docRef) => {
            console.log('Custom plan saved with ID:', docRef.id);
            return docRef.id;
        })
        .catch((error) => {
            console.error('Error saving custom plan:', error);
            throw error;
        });
}

function deleteCustomPlanFromFirestore(planId) {
    if (!db) return Promise.reject('Firestore not initialized');
    
    const collection = getCollectionRef('customPlans');
    if (!collection) return Promise.reject('Firestore error');
    
    return collection.doc(planId).delete()
        .then(() => {
            console.log('Custom plan deleted:', planId);
        })
        .catch((error) => {
            console.error('Error deleting custom plan:', error);
            throw error;
        });
}

function saveCustomMedicineToFirestore(medicineInfo) {
    if (!db) {
        console.error('Firestore not initialized');
        return Promise.reject('Firestore not initialized');
    }
    
    if (!medicineInfo || !medicineInfo.name) {
        return Promise.reject('Invalid medicine info');
    }
    
    const collection = getCollectionRef('customMedicines');
    if (!collection) return Promise.reject('Firestore error');
    
    // Use name as document ID for easy lookup and upsert
    return collection.doc(medicineInfo.name).set(medicineInfo)
        .then(() => {
            console.log('Custom medicine saved:', medicineInfo.name);
        })
        .catch((error) => {
            console.error('Error saving custom medicine:', error);
            throw error;
        });
}

// User Management UI functions moved to ui.js
// (showUserSelector, renderUserButtons, showAddUserModal, editUser, closeAddUserModal, updateUserDisplay)

function loadUsersFromFirestore() {
    if (!db) return Promise.resolve({});
    
    return db.collection('users').get()
        .then((querySnapshot) => {
            const users = {};
            querySnapshot.forEach((doc) => {
                users[doc.id] = doc.data();
            });
            window.usersData = users;
            console.log('Loaded users:', Object.keys(users));
            return users;
        })
        .catch((error) => {
            console.error('Error loading users:', error);
            return {};
        });
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
        const savePromise = editingId && editingId !== name
            ? db.collection('users').doc(editingId).delete().then(() => 
                    db.collection('users').doc(name).set(userData))
            : db.collection('users').doc(name).set(userData, { merge: true });
        
        savePromise.then(() => {
            window.usersData[name] = userData;
            if (editingId && editingId !== name) {
                delete window.usersData[editingId];
            }
            
            closeAddUserModal();
            renderUserButtons();
            showToast(`✓ ${editingId ? 'Bruker oppdatert' : 'Bruker lagt til'}`);
            
            if (!editingId) {
                selectUser(name);
            }
        }).catch((error) => {
            console.error('Error saving user:', error);
            showToast('⚠️ Kunne ikke lagre bruker');
        });
    } else {
        showToast('⚠️ Feil: Kan ikke lagre bruker (Firestore mangler)');
    }
}

function saveThemePreference(theme) {
    if (!currentUser || !db) return;
    
    // Optimistic update
    if (window.usersData[currentUser]) {
        window.usersData[currentUser].theme = theme;
    }
    
    db.collection('users').doc(currentUser).set({
        theme: theme,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        console.log('Theme preference saved:', theme);
    })
    .catch((error) => {
        console.error('Error saving theme preference:', error);
    });
}

function removeUser(username) {
    if (confirm(`Vil du fjerne ${username}?`)) {
        if (db) {
            db.collection('users').doc(username).delete().then(() => {
                delete window.usersData[username];
                renderUserButtons();
                showToast(`✓ ${username} fjernet`);
            });
        } else {
            showToast('⚠️ Feil: Kan ikke slette bruker (Firestore mangler)');
        }
    }
}

function selectUser(username) {
    console.warn('selectUser is deprecated. Use Firebase Auth.');
}

function restoreUserSession() {
    // Handled by Firebase Auth listener
    return false;
}

function switchUser() {
    if (auth) {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.reload();
        }).catch((error) => {
            console.error('Sign out error:', error);
            showToast('⚠️ Feil ved utlogging');
        });
    } else {
        window.currentUser = null;
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        }
    }
}

function updateUserDisplay() {
    const display = document.getElementById('currentUserDisplay');
    if (display) {
        display.textContent = window.currentUser || 'Ingen';
    }
    
    const welcomeName = document.getElementById('welcomeUserName');
    if (welcomeName) {
        welcomeName.textContent = window.currentUser || 'Bruker';
    }
    
    const offcanvasName = document.getElementById('offcanvasUserName');
    if (offcanvasName) {
        offcanvasName.textContent = window.currentUser || 'Bruker';
    }
}

// Global variable for unsubscribe functions
window.unsubscribeListeners = [];

// Firestore Sync Functions
function startRealtimeSync() {
    if (!db || !currentUser) return;
    
    // Stop existing listeners if any
    if (window.unsubscribeListeners && window.unsubscribeListeners.length > 0) {
        console.log('Stopping previous sync listeners...');
        window.unsubscribeListeners.forEach(unsub => unsub());
        window.unsubscribeListeners = [];
    }
    
    const logsRef = getCollectionRef('logs');
    const remindersRef = getCollectionRef('reminders');
    const checklistRef = getCollectionRef('checklist');
    const plansRef = getCollectionRef('customPlans');
    const medsRef = getCollectionRef('customMedicines');
    
    if (!logsRef) {
        console.warn('Sync aborted: No collection ref (no patient selected?)');
        return;
    }
    
    console.log('Starting realtime sync for patient:', window.currentPatientId || 'ROOT (Legacy)');

    // Listen to logs collection
    const unsubLogs = logsRef.onSnapshot((snapshot) => {
        window.logs = [];
        snapshot.forEach((doc) => {
            window.logs.push({ ...doc.data(), id: doc.id });
        });
        
        // Update all displays
        if (typeof displayToday === 'function') displayToday();
        if (typeof displayHistory === 'function') displayHistory();
        if (typeof displayStats === 'function') displayStats();
        if (typeof displayChecklist === 'function') displayChecklist();
    });
    window.unsubscribeListeners.push(unsubLogs);
    
    // Listen to reminders collection
    const unsubReminders = remindersRef.onSnapshot((snapshot) => {
        window.reminders = [];
        snapshot.forEach((doc) => {
            window.reminders.push({ ...doc.data(), id: doc.id });
        });
        
        if (typeof displayReminders === 'function') displayReminders();
        if (typeof scheduleReminders === 'function') scheduleReminders();
    });
    window.unsubscribeListeners.push(unsubReminders);
    
    // Listen to checklist
    const unsubChecklist = checklistRef.doc('global').onSnapshot((doc) => {
        if (doc.exists) {
            if (typeof window.checklistItems !== 'undefined') {
                window.checklistItems = doc.data();
                if (typeof displayChecklist === 'function') displayChecklist();
            }
        }
    });
    window.unsubscribeListeners.push(unsubChecklist);

    // Listen to custom plans
    const unsubPlans = plansRef.onSnapshot((snapshot) => {
        window.customPlans = [];
        snapshot.forEach((doc) => {
            window.customPlans.push({ ...doc.data(), id: doc.id });
        });
        
        if (typeof displayCustomPlans === 'function') displayCustomPlans();
    });
    window.unsubscribeListeners.push(unsubPlans);

    // Listen to custom medicines
    const unsubMeds = medsRef.onSnapshot((snapshot) => {
        const customMeds = {};
        snapshot.forEach((doc) => {
            customMeds[doc.id] = doc.data();
        });
        
        window.customMedicines = customMeds;
        
        if (typeof window.mergeCustomMedicines === 'function') {
            window.mergeCustomMedicines(customMeds);
        }
    });
    window.unsubscribeListeners.push(unsubMeds);
}

// Messaging and Push Notifications
function setupMessaging() {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted');
            
            const vapidKey = 'BLkqloSX7qq4Yrd8vKupIY7J1fJ7CcGVawW_iw783Rqa74YUcIarXq9DIOLpl8OTVVmFuZeJS69xjaWCfWeYfy4';
            const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);

            if (isLocalHost) {
                return;
            }
            
            const getTokenPromise = ('serviceWorker' in navigator)
                ? navigator.serviceWorker.register('./firebase-messaging-sw.js?v=19').then((registration) => {
                        return messaging.getToken({
                            vapidKey: vapidKey,
                            serviceWorkerRegistration: registration
                        });
                    })
                : messaging.getToken({ vapidKey: vapidKey });

            getTokenPromise.then((currentToken) => {
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    window.fcmToken = currentToken;
                    
                    if (typeof checkNotificationStatus === 'function') {
                        checkNotificationStatus();
                    }
                    
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
                            // Silent success
                            // showToast('✓ Push-varsler aktivert!');
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

function scheduleFirebaseReminder(name, time) {
    const token = window.fcmToken;
    if (!token) {
        console.log('No FCM token available');
        return;
    }
    
    const [hours, minutes] = time.split(':');
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const delay = reminderTime - now;
    
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
