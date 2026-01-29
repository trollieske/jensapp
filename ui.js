
// ui.js - User Interface Rendering and Interaction

// --- Main Display Functions ---

// Display logs for today
function displayToday() {
    const tbody = document.getElementById('todayTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get today's logs
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    
    const todaysLogs = (window.logs || []).filter(log => {
        return log.time.startsWith(todayStr);
    }).sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (todaysLogs.length === 0) {
        tbody.innerHTML = '<div class="text-center text-muted p-4">Ingen logger i dag</div>';
        return;
    }
    
    todaysLogs.forEach(log => {
        const row = document.createElement('div');
        row.className = 'card mb-2 shadow-sm border-0';
        
        const color = getTypeColor(log.type);
        const icon = getTypeIcon(log.type);
        const time = formatTime(log.time);
        const details = getDetails(log); // from utils.js
        
        row.innerHTML = `
            <div class="card-body p-3 d-flex align-items-center">
                <div class="rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style="width: 48px; height: 48px; background: ${color}; color: white; font-size: 1.2rem;">
                    ${icon}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="mb-0 fw-bold">${log.type}</h6>
                        <small class="text-muted">${time}</small>
                    </div>
                    <div class="small text-dark mt-1">${details}</div>
                    ${log.notes ? `<div class="small text-muted mt-1"><em>${log.notes}</em></div>` : ''}
                    ${log.user ? `<div class="x-small text-muted mt-1" style="font-size: 0.75rem;">👤 ${log.user}</div>` : ''}
                </div>
                <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteLog('${log.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        tbody.appendChild(row);
    });
}

// Display history logs
function displayHistory() {
    const historyContainer = document.getElementById('historyTableBody');
    const historyDateInput = document.getElementById('historyDate');
    
    // Fallback if container not found, try to find where it should be
    // Based on index.html read, there is a card body for history, but maybe the list container ID is different
    // Let's assume there is a container. If not, we might need to fix index.html too.
    // Looking at index.html snippet, line 737 is todayTableBody.
    // I need to check where history logs go. 
    // Assuming 'historyList' for now, will verify later.
    
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    const selectedDate = historyDateInput ? historyDateInput.value : new Date().toISOString().slice(0, 10);
    const searchInput = document.getElementById('search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filteredLogs = (window.logs || []).filter(log => {
        const matchesDate = log.time.startsWith(selectedDate);
        const matchesSearch = !searchTerm || 
            log.type.toLowerCase().includes(searchTerm) || 
            (log.name && log.name.toLowerCase().includes(searchTerm)) ||
            (log.notes && log.notes.toLowerCase().includes(searchTerm));
        return matchesDate && matchesSearch;
    }).sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (filteredLogs.length === 0) {
        historyContainer.innerHTML = '<div class="text-center text-muted p-4">Ingen logger funnet</div>';
        return;
    }
    
    filteredLogs.forEach(log => {
        // Similar rendering to displayToday, maybe reuse a createLogCard function?
        // For now, duplicate to keep it self-contained
        const row = document.createElement('div');
        row.className = 'card mb-2 shadow-sm border-0';
        const color = getTypeColor(log.type);
        const icon = getTypeIcon(log.type);
        const time = formatTime(log.time);
        const details = getDetails(log);
        
        row.innerHTML = `
            <div class="card-body p-3 d-flex align-items-center">
                <div class="rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style="width: 48px; height: 48px; background: ${color}; color: white; font-size: 1.2rem;">
                    ${icon}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="mb-0 fw-bold">${log.type}</h6>
                        <small class="text-muted">${time}</small>
                    </div>
                    <div class="small text-dark mt-1">${details}</div>
                    ${log.notes ? `<div class="small text-muted mt-1"><em>${log.notes}</em></div>` : ''}
                    ${log.user ? `<div class="x-small text-muted mt-1" style="font-size: 0.75rem;">👤 ${log.user}</div>` : ''}
                </div>
                <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteLog('${log.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        historyContainer.appendChild(row);
    });
}

// Display reminders
function displayReminders() {
    const list = document.getElementById('reminderList');
    const countBadge = document.getElementById('activeRemindersCount');
    
    if (!list) return;
    
    list.innerHTML = '';
    const reminders = window.reminders || [];
    
    if (countBadge) countBadge.textContent = reminders.length;
    
    if (reminders.length === 0) {
        list.innerHTML = `
            <div class="text-center py-4 text-muted small bg-light rounded-3 border border-light">
                <i class="bi bi-bell-slash fs-4 d-block mb-2 opacity-50"></i>
                Ingen aktive påminnelser
            </div>`;
        return;
    }
    
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    
    reminders.forEach(reminder => {
        const item = document.createElement('div');
        item.className = 'card border-0 shadow-sm p-3 d-flex flex-row align-items-center justify-content-between bg-white';
        item.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="bi bi-clock fs-5"></i>
                </div>
                <div>
                    <div class="fw-bold text-dark" style="font-size: 1.1rem;">${reminder.time}</div>
                    <div class="small text-muted">${reminder.name}</div>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <input type="time" class="form-control form-control-sm border-0 bg-light" 
                       id="time-${reminder.id}" value="${reminder.time}" 
                       style="width: 80px;" onchange="document.getElementById('save-btn-${reminder.id}').style.display = 'inline-block'">
                <button id="save-btn-${reminder.id}" class="btn btn-sm btn-success rounded-circle shadow-sm" 
                        style="width: 32px; height: 32px; display: none;" onclick="saveReminderTime('${reminder.id}')">
                    <i class="bi bi-check"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                        style="width: 32px; height: 32px;" onclick="deleteReminder('${reminder.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Display statistics
function displayStats() {
    const container = document.getElementById('statsContent');
    const dateInput = document.getElementById('statsDate');
    if (!container) return;
    
    const date = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
    // Simple stats implementation for now
    const dayLogs = (window.logs || []).filter(l => l.time.startsWith(date));
    
    const total = dayLogs.length;
    const medicines = dayLogs.filter(l => l.type === 'Medisin').length;
    const sondemat = dayLogs.filter(l => l.type === 'Sondemat').length;
    
    container.innerHTML = `
        <div class="row g-3">
            <div class="col-6">
                <div class="card border-0 shadow-sm p-3 text-center bg-white">
                    <div class="text-muted small text-uppercase fw-bold">Totalt</div>
                    <div class="fs-2 fw-bold text-primary">${total}</div>
                </div>
            </div>
            <div class="col-6">
                <div class="card border-0 shadow-sm p-3 text-center bg-white">
                    <div class="text-muted small text-uppercase fw-bold">Medisiner</div>
                    <div class="fs-2 fw-bold text-info">${medicines}</div>
                </div>
            </div>
            <div class="col-6">
                <div class="card border-0 shadow-sm p-3 text-center bg-white">
                    <div class="text-muted small text-uppercase fw-bold">Sondemat</div>
                    <div class="fs-2 fw-bold text-warning">${sondemat}</div>
                </div>
            </div>
        </div>
    `;
}

// Display checklist
function displayChecklist() {
    const container = document.getElementById('checklist');
    if (!container) return;
    
    // We will render sections dynamically
    // Check if we have data
    if (!window.checklistItems) {
        container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3 mt-3">
            <h5 class="fw-bold mb-0">Sjekkliste</h5>
            <div class="dropdown">
                <button class="btn btn-primary rounded-pill shadow-sm px-3 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-plus-lg me-1"></i> Legg til
                </button>
                <ul class="dropdown-menu shadow border-0 rounded-4">
                    <li><a class="dropdown-item py-2" href="#" data-bs-toggle="modal" data-bs-target="#addMedicineModal">💊 Ny medisin</a></li>
                    <li><a class="dropdown-item py-2" href="#" data-bs-toggle="modal" data-bs-target="#addSondematModal">🍼 Ny sondemat</a></li>
                </ul>
            </div>
        </div>
    `;
    
    // Medicines Section
    const medicines = window.checklistItems.medicines || [];
    const categories = {
        'dag': { title: 'Daglig (Morgen)', icon: '☀️', color: 'warning' },
        'kveld': { title: 'Kveld', icon: '🌙', color: 'indigo' },
        'spesiell': { title: 'Spesielle dager', icon: '⭐', color: 'info' },
        'prn': { title: 'Ved behov', icon: '💊', color: 'success' }
    };
    
    // Group medicines
    const grouped = { dag: [], kveld: [], spesiell: [], prn: [] };
    medicines.forEach(m => {
        if (grouped[m.category]) grouped[m.category].push(m);
        else grouped.prn.push(m); // Fallback
    });
    
    Object.keys(categories).forEach(catKey => {
        const items = grouped[catKey];
        if (items.length === 0 && catKey !== 'prn') return; // Skip empty sections unless PRN
        
        const cat = categories[catKey];
        html += `
            <div class="mb-4">
                <h6 class="text-uppercase text-muted fw-bold small mb-2 ms-1">
                    ${cat.icon} ${cat.title}
                </h6>
                <div class="d-flex flex-column gap-2">
        `;
        
        items.forEach((item, index) => {
            // Calculate global index for uniqueness
            // We use a simple strategy: dag=0-99, kveld=100-199, spesiell=200-299, prn=300+
            let itemIndex = index;
            if (catKey === 'kveld') itemIndex += 100;
            else if (catKey === 'spesiell') itemIndex += 200;
            else if (catKey === 'prn') itemIndex += 300;
            
            html += `
                <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-body p-3 d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
                            <div class="bg-${cat.color} bg-opacity-10 text-${cat.color} d-flex align-items-center justify-content-center flex-shrink-0" 
                                 style="min-width: 42px; height: 42px; padding: 0 8px; border-radius: 12px;">
                                <span class="fw-bold small" style="white-space: nowrap;">${item.dose ? item.dose : '💊'}</span>
                            </div>
                            <div class="w-100 pe-2">
                                <div class="d-flex align-items-center gap-1 flex-wrap">
                                    <span class="fw-bold text-dark text-break lh-sm">${item.name}</span>
                                    <button class="btn btn-link text-info p-0 ms-1 d-inline-flex align-items-center" 
                                            style="text-decoration: none;"
                                            onclick="showMedicineInfo('${item.name}')">
                                        <i class="bi bi-info-circle-fill fs-6"></i>
                                    </button>
                                </div>
                                <div class="small text-muted text-break lh-sm mt-1">${item.description || item.times.join(', ')}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2 flex-shrink-0">
                            <input type="number" class="form-control form-control-sm border-0 bg-light text-center fw-bold" 
                                   id="dose-${itemIndex}" value="${parseFloat(item.dose) || ''}" 
                                   style="width: 55px; height: 36px;" placeholder="#">
                            <button class="btn btn-primary btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                                    style="width: 36px; height: 36px;" 
                                    onclick="quickLogMedicineWithInput(${itemIndex}, '${item.name}', '${item.unit || 'ml'}')">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            ${item.isCustom ? `
                            <button class="btn btn-light btn-sm rounded-circle text-danger ms-1" 
                                    style="width: 32px; height: 32px;"
                                    onclick="deleteMedicineFromChecklist('${item.name}', '${item.category}')">
                                <i class="bi bi-x"></i>
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (items.length === 0) {
            html += `<div class="text-center text-muted small py-2 fst-italic">Ingen medisiner i denne listen</div>`;
        }
        
        html += `</div></div>`;
    });
    
    // Sonde Section
    const sondeItems = window.checklistItems.sonde || [];
    if (sondeItems.length > 0) {
        html += `
            <div class="mb-4">
                <h6 class="text-uppercase text-muted fw-bold small mb-2 ms-1">
                    🍼 Sondemat
                </h6>
                <div class="d-flex flex-column gap-2">
        `;
        
        sondeItems.forEach((item, index) => {
            const itemIndex = index + 1000; // Offset for sonde
            html += `
                <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-body p-3 d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
                            <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;">
                                <i class="bi bi-droplet-half"></i>
                            </div>
                            <div class="overflow-hidden w-100 pe-2">
                                <div class="fw-bold text-dark text-break lh-sm">${item.name}</div>
                                <div class="small text-muted text-break lh-sm mt-1">${item.description || ''}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <input type="number" class="form-control form-control-sm border-0 bg-light text-center fw-bold" 
                                   id="dose-${itemIndex}" value="${parseFloat(item.dose) || ''}" 
                                   style="width: 60px;" placeholder="ml">
                            <button class="btn btn-primary btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                                    style="width: 36px; height: 36px;" 
                                    onclick="quickLogSondeWithInput(${itemIndex}, '${item.name}', '${item.unit || 'ml'}')">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    // Quick Actions Section (Avføring, etc.)
    html += `
        <div class="mb-4">
            <h6 class="text-uppercase text-muted fw-bold small mb-2 ms-1">
                ⚡ Hurtighandlinger
            </h6>
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-white w-100 p-3 shadow-sm rounded-4 border-0 d-flex flex-column align-items-center gap-2 h-100" 
                            data-bs-toggle="modal" data-bs-target="#bowelModal">
                        <div class="bg-brown bg-opacity-10 text-brown rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; color: #795548;">
                            <i class="bi bi-chat-square-text fs-4"></i>
                        </div>
                        <div class="fw-bold text-dark small">Avføring</div>
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-white w-100 p-3 shadow-sm rounded-4 border-0 d-flex flex-column align-items-center gap-2 h-100" 
                            data-bs-toggle="modal" data-bs-target="#vannlatingModal">
                        <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                            <i class="bi bi-droplet-fill fs-4"></i>
                        </div>
                        <div class="fw-bold text-dark small">Vannlating</div>
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-white w-100 p-3 shadow-sm rounded-4 border-0 d-flex flex-column align-items-center gap-2 h-100" 
                            data-bs-toggle="modal" data-bs-target="#vomitModal">
                        <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                            <i class="bi bi-emoji-dizzy fs-4"></i>
                        </div>
                        <div class="fw-bold text-dark small">Oppkast</div>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

let isLogging = false;

function findMedicineByIndex(index) {
    if (index < 100) {
        return window.checklistItems.medicines.filter(m => m.category === 'dag')[index];
    } else if (index < 200) {
        return window.checklistItems.medicines.filter(m => m.category === 'kveld')[index - 100];
    } else if (index < 300) {
        return window.checklistItems.medicines.filter(m => m.category === 'spesiell')[index - 200];
    } else if (index < 1000) {
        return window.checklistItems.medicines.filter(m => m.category === 'prn')[index - 300];
    }
    return null;
}

function quickLogMedicineWithInput(index, name, unit) {
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
    
    // Find medicine to get category
    const item = findMedicineByIndex(index);
    const category = item ? item.category : 'ukjent';
    
    isLogging = true;
    const now = new Date();
    const log = {
        id: Date.now(),
        type: 'Medisin',
        name: name,
        amount: amount,
        unit: unit,
        category: category, // Added category
        time: now.toISOString().slice(0, 16),
        notes: 'Logget via sjekkliste',
        timestamp: now.getTime()
    };
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ ${name} (${amount} ${unit}) logget av ${currentUser || 'deg'}!`);
                if (item) {
                    doseInput.value = parseFloat(item.dose) || '';
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
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
        setTimeout(() => {
            isLogging = false;
        }, 1000);
    }
}

function quickLogSondeWithInput(index, name, unit) {
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
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ ${name} (${amount} ${unit}) logget av ${currentUser || 'deg'}!`);
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
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
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
    bootstrap.Modal.getInstance(document.getElementById('bowelModal')).hide();
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
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
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
    bootstrap.Modal.getInstance(document.getElementById('vannlatingModal')).hide();
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
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

function quickLogVomit() {
    const amount = document.getElementById('quickVomitAmount').value;
    const color = document.getElementById('quickVomitColor').value;
    const timeInput = document.getElementById('quickVomitTime').value;
    let logTime = new Date();
    if (timeInput) {
        logTime = new Date(timeInput);
    }
    const log = {
        id: Date.now(),
        type: 'Oppkast',
        vomitAmount: amount,
        vomitColor: color,
        time: logTime.toISOString().slice(0, 16),
        notes: 'Hurtigregistrering',
        timestamp: logTime.getTime()
    };
    const modalEl = document.getElementById('vomitModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) {
        modal.hide();
    }
    if (typeof saveLogToFirestore === 'function') {
        saveLogToFirestore(log)
            .then(() => {
                showToast(`✓ Oppkast logget av ${currentUser || 'deg'}!`);
                document.getElementById('quickVomitColor').value = '';
                document.getElementById('quickVomitTime').value = '';
            })
            .catch((error) => {
                console.error('Error:', error);
                showToast('⚠️ Feil ved lagring');
            });
    } else {
        console.error('Firestore functions not loaded');
        showToast('⚠️ Feil: Kunne ikke lagre (Firestore mangler)');
    }
}

// --- User Management UI Functions (Existing) ---
function showUserSelector() {
    const modal = document.getElementById('userSelectorModal');
    if (modal) {
        if (typeof loadUsersFromFirestore === 'function') {
            loadUsersFromFirestore().then(() => {
                renderUserButtons();
            });
        } else {
            renderUserButtons();
        }
        const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
        bsModal.show();
    }
}

function renderUserButtons() {
    const defaultContainer = document.getElementById('defaultUsersContainer');
    const savedContainer = document.getElementById('savedUsersContainer');
    if (!defaultContainer) return;
    const allUsers = Object.keys(window.usersData || {}).length > 0 ? Object.keys(window.usersData) : ['Tom-Erik', 'Mari'];
    let defaultHtml = '';
    let savedHtml = '';
    allUsers.forEach(username => {
        const userData = window.usersData[username] || {};
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
        if (isDefault) defaultHtml += buttonHtml;
        else savedHtml += buttonHtml;
    });
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
                        style="background: #f0f0f0; border: none; color: #666; font-size: 1.1rem; cursor: pointer; padding: 12px; border-radius: 10px;" title="Rediger">
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
    const title = document.getElementById('addUserModalTitle');
    if (title) title.textContent = 'Ny bruker';
    const customInput = document.getElementById('customUserInput');
    if (customInput) customInput.value = '';
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function editUser(username) {
    const userData = window.usersData[username] || {};
    document.getElementById('editingUserId').value = username;
    document.getElementById('newUserName').value = username;
    document.getElementById('newUserEmail').value = userData.email || '';
    document.getElementById('newUserDailyReport').checked = userData.dailyReport || false;
    document.getElementById('newUserMissedMedAlert').checked = userData.missedMedAlert || false;
    const title = document.getElementById('addUserModalTitle');
    if (title) title.textContent = 'Rediger ' + username;
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function closeAddUserModal() {
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

function updateUserDisplay() {
    const display = document.getElementById('currentUserDisplay');
    if (display) display.textContent = window.currentUser || 'Ingen';
    const welcomeName = document.getElementById('welcomeUserName');
    if (welcomeName) welcomeName.textContent = window.currentUser || 'Bruker';
    const offcanvasName = document.getElementById('offcanvasUserName');
    if (offcanvasName) offcanvasName.textContent = window.currentUser || 'Bruker';
}



// Checklist Management
function addNewMedicineToChecklist() {
    const name = document.getElementById('newMedicineName').value.trim();
    const dose = document.getElementById('newMedicineDose').value.trim();
    const timeInput = document.getElementById('newMedicineTime')?.value || '';
    const categoryRadio = document.querySelector('input[name="medicineCategory"]:checked');
    const category = categoryRadio ? categoryRadio.value : 'prn';
    
    if (!name) { showToast('⚠️ Vennligst fyll inn medisinnavn'); return; }
    
    // Check exists
    if (window.checklistItems.medicines.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        showToast('⚠️ Denne medisinen finnes allerede'); return;
    }
    
    let unit = '';
    const doseMatch = dose.match(/([\d.,]+)\s*(.*)/);
    if (doseMatch && doseMatch[2]) unit = doseMatch[2];
    
    const times = timeInput ? [timeInput] : [];
    
    if (category === 'both') {
        window.checklistItems.medicines.push({ name, dose, unit, category: 'dag', times: times.length ? times : ['08:00'], description: 'Egendefinert', isCustom: true });
        window.checklistItems.medicines.push({ name, dose, unit, category: 'kveld', times: ['20:00'], description: 'Egendefinert', isCustom: true });
    } else {
        window.checklistItems.medicines.push({ name, dose, unit, category, times, description: 'Egendefinert', isCustom: true });
    }
    
    if (typeof saveChecklistToFirestore === 'function') saveChecklistToFirestore(window.checklistItems);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMedicineModal'));
    if (modal) modal.hide();
    document.getElementById('newMedicineName').value = '';
    document.getElementById('newMedicineDose').value = '';
    displayChecklist();
    showToast(`✅ ${name} lagt til!`);
}

function addNewSondematToChecklist() {
    const name = document.getElementById('newSondematName').value.trim();
    const amount = document.getElementById('newSondematAmount').value.trim();
    
    if (!name) { showToast('⚠️ Vennligst fyll inn sondematenavn'); return; }
    
    if (window.checklistItems.sonde.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showToast('⚠️ Denne sondematen finnes allerede'); return;
    }
    
    let unit = 'ml';
    const amountMatch = amount.match(/([\d.,]+)\s*(.*)/);
    if (amountMatch && amountMatch[2]) unit = amountMatch[2];
    
    window.checklistItems.sonde.push({ name, dose: amount, unit, category: 'dag', times: [], description: 'Egendefinert' });
    
    if (typeof saveChecklistToFirestore === 'function') saveChecklistToFirestore(window.checklistItems);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addSondematModal'));
    if (modal) modal.hide();
    document.getElementById('newSondematName').value = '';
    document.getElementById('newSondematAmount').value = '';
    displayChecklist();
    showToast(`✅ ${name} lagt til!`);
}

function deleteMedicineFromChecklist(medicineName, category) {
    if (!confirm(`Slette "${medicineName}"?`)) return;
    
    const beforeCount = window.checklistItems.medicines.length;
    window.checklistItems.medicines = window.checklistItems.medicines.filter(m => !(m.name === medicineName && m.category === category));
    
    if (window.checklistItems.medicines.length < beforeCount) {
        if (typeof saveChecklistToFirestore === 'function') saveChecklistToFirestore(window.checklistItems);
        displayChecklist();
        showToast(`✓ Slettet`);
    }
}

// Dark Mode Handling
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    // Check saved preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply initial state
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        toggle.checked = true;
    }

    // Add event listener
    toggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// Initialize Dark Mode
document.addEventListener('DOMContentLoaded', initDarkMode);
// Try immediately as well since script is at end of body
initDarkMode();


