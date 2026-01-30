
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
    // Ensure Firebase is initialized first
    if (typeof initializeFirebase === 'function') {
        initializeFirebase();
    }

    // Initialize Patient Manager
    if (typeof initPatientManager === 'function') {
        initPatientManager();
    }

    displayToday();
    displayHistory();
    displayReminders();
    displayStats();
    displayChecklist();
    setDefaultDateTime();
    scheduleReminders();
    checkNotificationStatus();
    checkWhatsNew();
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
    const updatedReminder = { ...reminder, time: newTime };
    
    if (typeof updateReminderInFirestore === 'function') {
        updateReminderInFirestore(updatedReminder)
            .then(() => {
                showToast(`✓ Tidspunkt endret fra ${oldTime} til ${newTime}`);
                // Hide save button again
                document.getElementById(`save-btn-${reminderId}`).style.display = 'none';
            })
            .catch(err => {
                console.error('Error updating reminder:', err);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        // Fallback for demo mode
        reminder.time = newTime;
        displayReminders();
        showToast('✓ Tidspunkt oppdatert (lokalt)');
    }
}

// Request permission for push notifications
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function checkNotificationStatus() {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        console.log('Notifications enabled');
    } else if (Notification.permission === 'denied') {
        console.log('Notifications denied');
    }
}

