// Data storage (now synced with Firestore)
let logs = [];
let reminders = [];

// Checklist items configuration
const checklistItems = {
    medicines: [
        { name: 'Bactrim', dose: '10 ml', unit: 'ml', times: ['morgen', 'kveld'] },
        { name: 'Nycoplus Multi Barn', dose: '1 tablett', unit: 'tablett', times: ['morgen'] },
        { name: 'Nexium', dose: '1-2 poser', unit: 'pose', times: ['morgen'] },
        { name: 'Zyprexa', dose: '1.25-2.5 mg', unit: 'mg', times: ['kveld'] },
        { name: 'Palonosetron', dose: '390 μg', unit: 'μg', times: ['hver 48t'] },
        { name: 'Emend', dose: '40 mg', unit: 'mg', times: ['morgen'] },
        { name: 'Paracetamol', dose: '300 mg', unit: 'mg', times: ['ved behov'] },
        { name: 'Movicol', dose: '1 pose', unit: 'pose', times: ['ved behov'] },
        { name: 'Deksklorfeniramin', dose: '1 mg', unit: 'mg', times: ['morgen', 'middag', 'kveld'] },
        { name: 'Ibuprofen', dose: '', unit: 'mg', times: ['ved behov'] }
    ],
    sonde: [
        { name: 'Nutrini peptisorb', dose: '1300 ml', unit: 'ml', times: ['daglig'] }
    ]
};

// Save data to Firestore (replaced localStorage)
// Note: Individual save functions are now in firebase-config.js
// This function is kept for backwards compatibility but does nothing
function saveData() {
    // Data is now automatically synced via Firestore
    console.log('Data synced via Firestore');
}

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
                       'urineAmountField', 'urineColorField', 'urineSmellField'];
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
    } else if (type === 'Urinering') {
        document.getElementById('urineAmountField').classList.remove('hidden');
        document.getElementById('urineColorField').classList.remove('hidden');
        document.getElementById('urineSmellField').classList.remove('hidden');
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
    } else if (type === 'Urinering') {
        log.urineAmount = document.getElementById('urineAmount').value;
        log.urineColor = document.getElementById('urineColor').value;
        log.urineSmell = document.getElementById('urineSmell').value;
    }
    
    // Save to Firestore instead of localStorage
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
        // Fallback to localStorage if Firestore not available
        logs.push(log);
        saveData();
        e.target.reset();
        setDefaultDateTime();
        bootstrap.Modal.getInstance(document.getElementById('logModal')).hide();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast('Logg lagret! ✓');
    }
}

function handleReminderSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('reminderName').value;
    const time = document.getElementById('reminderTime').value;
    
    const reminder = {
        id: Date.now(),
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
        // Fallback
        reminders.push(reminder);
        saveData();
        e.target.reset();
        displayReminders();
        scheduleReminders();
        showToast('Påminnelse lagt til! ✓');
    }
}

function addPresetReminder(name, time) {
    // Sjekk om påminnelsen allerede finnes
    const exists = reminders.some(r => r.name === name && r.time === time);
    
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
        // Fallback
        reminders.push(reminder);
        saveData();
        displayReminders();
        scheduleReminders();
        showToast(`✓ ${name} påminnelse lagt til!`);
    }
}

