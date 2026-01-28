// Data storage (now synced with Firestore)
// window.logs and window.reminders are defined in firebase-config.js

// Checklist items configuration (synced from Firestore or AppConfig)
if (Object.keys(window.checklistItems || {}).length === 0 && typeof AppConfig !== 'undefined') {
    window.checklistItems = AppConfig.checklist;
}

// Save checklist items to Firestore (replaced localStorage)
function saveChecklistItems() {
    if (typeof saveChecklistToFirestore === 'function') {
        saveChecklistToFirestore(window.checklistItems)
            .then(() => console.log('Checklist saved to Firestore'))
            .catch(err => {
                console.error('Error saving checklist:', err);
                showToast('⚠️ Kunne ikke lagre sjekkliste');
            });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}



// Helper functions for log display
// getTypeIcon and getTypeColor are now in utils.js

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    requestNotificationPermission();
});

function initializeApp() {
    displayToday();
    displayHistory();
    displayReminders();
    displayStats();
    displayChecklist();
    setDefaultDateTime();
    scheduleReminders();
    checkNotificationStatus();
}

function setupEventListeners() {
    // Type change handler - show/hide fields dynamically
    document.getElementById('type').addEventListener('change', handleTypeChange);
    
    // Name dropdown - show custom name field if "Annet" selected
    document.getElementById('name').addEventListener('change', (e) => {
        const customNameField = document.getElementById('customName');
        if (e.target.value === 'Annet') {
            customNameField.classList.remove('hidden');
            customNameField.required = true;
        } else {
            customNameField.classList.add('hidden');
            customNameField.required = false;
            customNameField.value = '';
        }
    });
    
    // Log form submit
    document.getElementById('logForm').addEventListener('submit', handleLogSubmit);
    
    // Reminder form submit
    document.getElementById('reminderForm').addEventListener('submit', handleReminderSubmit);
    
    // History filters
    document.getElementById('historyDate').addEventListener('change', displayHistory);
    document.getElementById('search').addEventListener('input', displayHistory);
    
    // Stats date filter
    document.getElementById('statsDate').addEventListener('change', displayStats);
    
    // Tab change - refresh checklist when switching to it
    document.getElementById('checklist-tab').addEventListener('click', displayChecklist);
}

function handleTypeChange(e) {
    const type = e.target.value;
    
    // Hide all optional fields first
    const allFields = ['nameField', 'amountField', 'unitField', 
                       'bmAmountField', 'bmConsistencyField', 'bmColorField',
                       'urineAmountField', 'urineColorField', 'urineSmellField',
                       'vomitAmountField', 'vomitColorField'];
    allFields.forEach(fieldId => {
        document.getElementById(fieldId).classList.add('hidden');
    });
    
    // Show relevant fields based on type
    if (type === 'Medisin' || type === 'Sondemat' || type === 'Annet') {
        document.getElementById('nameField').classList.remove('hidden');
        document.getElementById('amountField').classList.remove('hidden');
        document.getElementById('unitField').classList.remove('hidden');
        document.getElementById('name').required = true;
    } else if (type === 'Avføring') {
        document.getElementById('bmAmountField').classList.remove('hidden');
        document.getElementById('bmConsistencyField').classList.remove('hidden');
        document.getElementById('bmColorField').classList.remove('hidden');
    } else if (type === 'vannlating') {
        document.getElementById('urineAmountField').classList.remove('hidden');
        document.getElementById('urineColorField').classList.remove('hidden');
        document.getElementById('urineSmellField').classList.remove('hidden');
    } else if (type === 'Oppkast') {
        document.getElementById('vomitAmountField').classList.remove('hidden');
        document.getElementById('vomitColorField').classList.remove('hidden');
    }
}

function handleLogSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('type').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('notes').value;
    
    const log = {
        id: Date.now(),
        type,
        time,
        notes,
        timestamp: new Date(time).getTime()
    };
    
    // Add type-specific fields
    if (type === 'Medisin' || type === 'Sondemat' || type === 'Annet') {
        const nameSelect = document.getElementById('name').value;
        log.name = nameSelect === 'Annet' ? document.getElementById('customName').value : nameSelect;
        log.amount = document.getElementById('amount').value;
        log.unit = document.getElementById('unit').value;
    } else if (type === 'Avføring') {
        log.bmAmount = document.getElementById('bmAmount').value;
        log.bmConsistency = document.getElementById('bmConsistency').value;
        log.bmColor = document.getElementById('bmColor').value;
    } else if (type === 'vannlating') {
        log.urineAmount = document.getElementById('urineAmount').value;
        log.urineColor = document.getElementById('urineColor').value;
        log.urineSmell = document.getElementById('urineSmell').value;
    } else if (type === 'Oppkast') {
        log.vomitAmount = document.getElementById('vomitAmount').value;
        log.vomitColor = document.getElementById('vomitColor').value;
    }
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                // Reset form and close modal
                e.target.reset();
                setDefaultDateTime();
                bootstrap.Modal.getInstance(document.getElementById('logModal')).hide();
                
                // Show success feedback with user
                showToast(`✓ Logg lagret av ${currentUser || 'deg'}!`);
                
                // Firestore realtime listener will auto-update displays
            })
            .catch((error) => {
                console.error('Error saving log:', error);
                showToast('⚠️ Feil ved lagring. Prøv igjen.');
            });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

function handleReminderSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('reminderName').value;
    const time = document.getElementById('reminderTime').value;
    
    const reminder = {
        name,
        time
    };
    
    // Save to Firestore
    if (typeof saveReminderToFirestore === 'function') {
        saveReminderToFirestore(reminder)
            .then(() => {
                e.target.reset();
                showToast(`✓ Påminnelse lagt til av ${currentUser || 'deg'}!`);
                // Firestore realtime listener will auto-update
            })
            .catch((error) => {
                console.error('Error saving reminder:', error);
                showToast('⚠️ Feil ved lagring av påminnelse.');
            });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

function addPresetReminder(name, time) {
    // Sjekk om påminnelsen allerede finnes
    const exists = (window.reminders || []).some(r => r.name === name && r.time === time);
    
    if (exists) {
        showToast('⚠️ Påminnelsen finnes allerede');
        return;
    }
    
    const reminder = {
        id: Date.now(),
        name,
        time
    };
    
    // Save to Firestore
    if (typeof saveReminderToFirestore === 'function') {
        saveReminderToFirestore(reminder)
            .then(() => {
                showToast(`✓ ${name} påminnelse lagt til!`);
            })
            .catch((error) => {
                console.error('Error saving reminder:', error);
                showToast('⚠️ Feil ved lagring.');
            });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

// Delete log from Firestore
function deleteLog(id) {
    if (confirm('Er du sikker på at du vil slette denne loggen?')) {
        console.log('Deleting log with ID:', id);
        
        // Delete from Firestore
        if (typeof deleteLogFromFirestore === 'function') {
            deleteLogFromFirestore(id)
                .then(() => {
                    showToast('✓ Logg slettet');
                })
                .catch((error) => {
                    console.error('Error deleting log:', error);
                    showToast('⚠️ Feil ved sletting: ' + error.message);
                });
        } else {
            showToast('⚠️ Feil: Kunne ikke slette (Firestore mangler)');
        }
    }
}

// Delete reminder from Firestore
function deleteReminder(id) {
    if (confirm('Er du sikker på at du vil slette denne påminnelsen?')) {
        console.log('Deleting reminder with ID:', id);
        
        // Delete from Firestore
        if (typeof deleteReminderFromFirestore === 'function') {
            deleteReminderFromFirestore(String(id))
                .then(() => {
                    showToast('✓ Påminnelse slettet');
                })
                .catch((error) => {
                    console.error('Error deleting reminder:', error);
                    showToast('⚠️ Feil ved sletting: ' + error.message);
                });
        } else {
            showToast('⚠️ Feil: Kunne ikke slette (Firestore mangler)');
        }
    }
}

// Called when user clicks OK button to save new time
function saveReminderTime(reminderId) {
    const input = document.getElementById(`time-${reminderId}`);
    if (!input) {
        showToast('⚠️ Feil ved oppdatering');
        return;
    }
    
    const newTime = input.value;
    if (!newTime) {
        showToast('⚠️ Velg et tidspunkt først');
        return;
    }
    
    const reminder = (window.reminders || []).find(r => String(r.id) === String(reminderId));
    if (!reminder) {
        showToast('⚠️ Fant ikke påminnelsen');
        return;
    }
    
    // Check if time actually changed
    if (reminder.time === newTime) {
        showToast('✓ Ingen endring');
        return;
    }
    
    const oldTime = reminder.time;
    
    // Update in Firestore
    if (typeof updateReminderInFirestore === 'function') {
        updateReminderInFirestore(String(reminderId), { time: newTime })
        .then(() => {
            showToast(`✓ Endret til ${newTime}`);
            scheduleReminders();
        })
        .catch((error) => {
            console.error('Error updating reminder:', error);
            showToast('⚠️ Feil ved lagring');
            // Revert UI if needed, but onSnapshot should handle it
            input.value = oldTime; 
        });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

// exportToCSV is now in utils.js

// Check and display notification status
function checkNotificationStatus() {
    const statusText = document.getElementById('notificationStatusText');
    const enableBtn = document.getElementById('enableNotificationsBtn');
    const iosGuide = document.getElementById('iosGuide');
    
    if (!statusText) return; // Element not loaded yet
    
    // Detect if running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    
    // Check if iOS (iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if we have an FCM token (indicating real push setup)
    const hasToken = window.fcmToken;
    
    if (!('Notification' in window)) {
        if (isIOS && !isStandalone) {
            statusText.textContent = 'iOS: Legg til på hjemskjerm først 📱';
            statusText.className = 'text-info';
            if (iosGuide) iosGuide.style.display = 'block';
        } else {
            statusText.textContent = 'Ikke støttet på denne enheten';
            statusText.className = 'text-danger';
            if (iosGuide) iosGuide.style.display = 'none';
        }
        if (enableBtn) enableBtn.style.display = 'none';
        return;
    }
    
    // Hide iOS guide if notifications are supported
    if (iosGuide) iosGuide.style.display = 'none';
    
    if (Notification.permission === 'granted') {
        if (hasToken) {
            statusText.textContent = 'Aktivert ✅';
            statusText.className = 'text-success';
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                statusText.textContent = 'Aktivert via Pushover ✅';
                statusText.className = 'text-success';
                if (enableBtn) enableBtn.style.display = 'none';
            } else {
                statusText.textContent = 'Aktivert (mangler token) ⚠️';
                statusText.className = 'text-warning';
                if (enableBtn) {
                    enableBtn.style.display = 'inline-block';
                    enableBtn.textContent = 'Reparer varsler';
                }
                return;
            }
        }
        if (enableBtn) enableBtn.style.display = 'none';
    } else if (Notification.permission === 'denied') {
        // Show platform-specific instructions
        if (isIOS) {
            statusText.textContent = 'Blokkert ❌ - Åpne Innstillinger → Safari/Chrome';
        } else {
            statusText.textContent = 'Blokkert ❌ - Åpne nettleserinnstillinger';
        }
        statusText.className = 'text-danger';
        if (enableBtn) enableBtn.style.display = 'none';
    } else {
        statusText.textContent = 'Ikke aktivert';
        statusText.className = 'text-warning';
        if (enableBtn) enableBtn.style.display = 'inline-block';
    }
}

// Notification handling
function requestNotificationPermission() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!('Notification' in window)) {
        if (isIOS && !isStandalone) {
            showToast('📱 iOS: Legg til appen på hjemskjermen først! Trykk Del-knappen → Legg til på Hjem-skjerm');
        } else {
            showToast('⚠️ Notifikasjoner støttes ikke på denne enheten');
        }
        return;
    }
    
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                const hasToken = window.fcmToken;
                const enable = (typeof enablePushNotifications === 'function')
                    ? enablePushNotifications()
                    : Promise.resolve(null);
                enable.then(() => {
                    showToast('Påminnelser aktivert! ✓');
                    checkNotificationStatus();
                }).catch(() => {
                    showToast('⚠️ Kunne ikke hente push-token');
                    checkNotificationStatus();
                });
            } else if (permission === 'denied') {
                showToast('⚠️ Notifikasjoner blokkert - sjekk innstillinger');
                checkNotificationStatus();
            }
        });
    } else if (Notification.permission === 'granted') {
        const hasToken = window.fcmToken;
        if (hasToken) {
            // Silent check - no toast on startup
            // showToast('✅ Notifikasjoner allerede aktivert');
        } else {
            const enable = (typeof enablePushNotifications === 'function')
                ? enablePushNotifications()
                : Promise.resolve(null);
            enable.then(() => {
                // Silent check
                // showToast('✓ Push-varsler aktivert!');
                checkNotificationStatus();
            }).catch(() => {
                // Keep error toast
                showToast('⚠️ Kunne ikke hente push-token');
                checkNotificationStatus();
            });
        }
    } else {
        showToast('⚠️ Notifikasjoner er blokkert - sjekk nettleserinnstillinger');
    }
}

