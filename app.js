// Data storage (now synced with Firestore)
let logs = [];
let reminders = [];

// Checklist items configuration (stored in localStorage for persistence)
let checklistItems = JSON.parse(localStorage.getItem('checklistItems')) || {
    medicines: [
        // DAGTID
        { name: 'Bactrim', dose: '10 ml', unit: 'ml', category: 'dag', schedule: 'weekendOnly', times: ['08:00'], description: 'Antibiotikum mot bakterielle infeksjoner - kun lørdag og søndag' },
        { name: 'Nycoplus Multi Barn', dose: '1 tablett', unit: 'tablett', category: 'dag', times: ['08:00'], description: 'Multivitamin og mineraltilskudd' },
        { name: 'Nexium', dose: '1-2 poser', unit: 'pose', category: 'dag', times: ['08:00'], description: 'Protonpumpehemmer mot syrerelaterte mageproblemer' },
        { name: 'Emend', dose: '40 mg', unit: 'mg', category: 'dag', times: ['08:00'], description: 'Antiemetikum mot kvalme ved cellegift' },
        
        // KVELD
        { name: 'Bactrim', dose: '10 ml', unit: 'ml', category: 'kveld', schedule: 'weekendOnly', times: ['20:00'], description: 'Antibiotikum mot bakterielle infeksjoner - kun lørdag og søndag' },
        { name: 'Zyprexa', dose: '1.25-2.5 mg', unit: 'mg', category: 'kveld', times: ['18:00'], description: 'Antipsykotikum, brukes også mot kvalme' },
        
        // SPESIELL DOSERING
        { name: 'Palonosetron', dose: '500 μg', unit: 'μg', category: 'spesiell', schedule: 'every3days', times: [], description: 'Antiemetikum mot kvalme ved cellegift, hver 3. dag' },
        
        // VED BEHOV
        { name: 'Paracetamol', dose: '300 mg', unit: 'mg', category: 'prn', times: [], description: 'Smertestillende og febernedsettende, maks 4 doser/døgn' },
        { name: 'Movicol', dose: '1 pose', unit: 'pose', category: 'prn', times: [], description: 'Avføringsregulerende, mot forstoppelse' },
        { name: 'Deksklorfeniramin', dose: '1 mg', unit: 'mg', category: 'prn', times: [], description: 'Antihistamin mot allergi og kløe, kun ved behov' },
        { name: 'Ibuprofen', dose: '200 mg', unit: 'mg', category: 'prn', times: [], description: 'Betennelsesdempende og smertestillende, kun ved behov' }
    ],
    sonde: [
        { name: 'Nutrini peptisorb', dose: '1300 ml', unit: 'ml', category: 'dag', times: ['08:00'], description: 'Sondernæring for komplett ernæring' }
    ]
};

// Save checklist items to localStorage
function saveChecklistItems() {
    localStorage.setItem('checklistItems', JSON.stringify(checklistItems));
}

// Save data to Firestore (replaced localStorage)
// Note: Individual save functions are now in firebase-config.js
// This function is kept for backwards compatibility but does nothing
function saveData() {
    // Data is now automatically synced via Firestore
    console.log('Data synced via Firestore');
}

// Helper functions for log display
function getTypeIcon(type) {
    const icons = {
        'Medisin': '💊',
        'Sondemat': '🍼',
        'Avføring': '💩',
        'vannlating': '💧',
        'Annet': '📝'
    };
    return icons[type] || '📝';
}