function displayToday() {
    const tbody = document.getElementById('todayTableBody');
    const today = new Date().toDateString();
    
    const todayLogs = logs.filter(log => {
        return new Date(log.time).toDateString() === today;
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    if (todayLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Ingen logger i dag</td></tr>';
        return;
    }
    
    tbody.innerHTML = todayLogs.map(log => {
        const userBadge = log.loggedBy ? `<span class="badge bg-secondary" style="font-size: 0.7rem;">${log.loggedBy}</span>` : '';
        return `<tr>
            <td>${formatTime(log.time)}</td>
            <td><span class="badge bg-primary">${log.type}</span></td>
            <td>${getDetails(log)}</td>
            <td>${log.notes || '-'} ${userBadge}</td>
        </tr>`;
    }).join('');
}

function displayHistory() {
    const tbody = document.getElementById('historyTableBody');
    const dateFilter = document.getElementById('historyDate').value;
    const searchQuery = document.getElementById('search').value.toLowerCase();
    
    let filteredLogs = [...logs];
    
    // Filter by date
    if (dateFilter) {
        filteredLogs = filteredLogs.filter(log => {
            return log.time.startsWith(dateFilter);
        });
    }
    
    // Filter by search query
    if (searchQuery) {
        filteredLogs = filteredLogs.filter(log => {
            const searchableText = `${log.type} ${getDetails(log)} ${log.notes || ''}`.toLowerCase();
            return searchableText.includes(searchQuery);
        });
    }
    
    // Sort by timestamp descending
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    if (filteredLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Ingen logger funnet</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredLogs.map(log => {
        const userBadge = log.loggedBy ? `<span class="badge bg-secondary" style="font-size: 0.7rem;">${log.loggedBy}</span>` : '';
        return `<tr>
            <td>${formatDateTime(log.time)}</td>
            <td><span class="badge bg-primary">${log.type}</span></td>
            <td>${getDetails(log)}</td>
            <td>${log.notes || '-'} ${userBadge}</td>
        </tr>`;
    }).join('');
}

function displayReminders() {
    const list = document.getElementById('reminderList');
    
    if (reminders.length === 0) {
        list.innerHTML = '<li class="list-group-item text-muted">Ingen påminnelser lagt til</li>';
        return;
    }
    
    list.innerHTML = reminders.map(reminder => {
        const reminderId = reminder.id;
        return `<li class="list-group-item reminder-item d-flex justify-content-between align-items-center" 
                    style="position: relative;">
            <div class="d-flex align-items-center gap-2 flex-grow-1">
                <span>⏰ ${reminder.name}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <input type="time" 
                       class="form-control form-control-sm" 
                       value="${reminder.time}" 
                       style="width: 100px;" 
                       onchange="updateReminderTime('${reminderId}', this.value)"
                       onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-danger" 
                        onclick="deleteReminder('${reminderId}')" 
                        title="Slett påminnelse">
                    🗑️
                </button>
            </div>
        </li>`;
    }).join('');
}

function updateReminderTime(reminderId, newTime) {
    const reminder = reminders.find(r => r.id == reminderId);
    if (!reminder) {
        showToast('⚠️ Fant ikke påminnelsen');
        return;
    }
    
    const oldTime = reminder.time;
    reminder.time = newTime;
    
    // Update in Firestore
    if (typeof db !== 'undefined' && db) {
        db.collection('reminders').doc(reminderId).update({
            time: newTime
        })
        .then(() => {
            showToast(`✓ Påminnelse endret fra ${oldTime} til ${newTime}`);
            scheduleReminders();
        })
        .catch((error) => {
            console.error('Error updating reminder:', error);
            showToast('⚠️ Feil ved oppdatering');
            reminder.time = oldTime; // Rollback
            displayReminders();
        });
    } else {
        // Fallback to localStorage
        saveData();
        displayReminders();
        scheduleReminders();
        showToast(`✓ Påminnelse endret fra ${oldTime} til ${newTime}`);
    }
}

function displayChecklist() {
    const medicineList = document.getElementById('medicineChecklist');
    const sondeList = document.getElementById('sondeChecklist');
    const today = new Date().toDateString();
    
    // Get today's logs for each medicine
    const todayLogs = logs.filter(log => new Date(log.time).toDateString() === today);
    
    // Display medicines
    medicineList.innerHTML = checklistItems.medicines.map((item, index) => {
        const logsForItem = todayLogs.filter(log => 
            log.type === 'Medisin' && log.name === item.name
        );
        const count = logsForItem.length;
        const isLogged = count > 0;
        const loggedClass = isLogged ? 'logged-today' : '';
        const defaultAmount = parseFloat(item.dose) || '';
        
        return `
            <div class="list-group-item ${loggedClass}" style="border-radius: 8px; margin-bottom: 8px;">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <strong>${item.name}</strong><br>
                        <small class="text-muted">${item.dose} - ${item.times.join(', ')}</small>
                        <div class="dose-input-group">
                            <input type="number" 
                                   class="dose-input" 
                                   id="dose-${index}" 
                                   value="${defaultAmount}" 
                                   step="0.1" 
                                   placeholder="Dose"
                                   onclick="event.stopPropagation()">
                            <span class="text-muted" style="font-size: 0.85rem;">${item.unit}</span>
                            <button class="btn btn-primary btn-sm" 
                                    onclick="quickLogMedicineWithInput(${index}, '${item.name}', '${item.unit}')">
                                <span class="d-none d-sm-inline">Logg</span> ✓
                            </button>
                        </div>
                    </div>
                    <span class="badge ${isLogged ? 'bg-success' : 'bg-secondary'}">
                        ${isLogged ? '✓ ' + count + 'x' : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    // Display sonde
    sondeList.innerHTML = checklistItems.sonde.map((item, index) => {
        const logsForItem = todayLogs.filter(log => 
            log.type === 'Sondemat' && log.name === item.name
        );
        const count = logsForItem.length;
        const isLogged = count > 0;
        const loggedClass = isLogged ? 'logged-today' : '';
        const defaultAmount = parseFloat(item.dose) || '';
        const sondeIndex = 1000 + index; // Offset to avoid conflicts with medicine indices
        
        return `
            <div class="list-group-item ${loggedClass}" style="border-radius: 8px; margin-bottom: 8px;">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <strong>${item.name}</strong><br>
                        <small class="text-muted">${item.dose}</small>
                        <div class="dose-input-group">
                            <input type="number" 
                                   class="dose-input" 
                                   id="dose-${sondeIndex}" 
                                   value="${defaultAmount}" 
                                   step="1" 
                                   placeholder="Mengde"
                                   onclick="event.stopPropagation()">
                            <span class="text-muted" style="font-size: 0.85rem;">${item.unit}</span>
                            <button class="btn btn-primary btn-sm" 
                                    onclick="quickLogSondeWithInput(${sondeIndex}, '${item.name}', '${item.unit}')">
                                <span class="d-none d-sm-inline">Logg</span> ✓
                            </button>
                        </div>
                    </div>
                    <span class="badge ${isLogged ? 'bg-success' : 'bg-secondary'}">
                        ${isLogged ? '✓ ' + count + 'x' : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function displayStats() {
    const content = document.getElementById('statsContent');
    const dateFilter = document.getElementById('statsDate').value;
    
    let filteredLogs = logs;
    let dateLabel = 'Total';
    
    if (dateFilter) {
        filteredLogs = logs.filter(log => log.time.startsWith(dateFilter));
        dateLabel = formatDate(dateFilter);
    }
    
    if (filteredLogs.length === 0) {
        content.innerHTML = '<p class="text-muted">Ingen logger for valgt periode</p>';
        return;
    }
    
    // Group by type
    const byType = {};
    filteredLogs.forEach(log => {
        if (!byType[log.type]) {
            byType[log.type] = [];
        }
        byType[log.type].push(log);
    });
    
    let html = `<h5>${dateLabel} - Statistikk</h5>`;
    html += '<div class="row">';
    
    for (const [type, typeLogs] of Object.entries(byType)) {
        html += `<div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${type}</h6>
                    <p class="card-text"><strong>${typeLogs.length}</strong> registreringer</p>`;
        
        // Show detailed stats for medicines
        if (type === 'Medisin' || type === 'Sondemat') {
            const byName = {};
            typeLogs.forEach(log => {
                if (!byName[log.name]) {
                    byName[log.name] = 0;
                }
                byName[log.name]++;
            });
            
            html += '<ul class="list-unstyled small">';
            for (const [name, count] of Object.entries(byName)) {
                html += `<li>• ${name}: ${count}x</li>`;
            }
            html += '</ul>';
        }
        
        html += '</div></div></div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

function getDetails(log) {
    if (log.type === 'Medisin' || log.type === 'Sondemat' || log.type === 'Annet') {
        let detail = log.name || '';
        if (log.amount) {
            detail += `: ${log.amount}`;
            if (log.unit) {
                detail += ` ${log.unit}`;
            }
        }
        return detail || '-';
    } else if (log.type === 'Avføring') {
        const bristolShort = log.bmConsistency ? 
            log.bmConsistency.split(':')[0] : '';
        return `Mengde: ${log.bmAmount || '-'}, ${bristolShort}, Farge: ${log.bmColor || '-'}`;
    } else if (log.type === 'Urinering') {
        return `Mengde: ${log.urineAmount || '-'}, Farge: ${log.urineColor || '-'}, Lukt: ${log.urineSmell || '-'}`;
    }
    return '-';
}

function deleteReminder(id) {
    if (confirm('Vil du slette denne påminnelsen?')) {
        // Delete from Firestore
        if (typeof deleteReminderFromFirestore === 'function') {
            deleteReminderFromFirestore(id)
                .then(() => {
                    showToast('✓ Påminnelse slettet');
                })
                .catch((error) => {
                    console.error('Error deleting reminder:', error);
                    showToast('⚠️ Feil ved sletting');
                });
        } else {
            // Fallback to localStorage
            reminders = reminders.filter(r => r.id != id);
            saveData();
            displayReminders();
            showToast('Påminnelse slettet');
        }
    }
}

function exportToCSV() {
    if (logs.length === 0) {
        alert('Ingen logger å eksportere');
        return;
    }
    
    // CSV headers
    let csv = 'Dato,Tid,Type,Navn,Mengde,Enhet,Detaljer,Notater\n';
    
    // CSV rows
    logs.forEach(log => {
        const date = new Date(log.time);
        const dateStr = date.toLocaleDateString('no-NO');
        const timeStr = date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
        
        let row = [
            dateStr,
            timeStr,
            log.type,
            log.name || '',
            log.amount || '',
            log.unit || '',
            getDetails(log).replace(/,/g, ';'),
            (log.notes || '').replace(/,/g, ';')
        ];
        
        csv += row.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `medisinlogg_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV eksportert! ✓');
}

// Check and display notification status
function checkNotificationStatus() {
    const statusText = document.getElementById('notificationStatusText');
    const enableBtn = document.getElementById('enableNotificationsBtn');
    
    if (!statusText) return; // Element not loaded yet
    
    if (!('Notification' in window)) {
        statusText.textContent = 'Ikke støttet på denne enheten';
        statusText.className = 'text-danger';
        return;
    }
    
    if (Notification.permission === 'granted') {
        statusText.textContent = 'Aktivert ✅';
        statusText.className = 'text-success';
    } else if (Notification.permission === 'denied') {
        statusText.textContent = 'Blokkert ❌ - Aktiver i Safari-innstillinger';
        statusText.className = 'text-danger';
    } else {
        statusText.textContent = 'Ikke aktivert';
        statusText.className = 'text-warning';
        if (enableBtn) enableBtn.style.display = 'inline-block';
    }
}

// Notification handling
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Påminnelser aktivert! ✓');
            } else if (permission === 'denied') {
                showToast('⚠️ Notifikasjoner blokkert - sjekk innstillinger');
            }
        });
    } else if ('Notification' in window && Notification.permission === 'granted') {
        showToast('✅ Notifikasjoner allerede aktivert');
    } else {
        // iOS eller annen begrensning
        showToast('ℹ️ Denne enheten har begrenset notifikasjonsstøtte');
    }
}

function scheduleReminders() {
    reminders.forEach(reminder => {
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
                // Use Firebase-enhanced notifications if available
                if (typeof scheduleFirebaseReminder === 'function') {
                    scheduleFirebaseReminder(reminder.name, reminder.time);
                } else {
                    showNotification(reminder.name);
                }
                // Reschedule for next day
                scheduleReminders();
            }, delay);
        }
    });
}

function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Påminnelse - Medisinlogg', {
            body: message,
            icon: 'icon.png',
            badge: 'icon.png'
        });
    }
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Utility functions
function setDefaultDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString('no-NO', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('no-NO', { 
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Quick log functions for checklist
function quickLogMedicineWithInput(index, name, unit) {
    const doseInput = document.getElementById(`dose-${index}`);
    const amount = parseFloat(doseInput.value) || 0;
    
    if (amount <= 0) {
        showToast('⚠️ Vennligst fyll inn mengde');
        return;
    }
    
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'Medisin',
        name: name,
        amount: amount,
        unit: unit,
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ ${name} (${amount} ${unit}) logget av ${currentUser || 'deg'}!`);
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast(`✓ ${name} (${amount} ${unit}) logget!`);
    }
}

function quickLogSondeWithInput(index, name, unit) {
    const doseInput = document.getElementById(`dose-${index}`);
    const amount = parseFloat(doseInput.value) || 0;
    
    if (amount <= 0) {
        showToast('⚠️ Vennligst fyll inn mengde');
        return;
    }
    
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'Sondemat',
        name: name,
        amount: amount,
        unit: unit,
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ ${name} (${amount} ${unit}) logget av ${currentUser || 'deg'}!`);
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast(`✓ ${name} (${amount} ${unit}) logget!`);
    }
}

function submitQuickBowelMovement() {
    const amount = document.getElementById('quickBmAmount').value;
    const consistency = document.getElementById('quickBmConsistency').value;
    const color = document.getElementById('quickBmColor').value;
    
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'Avføring',
        bmAmount: amount,
        bmConsistency: consistency,
        bmColor: color,
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    
    // Close modal first
    bootstrap.Modal.getInstance(document.getElementById('bowelModal')).hide();
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ Avføring logget av ${currentUser || 'deg'}!`);
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast('✓ Avføring logget!');
    }
}

function submitQuickUrination() {
    const amount = document.getElementById('quickUrineAmount').value;
    const color = document.getElementById('quickUrineColor').value;
    const smell = document.getElementById('quickUrineSmell').value;
    
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'Urinering',
        urineAmount: amount,
        urineColor: color,
        urineSmell: smell || 'Normal',
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    
    // Close modal first
    bootstrap.Modal.getInstance(document.getElementById('urinationModal')).hide();
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ Urinering logget av ${currentUser || 'deg'}!`);
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast('✓ Urinering logget!');
    }
}

// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('Service Worker registered'))
        .catch(error => console.log('Service Worker registration failed:', error));
}