function scheduleReminders() {
    // If we have an FCM token, we rely on server-side push notifications (more reliable on mobile)
    // The server checks every minute and sends push to all devices
    if (window.fcmToken || Notification.permission === 'granted') {
        console.log('🔔 Påminnelser håndteres av server (push-varsel)');
        return;
    }

    console.log('ℹ️ Bruker lokal planlegging (app må være åpen)');
    (window.reminders || []).forEach(reminder => {
        const [hours, minutes] = reminder.time.split(':');
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const delay = reminderTime - now;
        
        if (delay > 0) {
            setTimeout(() => {
                showNotification(`⏰ ${reminder.name}`);
                // Reschedule for next day
                scheduleReminders();
            }, delay);
        }
    });
}

function showNotification(message) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const title = 'Påminnelse - Dosevakt';
    const options = {
        body: message,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'dosevakt-local-reminder',
        requireInteraction: true
    };

    // Prefer Service Worker notifications (more reliable)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => registration.showNotification(title, options))
            .catch(() => new Notification(title, options));
    } else {
        new Notification(title, options);
    }
}

// Helper functions now in utils.js: showToast, setDefaultDateTime, formatTime, formatDateTime, formatDate


// Add new medicine to checklist
function addNewMedicineToChecklist() {
    const name = document.getElementById('newMedicineName').value.trim();
    const dose = document.getElementById('newMedicineDose').value.trim();
    const timeInput = document.getElementById('newMedicineTime')?.value || '';
    const categoryRadio = document.querySelector('input[name="medicineCategory"]:checked');
    const category = categoryRadio ? categoryRadio.value : 'prn';
    
    if (!name) {
        showToast('⚠️ Vennligst fyll inn medisinnavn');
        return;
    }
    
    // Check if medicine already exists (case insensitive)
    const exists = checklistItems.medicines.some(m => m.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showToast('⚠️ Denne medisinen finnes allerede i listen');
        return;
    }
    
    // Parse dose to extract unit
    let unit = '';
    const doseMatch = dose.match(/([\d.,]+)\s*(.*)/);
    if (doseMatch && doseMatch[2]) {
        unit = doseMatch[2];
    }
    
    // Parse time
    const times = timeInput ? [timeInput] : [];
    
    // Handle "both" category - add to both dag and kveld
    if (category === 'both') {
        // Add morning dose
        checklistItems.medicines.push({
            name: name,
            dose: dose || '',
            unit: unit,
            category: 'dag',
            times: times.length > 0 ? times : ['08:00'],
            description: 'Egendefinert medisin',
            isCustom: true
        });
        // Add evening dose
        checklistItems.medicines.push({
            name: name,
            dose: dose || '',
            unit: unit,
            category: 'kveld',
            times: ['20:00'],
            description: 'Egendefinert medisin',
            isCustom: true
        });
    } else {
        // Add single entry
        checklistItems.medicines.push({
            name: name,
            dose: dose || '',
            unit: unit,
            category: category,
            times: times,
            description: 'Egendefinert medisin',
            isCustom: true
        });
    }
    
    // Save to Firestore
    saveChecklistItems();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMedicineModal'));
    if (modal) modal.hide();
    document.getElementById('newMedicineName').value = '';
    document.getElementById('newMedicineDose').value = '';
    if (document.getElementById('newMedicineTime')) {
        document.getElementById('newMedicineTime').value = '';
    }
    // Reset category to default
    const prnRadio = document.querySelector('input[name="medicineCategory"][value="prn"]');
    if (prnRadio) prnRadio.checked = true;
    
    // Refresh checklist display
    displayChecklist();
    
    showToast(`✅ ${name} lagt til i sjekklisten!`);
}