function getTypeColor(type) {
    const colors = {
        'Medisin': 'linear-gradient(135deg, #4CAF50, #81C784)',
        'Sondemat': 'linear-gradient(135deg, #2196F3, #64B5F6)',
        'Avføring': 'linear-gradient(135deg, #FF9800, #FFB74D)',
        'vannlating': 'linear-gradient(135deg, #00BCD4, #4DD0E1)',
        'Annet': 'linear-gradient(135deg, #9C27B0, #BA68C8)'
    };
    return colors[type] || 'linear-gradient(135deg, #607D8B, #90A4AE)';
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
    } else if (type === 'vannlating') {
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
    } else if (type === 'vannlating') {
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
    const container = document.getElementById('todayTableBody');
    const today = new Date().toDateString();
    
    const todayLogs = logs.filter(log => {
        return new Date(log.time).toDateString() === today;
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    if (todayLogs.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">Ingen logger i dag</div>';
        return;
    }
    
    container.innerHTML = todayLogs.map(log => {
        const userBadge = log.loggedBy ? `<span style="color: #888; font-size: 0.75rem;">${log.loggedBy}</span>` : '';
        const typeIcon = getTypeIcon(log.type);
        const typeColor = getTypeColor(log.type);
        return `
            <div style="background: #fff; border-radius: 12px; padding: 14px; margin-bottom: 10px; border: 1px solid #eee; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex gap-3 flex-grow-1">
                        <div style="background: ${typeColor}; color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                            ${typeIcon}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333;">${getDetails(log)}</div>
                            <div style="font-size: 0.8rem; color: #888;">${formatTime(log.time)} ${userBadge ? '· ' + userBadge : ''}</div>
                            ${log.notes ? `<div style="font-size: 0.8rem; color: #666; margin-top: 4px;"><i class="bi bi-chat-left-text"></i> ${log.notes}</div>` : ''}
                        </div>
                    </div>
                    <button onclick="deleteLog('${log.id}')" 
                            style="color: #999; background: none; border: none; padding: 4px 8px; font-size: 1rem;"
                            title="Slett">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayHistory() {
    const container = document.getElementById('historyTableBody');
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
        container.innerHTML = '<div class="text-center text-muted p-4">Ingen logger funnet</div>';
        return;
    }
    
    container.innerHTML = filteredLogs.map(log => {
        const userBadge = log.loggedBy ? `<span style="color: #888; font-size: 0.75rem;">${log.loggedBy}</span>` : '';
        const typeIcon = getTypeIcon(log.type);
        const typeColor = getTypeColor(log.type);
        return `
            <div style="background: #fff; border-radius: 12px; padding: 14px; margin-bottom: 10px; border: 1px solid #eee; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex gap-3 flex-grow-1">
                        <div style="background: ${typeColor}; color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                            ${typeIcon}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333;">${getDetails(log)}</div>
                            <div style="font-size: 0.8rem; color: #888;">${formatDateTime(log.time)} ${userBadge ? '· ' + userBadge : ''}</div>
                            ${log.notes ? `<div style="font-size: 0.8rem; color: #666; margin-top: 4px;"><i class="bi bi-chat-left-text"></i> ${log.notes}</div>` : ''}
                        </div>
                    </div>
                    <button onclick="deleteLog('${log.id}')" 
                            style="color: #999; background: none; border: none; padding: 4px 8px; font-size: 1rem;"
                            title="Slett">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayReminders() {
    const list = document.getElementById('reminderList');
    
    if (!list) return;
    
    if (reminders.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #888; padding: 40px 20px; background: #f8f9fa; border-radius: 12px;">Ingen aktive påminnelser ennå</div>';
        return;
    }
    
    // Sort reminders by time
    const sortedReminders = [...reminders].sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    list.innerHTML = sortedReminders.map(reminder => {
        const reminderId = reminder.id;
        return `
            <div class="reminder-card" style="background: #fff; border-radius: 16px; padding: 14px; margin-bottom: 10px; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="background: linear-gradient(135deg, #4CAF50, #66BB6A); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                            ⏰
                        </div>
                        <div style="font-weight: 600; color: #333; font-size: 1rem;">${reminder.name}</div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-left: 52px;">
                        <div style="display: flex; align-items: center; background: #f0f4f8; border-radius: 10px; padding: 4px; flex: 1;">
                            <input type="time" 
                                   id="time-${reminderId}"
                                   value="${reminder.time}" 
                                   style="flex: 1; font-weight: 600; text-align: center; border: none; background: transparent; font-size: 16px; padding: 10px 8px;" 
                                   onclick="event.stopPropagation()">
                            <button onclick="saveReminderTime('${reminderId}')" 
                                    style="background: #4CAF50; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                                Lagre
                            </button>
                        </div>
                        <button onclick="deleteReminder('${reminderId}')" 
                                style="color: #dc3545; background: rgba(220,53,69,0.08); border: none; border-radius: 10px; padding: 12px; cursor: pointer;"
                                title="Slett">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');
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
    
    const reminder = reminders.find(r => String(r.id) === String(reminderId));
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
    reminder.time = newTime;
    
    // Update in Firestore
    if (typeof db !== 'undefined' && db) {
        db.collection('reminders').doc(String(reminderId)).update({
            time: newTime
        })
        .then(() => {
            showToast(`✓ Endret til ${newTime}`);
            scheduleReminders();
        })
        .catch((error) => {
            console.error('Error updating reminder:', error);
            showToast('⚠️ Feil ved lagring');
            reminder.time = oldTime; // Rollback
            displayReminders();
        });
    } else {
        // Fallback to localStorage
        saveData();
        scheduleReminders();
        showToast(`✓ Endret til ${newTime}`);
    }
}

function updateReminderTime(reminderId, newTime) {
    // Legacy function - now using saveReminderTime
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
    
    // Helper function to check if Palonosetron should be given today
    function shouldGivePalonosetron() {
        const lastLog = logs
            .filter(log => log.type === 'Medisin' && log.name === 'Palonosetron')
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (!lastLog) return true; // Never given, show it
        
        const daysSinceLastDose = Math.floor((Date.now() - lastLog.timestamp) / (1000 * 60 * 60 * 24));
        return daysSinceLastDose >= 3;
    }
    
    // Helper to render a medicine item
    function renderMedicineItem(item, index, categoryPrefix) {
        // Filter logs for this specific medicine AND category/time
        // This prevents Bactrim morning from showing evening logs and vice versa
        const logsForItem = todayLogs.filter(log => {
            if (log.type !== 'Medisin' || log.name !== item.name) return false;
            
            // For medicines with specific times, match by time proximity
            if (item.times && item.times.length > 0) {
                const logTime = new Date(log.time);
                const logHour = logTime.getHours();
                
                // Check if log time matches any of the item's scheduled times
                return item.times.some(time => {
                    const [hour] = time.split(':').map(Number);
                    // Within 3 hours of scheduled time
                    return Math.abs(logHour - hour) <= 3;
                });
            }
            return true; // PRN medicines count all logs
        });
        const count = logsForItem.length;
        const isLogged = count > 0;
        const loggedClass = isLogged ? 'logged-today' : '';
        const defaultAmount = parseFloat(item.dose) || '';
        
        let scheduleInfo = '';
        
        // Check if weekend-only medicine
        if (item.schedule === 'weekendOnly') {
            const dayOfWeek = new Date().getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=Søndag, 6=Lørdag
            if (!isWeekend) {
                return ''; // Don't show on weekdays
            }
            scheduleInfo = '<span class="badge bg-info text-dark ms-2">Kun helg</span>';
        }
        
        // Check if every 3 days medicine
        if (item.schedule === 'every3days') {
            const shouldShow = shouldGivePalonosetron();
            if (!shouldShow) {
                return ''; // Don't show if not due
            }
            scheduleInfo = '<span class="badge bg-warning text-dark ms-2">Hver 3. dag</span>';
        }
        
        const timeInfo = item.times.length > 0 ? item.times.join(', ') : 'Ved behov';
        
        const deleteBtn = item.isCustom ? `
            <button onclick="event.stopPropagation(); deleteMedicineFromChecklist('${item.name}', '${item.category}')" 
                    style="background: none; border: none; color: #dc3545; padding: 4px; cursor: pointer; opacity: 0.6;"
                    title="Slett medisin">
                <i class="bi bi-trash"></i>
            </button>` : '';
        
        return `
            <div class="list-group-item ${loggedClass}" style="border-radius: 12px; margin-bottom: 10px; padding: 14px;">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2" style="margin-bottom: 4px;">
                            <strong style="font-size: 1rem;">${item.name}</strong>
                            <button onclick="event.stopPropagation(); showMedicineInfo('${item.name}')" 
                                    style="background: #E3F2FD; color: #1976D2; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                    title="Vis medisininfo">
                                i
                            </button>
                            ${scheduleInfo}
                            ${deleteBtn}
                        </div>
                        <small class="text-muted">${item.dose} - ${timeInfo}</small>
                        <div class="dose-input-group" style="margin-top: 10px;">
                            <input type="number" 
                                   class="dose-input" 
                                   id="dose-${index}" 
                                   value="${defaultAmount}" 
                                   step="0.1" 
                                   placeholder="Dose"
                                   style="font-size: 16px;"
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
    }
    
    // Group medicines by category
    const dagMeds = checklistItems.medicines.filter(m => m.category === 'dag');
    const kveldMeds = checklistItems.medicines.filter(m => m.category === 'kveld');
    const spesiellMeds = checklistItems.medicines.filter(m => m.category === 'spesiell');
    const prnMeds = checklistItems.medicines.filter(m => m.category === 'prn');
    
    // Build HTML with sections
    let html = '';
    
    // Dag section
    if (dagMeds.length > 0) {
        html += '<h6 class="text-primary mt-3 mb-2">🌅 Dagtid (morgen/middag)</h6>';
        html += dagMeds.map((item, idx) => renderMedicineItem(item, idx)).join('');
    }
    
    // Kveld section
    if (kveldMeds.length > 0) {
        html += '<h6 class="text-primary mt-4 mb-2">🌙 Kveld</h6>';
        html += kveldMeds.map((item, idx) => renderMedicineItem(item, 100 + idx)).join('');
    }
    
    // Spesiell dosering section
    if (spesiellMeds.length > 0) {
        html += '<h6 class="text-warning mt-4 mb-2">⏰ Spesiell dosering</h6>';
        html += spesiellMeds.map((item, idx) => renderMedicineItem(item, 200 + idx)).filter(h => h).join('');
    }
    
    // Ved behov section
    if (prnMeds.length > 0) {
        html += '<h6 class="text-secondary mt-4 mb-2">🎯 Ved behov</h6>';
        html += prnMeds.map((item, idx) => renderMedicineItem(item, 300 + idx)).join('');
    }
    
    medicineList.innerHTML = html;
    
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
    } else if (log.type === 'vannlating') {
        return `Mengde: ${log.urineAmount || '-'}, Farge: ${log.urineColor || '-'}, Lukt: ${log.urineSmell || '-'}`;
    }
    return '-';
}

function deleteLog(id) {
    if (confirm('Er du sikker på at du vil slette denne loggen?')) {
        console.log('Deleting log with ID:', id, 'Type:', typeof id);
        console.log('Current logs count:', logs.length);
        
        // Delete from Firestore
        if (typeof deleteLogFromFirestore === 'function') {
            deleteLogFromFirestore(id)
                .then(() => {
                    console.log('Firestore delete successful');
                    // Immediately update local UI - convert both to string for comparison
                    const idStr = String(id);
                    const beforeCount = logs.length;
                    logs = logs.filter(l => String(l.id) !== idStr);
                    console.log('Filtered logs:', beforeCount, '->', logs.length);
                    displayToday();
                    displayHistory();
                    displayStats();
                    displayChecklist();
                    showToast('✓ Logg slettet');
                })
                .catch((error) => {
                    console.error('Error deleting log:', error);
                    showToast('⚠️ Feil ved sletting: ' + error.message);
                });
        } else {
            // Fallback to localStorage
            const idStr = String(id);
            logs = logs.filter(l => String(l.id) !== idStr);
            saveData();
            displayToday();
            displayHistory();
            displayStats();
            displayChecklist();
            showToast('Logg slettet');
        }
    }
}

function deleteReminder(id) {
    if (confirm('Vil du slette denne påminnelsen?')) {
        console.log('Deleting reminder with ID:', id);
        
        // Delete from Firestore
        if (typeof deleteReminderFromFirestore === 'function') {
            deleteReminderFromFirestore(String(id))
                .then(() => {
                    // Immediately update local UI
                    const idStr = String(id);
                    reminders = reminders.filter(r => String(r.id) !== idStr);
                    displayReminders();
                    showToast('✓ Påminnelse slettet');
                })
                .catch((error) => {
                    console.error('Error deleting reminder:', error);
                    showToast('⚠️ Feil ved sletting');
                });
        } else {
            // Fallback to localStorage
            const idStr = String(id);
            reminders = reminders.filter(r => String(r.id) !== idStr);
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
    const iosGuide = document.getElementById('iosGuide');
    
    if (!statusText) return; // Element not loaded yet
    
    // Detect if running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    
    // Check if iOS (iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
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
        statusText.textContent = 'Aktivert ✅';
        statusText.className = 'text-success';
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
                showToast('Påminnelser aktivert! ✓');
                checkNotificationStatus();
            } else if (permission === 'denied') {
                showToast('⚠️ Notifikasjoner blokkert - sjekk innstillinger');
                checkNotificationStatus();
            }
        });
    } else if (Notification.permission === 'granted') {
        showToast('✅ Notifikasjoner allerede aktivert');
    } else {
        showToast('⚠️ Notifikasjoner er blokkert - sjekk nettleserinnstillinger');
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
// Debounce to prevent multiple rapid clicks
let isLogging = false;

function quickLogMedicineWithInput(index, name, unit) {
    // Prevent multiple rapid clicks
    if (isLogging) {
        showToast('⏳ Vennligst vent...');
        return;
    }
    
    const doseInput = document.getElementById(`dose-${index}`);
    const amount = parseFloat(doseInput.value) || 0;
    
    if (amount <= 0) {
        showToast('⚠️ Vennligst fyll inn mengde');
        return;
    }
    
    isLogging = true;
    
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
                // Reset dose input to default after successful log
                const item = findMedicineByIndex(index);
                if (item) {
                    doseInput.value = parseFloat(item.dose) || '';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            })
            .finally(() => {
                // Re-enable after 1 second
                setTimeout(() => {
                    isLogging = false;
                }, 1000);
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast(`✓ ${name} (${amount} ${unit}) logget!`);
        setTimeout(() => {
            isLogging = false;
        }, 1000);
    }
}

// Helper function to find medicine by index
function findMedicineByIndex(index) {
    if (index < 100) {
        return checklistItems.medicines.filter(m => m.category === 'dag')[index];
    } else if (index < 200) {
        return checklistItems.medicines.filter(m => m.category === 'kveld')[index - 100];
    } else if (index < 300) {
        return checklistItems.medicines.filter(m => m.category === 'spesiell')[index - 200];
    } else if (index < 1000) {
        return checklistItems.medicines.filter(m => m.category === 'prn')[index - 300];
    }
    return null;
}

function quickLogSondeWithInput(index, name, unit) {
    // Prevent multiple rapid clicks
    if (isLogging) {
        showToast('⏳ Vennligst vent...');
        return;
    }
    
    const doseInput = document.getElementById(`dose-${index}`);
    const amount = parseFloat(doseInput.value) || 0;
    
    if (amount <= 0) {
        showToast('⚠️ Vennligst fyll inn mengde');
        return;
    }
    
    isLogging = true;
    
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
                // Reset dose input
                const sondeItem = checklistItems.sonde[index - 1000];
                if (sondeItem) {
                    doseInput.value = parseFloat(sondeItem.dose) || '';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            })
            .finally(() => {
                setTimeout(() => {
                    isLogging = false;
                }, 1000);
            });
    } else {
        logs.push(log);
        saveData();
        displayToday();
        displayHistory();
        displayStats();
        displayChecklist();
        showToast(`✓ ${name} (${amount} ${unit}) logget!`);
        setTimeout(() => {
            isLogging = false;
        }, 1000);
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

function submitQuickvannlating() {
    const amount = document.getElementById('quickUrineAmount').value;
    const color = document.getElementById('quickUrineColor').value;
    const smell = document.getElementById('quickUrineSmell').value;
    
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'vannlating',
        urineAmount: amount,
        urineColor: color,
        urineSmell: smell || 'Normal',
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    
    // Close modal first
    bootstrap.Modal.getInstance(document.getElementById('vannlatingModal')).hide();
    
    // Save to Firestore
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ vannlating logget av ${currentUser || 'deg'}!`);
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
        showToast('✓ vannlating logget!');
    }
}

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
    
    // Save to localStorage
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
    const exists = checklistItems.sonde.some(s => s.name.toLowerCase() === name.toLowerCase());
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
    checklistItems.sonde.push({
        name: name,
        dose: amount || '',
        unit: unit,
        category: 'dag',
        times: [],
        description: 'Egendefinert sondemat'
    });
    
    // Save to localStorage
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

// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('Service Worker registered'))
        .catch(error => console.log('Service Worker registration failed:', error));
}