function showNotification(title, options) {
    if (Notification.permission !== 'granted') return;
    
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
    const stockInput = document.getElementById('newMedicineStock')?.value;
    const thresholdInput = document.getElementById('newMedicineThreshold')?.value;
    const categoryRadio = document.querySelector('input[name="medicineCategory"]:checked');
    const category = categoryRadio ? categoryRadio.value : 'prn';
    
    // Parse days
    let days = []; 
    const daysTypeRadio = document.querySelector('input[name="medicineDaysType"]:checked');
    if (daysTypeRadio && daysTypeRadio.value === 'specific') {
        document.querySelectorAll('#specificDaysContainer input:checked').forEach(cb => {
            days.push(parseInt(cb.value));
        });
        if (days.length === 0) {
            showToast('⚠️ Vennligst velg minst én dag');
            return;
        }
    }
    
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
            isCustom: true,
            days: days.length > 0 ? days : null,
            stock: stockInput ? parseInt(stockInput) : null,
            lowStockThreshold: thresholdInput ? parseInt(thresholdInput) : null
        });
        // Add evening dose
        checklistItems.medicines.push({
            name: name,
            dose: dose || '',
            unit: unit,
            category: 'kveld',
            times: ['20:00'],
            description: 'Egendefinert medisin',
            isCustom: true,
            days: days.length > 0 ? days : null,
            stock: stockInput ? parseInt(stockInput) : null, // Shared stock logic might be tricky here, but separate for now
            lowStockThreshold: thresholdInput ? parseInt(thresholdInput) : null
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
            isCustom: true,
            days: days.length > 0 ? days : null,
            stock: stockInput ? parseInt(stockInput) : null,
            lowStockThreshold: thresholdInput ? parseInt(thresholdInput) : null
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
    if (document.getElementById('newMedicineStock')) document.getElementById('newMedicineStock').value = '';
    if (document.getElementById('newMedicineThreshold')) document.getElementById('newMedicineThreshold').value = '';

    // Reset category to default
    const prnRadio = document.querySelector('input[name="medicineCategory"][value="prn"]');
    if (prnRadio) prnRadio.checked = true;
    
    // Reset days
    const daysEveryday = document.getElementById('daysEveryday');
    if (daysEveryday) daysEveryday.checked = true;
    const specificDaysContainer = document.getElementById('specificDaysContainer');
    if (specificDaysContainer) {
        specificDaysContainer.style.display = 'none';
        specificDaysContainer.querySelectorAll('input').forEach(cb => cb.checked = false);
    }
    
    // Refresh checklist display
    displayChecklist();
    
    showToast(`✅ ${name} lagt til i sjekklisten!`);
}

// Edit medicine in checklist
function editMedicineInChecklist(name, category) {
    const med = checklistItems.medicines.find(m => m.name === name && m.category === category);
    if (!med) {
        showToast('⚠️ Fant ikke medisinen');
        return;
    }

    // Populate Modal
    document.getElementById('newMedicineName').value = med.name;
    document.getElementById('newMedicineDose').value = (med.dose || '') + (med.unit && !med.dose.includes(med.unit) ? ' ' + med.unit : '');
    if (document.getElementById('newMedicineTime')) {
        document.getElementById('newMedicineTime').value = med.times && med.times.length > 0 ? med.times[0] : '';
    }
    if (document.getElementById('newMedicineStock')) {
        document.getElementById('newMedicineStock').value = med.stock !== undefined && med.stock !== null ? med.stock : '';
    }
    if (document.getElementById('newMedicineThreshold')) {
        document.getElementById('newMedicineThreshold').value = med.lowStockThreshold !== undefined && med.lowStockThreshold !== null ? med.lowStockThreshold : '';
    }

    // Set Category
    const catRadio = document.querySelector(`input[name="medicineCategory"][value="${category}"]`);
    if (catRadio) catRadio.checked = true;

    // Set Days
    if (med.days && med.days.length > 0) {
        const daysSpecific = document.getElementById('daysSpecific');
        if (daysSpecific) {
            daysSpecific.checked = true;
            // Trigger change event to show container
            daysSpecific.dispatchEvent(new Event('change'));
        }
        
        // Reset all first
        document.querySelectorAll('#specificDaysContainer input').forEach(cb => cb.checked = false);
        // Check specific
        med.days.forEach(day => {
            const cb = document.getElementById(`day-${day}`);
            if (cb) cb.checked = true;
        });
    } else {
        const daysEveryday = document.getElementById('daysEveryday');
        if (daysEveryday) {
            daysEveryday.checked = true;
            daysEveryday.dispatchEvent(new Event('change'));
        }
    }

    // Change Modal Title and Button
    const modalTitle = document.querySelector('#addMedicineModal .modal-title');
    if (modalTitle) modalTitle.textContent = '✏️ Rediger medisin';

    const saveBtn = document.querySelector('#addMedicineModal .modal-footer .btn-success');
    const modalFooter = document.querySelector('#addMedicineModal .modal-footer');
    
    // Add Delete Button if it doesn't exist
    let deleteBtn = document.getElementById('btn-delete-medicine');
    if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.id = 'btn-delete-medicine';
        deleteBtn.className = 'btn btn-danger me-auto'; // me-auto pushes it to the left
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Slett';
        modalFooter.insertBefore(deleteBtn, modalFooter.firstChild);
    }
    deleteBtn.style.display = 'block'; // Ensure it's visible
    deleteBtn.onclick = function() { 
        if (confirm(`Er du sikker på at du vil slette "${name}"?`)) {
            deleteMedicineFromChecklist(name, category);
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMedicineModal'));
            if (modal) modal.hide();
        }
    };

    if (saveBtn) {
        saveBtn.textContent = '💾 Lagre endringer';
        // Remove old event listener (not easy without reference), so we clone and replace
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.onclick = function() { updateMedicineInChecklist(name, category); };
    }

    // Show Modal
    const modalEl = document.getElementById('addMedicineModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Reset modal state on close
    modalEl.addEventListener('hidden.bs.modal', function () {
        if (modalTitle) modalTitle.textContent = '💊 Legg til ny medisin';
        const currentBtn = document.querySelector('#addMedicineModal .modal-footer .btn-success');
        if (currentBtn) {
            currentBtn.textContent = '✓ Legg til';
            const resetBtn = currentBtn.cloneNode(true);
            currentBtn.parentNode.replaceChild(resetBtn, currentBtn);
            resetBtn.onclick = addNewMedicineToChecklist;
        }
        
        // Hide delete button instead of removing to keep DOM stable
        const delBtn = document.getElementById('btn-delete-medicine');
        if (delBtn) delBtn.style.display = 'none';

        document.getElementById('newMedicineName').value = '';
        document.getElementById('newMedicineDose').value = '';
        if (document.getElementById('newMedicineTime')) document.getElementById('newMedicineTime').value = '';
        
        const daysEveryday = document.getElementById('daysEveryday');
        if (daysEveryday) {
            daysEveryday.checked = true;
            daysEveryday.dispatchEvent(new Event('change'));
        }
        
        const prnRadio = document.querySelector('input[name="medicineCategory"][value="prn"]');
        if (prnRadio) prnRadio.checked = true;
    }, { once: true });
}

function updateMedicineInChecklist(oldName, oldCategory) {
    const name = document.getElementById('newMedicineName').value.trim();
    const dose = document.getElementById('newMedicineDose').value.trim();
    const timeInput = document.getElementById('newMedicineTime')?.value || '';
    const categoryRadio = document.querySelector('input[name="medicineCategory"]:checked');
    const category = categoryRadio ? categoryRadio.value : 'prn';
    
    // Parse days
    let days = []; 
    const daysTypeRadio = document.querySelector('input[name="medicineDaysType"]:checked');
    if (daysTypeRadio && daysTypeRadio.value === 'specific') {
        document.querySelectorAll('#specificDaysContainer input:checked').forEach(cb => {
            days.push(parseInt(cb.value));
        });
        if (days.length === 0) {
            showToast('⚠️ Vennligst velg minst én dag');
            return;
        }
    }

    if (!name) {
        showToast('⚠️ Vennligst fyll inn medisinnavn');
        return;
    }
    
    // Check if new name exists (if changed)
    if (name.toLowerCase() !== oldName.toLowerCase()) {
        const exists = checklistItems.medicines.some(m => m.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            showToast('⚠️ Denne medisinen finnes allerede i listen');
            return;
        }
    }
    
    // Parse dose to extract unit
    let unit = '';
    const doseMatch = dose.match(/([\d.,]+)\s*(.*)/);
    if (doseMatch && doseMatch[2]) {
        unit = doseMatch[2];
    }
    
    // Parse time
    const times = timeInput ? [timeInput] : [];

    // Find index to update
    const index = checklistItems.medicines.findIndex(m => m.name === oldName && m.category === oldCategory);
    
    if (index !== -1) {
        // Update existing
        checklistItems.medicines[index] = {
            ...checklistItems.medicines[index],
            name: name,
            dose: dose || '',
            unit: unit,
            category: category,
            times: times.length > 0 ? times : [],
            days: days.length > 0 ? days : null,
            stock: stockInput ? parseInt(stockInput) : null,
            lowStockThreshold: thresholdInput ? parseInt(thresholdInput) : null
        };
        
        // Handle "both" case if switched to it - complicated because we are editing one entry.
        // If user selects "both", we should probably create another entry for the other time.
        // But for simplicity, let's just stick to the single entry update unless user explicitly wants "both".
        // If "both" is selected, we might need to add the second entry if it doesn't exist.
        if (category === 'both') {
            // Update current to 'dag'
             checklistItems.medicines[index].category = 'dag';
             checklistItems.medicines[index].times = times.length > 0 ? times : ['08:00'];
             
             // Check if evening exists
             const eveningExists = checklistItems.medicines.some(m => m.name === name && m.category === 'kveld');
             if (!eveningExists) {
                 checklistItems.medicines.push({
                    name: name,
                    dose: dose || '',
                    unit: unit,
                    category: 'kveld',
                    times: ['20:00'],
                    description: 'Egendefinert medisin',
                    isCustom: true,
                    days: days.length > 0 ? days : null
                });
             }
        }
        
        showToast('✅ Endringer lagret');
    } else {
        showToast('⚠️ Kunne ikke finne opprinnelig medisin');
    }

    // Save and refresh
    saveChecklistItems();
    displayChecklist();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMedicineModal'));
    if (modal) modal.hide();
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

// Migrate old medicines without category or missing day schedule for Bactrim
function migrateOldMedicines() {
    let migrated = false;
    checklistItems.medicines = checklistItems.medicines.map(m => {
        let changed = false;
        let newMed = { ...m };
        
        if (!newMed.category) {
            newMed.category = 'prn';
            newMed.isCustom = true;
            changed = true;
        }
        
        // Migrate Bactrim to weekend only
        if (newMed.name === 'Bactrim' && !newMed.days) {
            newMed.days = [0, 6]; // Saturday, Sunday
            changed = true;
        }
        
        if (changed) {
            migrated = true;
            return newMed;
        }
        return m;
    });
    
    if (migrated) {
        saveChecklistItems();
        console.log('Migrated medicines (category/days)');
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

function checkWhatsNew() {
    const currentVersion = '1.3.0-spltools';
    const lastSeenVersion = localStorage.getItem('whatsNewVersion');

    console.log('Checking What\'s New:', { currentVersion, lastSeenVersion });

    if (currentVersion !== lastSeenVersion) {
        // Retry logic to ensure Bootstrap is loaded
        let attempts = 0;
        const maxAttempts = 20;
        
        const tryShowModal = () => {
            const modalEl = document.getElementById('whatsNewModal');
            
            if (modalEl && typeof bootstrap !== 'undefined') {
                try {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                    localStorage.setItem('whatsNewVersion', currentVersion);
                    console.log('What\'s New modal shown');
                } catch (e) {
                    console.error('Error showing modal:', e);
                }
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryShowModal, 200); // Retry every 200ms
                } else {
                    console.warn('Could not show What\'s New modal - Bootstrap or element missing');
                }
            }
        };
        
        // Start trying after a short delay
        setTimeout(tryShowModal, 500);
    }
}