// Delete medicine from checklist
function deleteMedicineFromChecklist(medicineName, category) {
    if (!confirm(`Er du sikker på at du vil slette "${medicineName}" fra sjekklisten?`)) {
        return;
    }
    
    // Remove from array
    const beforeCount = checklistItems.medicines.length;
    checklistItems.medicines = checklistItems.medicines.filter(m => 
        !(m.name === medicineName && m.category === category)
    );
    
    if (checklistItems.medicines.length < beforeCount) {
        // Save and refresh
        saveChecklistItems();
        displayChecklist();
        showToast(`✓ ${medicineName} fjernet fra sjekklisten`);
    } else {
        showToast('⚠️ Kunne ikke finne medisinen');
    }
}

// Migrate old medicines without category
function migrateOldMedicines() {
    let migrated = false;
    checklistItems.medicines = checklistItems.medicines.map(m => {
        if (!m.category) {
            migrated = true;
            return { ...m, category: 'prn', isCustom: true };
        }
        return m;
    });
    if (migrated) {
        saveChecklistItems();
        console.log('Migrated old medicines without category');
    }
}

// Run migration on load
migrateOldMedicines();

// Add new sondemat to checklist
function addNewSondematToChecklist() {
    const name = document.getElementById('newSondematName').value.trim();
    const amount = document.getElementById('newSondematAmount').value.trim();
    const frequency = document.getElementById('newSondematFrequency').value.trim();
    
    if (!name) {
        showToast('⚠️ Vennligst fyll inn sondematenavn');
        return;
    }
    
    // Check if sondemat already exists
    const exists = window.checklistItems.sonde.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showToast('⚠️ Denne sondematen finnes allerede i listen');
        return;
    }
    
    // Parse amount to extract unit
    let unit = 'ml';
    const amountMatch = amount.match(/([\d.,]+)\s*(.*)/);
    if (amountMatch && amountMatch[2]) {
        unit = amountMatch[2];
    }
    
    // Add to checklist
    window.checklistItems.sonde.push({
        name: name,
        dose: amount || '',
        unit: unit,
        category: 'dag',
        times: [],
        description: 'Egendefinert sondemat'
    });
    
    // Save to Firestore
    saveChecklistItems();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addSondematModal'));
    if (modal) modal.hide();
    document.getElementById('newSondematName').value = '';
    document.getElementById('newSondematAmount').value = '';
    document.getElementById('newSondematFrequency').value = '';
    
    // Refresh checklist display
    displayChecklist();
    
    showToast(`✅ ${name} lagt til i sjekklisten!`);
}

// Service Worker registration removed to avoid conflicts with firebase-messaging-sw.js
// and to prevent caching issues. Push notifications are handled in data.js.

