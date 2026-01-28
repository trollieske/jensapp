// Custom Dosing Plan Management

// Add doctor's complete plan
function addDoctorPlan() {
    if (!confirm('Dette vil legge til alle medisiner fra legens plan med anbefalte tidspunkter. Fortsette?')) {
        return;
    }
    
    const doctorPlan = AppConfig.doctorPlan;
    
    let added = 0;
    doctorPlan.forEach(reminder => {
        const exists = (window.reminders || []).some(r => r.name === reminder.name && r.time === reminder.time);
        if (!exists) {
            addPresetReminder(reminder.name, reminder.time);
            added++;
        }
    });
    
    showToast(`✓ ${added} påminnelser lagt til fra legens plan!`);
}

// Show custom plan builder modal
function showCustomPlanBuilder() {
    const modal = document.getElementById('customPlanModal');
    if (modal) {
        // Reset form
        document.getElementById('customPlanName').value = '';
        buildMedicineTimePicker();
        new bootstrap.Modal(modal).show();
    }
}

// Build medicine time picker dynamically
function buildMedicineTimePicker() {
    const container = document.getElementById('medicineTimePicker');
    
    window.allMedicines = AppConfig.allMedicines;
    
    container.innerHTML = window.allMedicines.map((med, index) => `
        <div class="mb-3">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="med-${index}" value="${med.name}" checked>
                <label class="form-check-label" for="med-${index}">
                    <strong>${med.name}</strong>
                </label>
            </div>
            <div class="ms-4 mt-2">
                <input type="time" class="form-control form-control-sm" id="time-${index}" value="${med.default}" style="width: 120px;">
            </div>
        </div>
    `).join('');
    
    // Clear custom medicines container
    const customContainer = document.getElementById('customMedicineContainer');
    if (customContainer) {
        customContainer.innerHTML = '';
    }
}

// Add custom medicine field
let customMedicineCounter = 0;
function addCustomMedicineField() {
    const container = document.getElementById('customMedicineContainer');
    const id = `custom-med-${customMedicineCounter++}`;
    
    const div = document.createElement('div');
    div.className = 'mb-3 p-3 border rounded';
    div.id = id;
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>Ny medisin</strong>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeCustomMedicineField('${id}')">
                ×
            </button>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control form-control-sm custom-med-name" placeholder="Medisinnavn" required>
        </div>
        <div>
            <input type="time" class="form-control form-control-sm custom-med-time" value="08:00" style="width: 120px;">
        </div>
    `;
    
    container.appendChild(div);
}

function removeCustomMedicineField(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Save custom dosing plan
function saveCustomPlan() {
    const planName = document.getElementById('customPlanName').value.trim();
    if (!planName) {
        showToast('⚠️ Vennligst gi planen et navn');
        return;
    }
    
    const selectedMedicines = [];
    
    // Get standard medicines
    if (window.allMedicines) {
        window.allMedicines.forEach((med, index) => {
            const checkbox = document.getElementById(`med-${index}`);
            const timeInput = document.getElementById(`time-${index}`);
            
            if (checkbox && checkbox.checked && timeInput) {
                selectedMedicines.push({
                    name: med.name,
                    time: timeInput.value
                });
            }
        });
    }
    
    // Get custom medicines
    const customMeds = document.querySelectorAll('#customMedicineContainer > div');
    customMeds.forEach((div) => {
        const nameInput = div.querySelector('.custom-med-name');
        const timeInput = div.querySelector('.custom-med-time');
        
        if (nameInput && timeInput && nameInput.value.trim()) {
            selectedMedicines.push({
                name: nameInput.value.trim(),
                time: timeInput.value
            });
        }
    });
    
    if (selectedMedicines.length === 0) {
        showToast('⚠️ Velg minst én medisin');
        return;
    }
    
    const newPlan = {
        name: planName,
        medicines: selectedMedicines
    };
    
    // Save to Firestore
    saveCustomPlanToFirestore(newPlan)
        .then((docId) => {
            // Close modal
            const modalEl = document.getElementById('customPlanModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            
            showToast(`✓ Plan "${planName}" lagret!`);
            
            // Ask if user wants to download calendar
            newPlan.id = docId;
            if (confirm('✅ Plan lagret! Vil du laste ned en kalender (.ics) med denne doseringsplanen?')) {
                downloadPlanAsCalendar(newPlan);
            }
        })
        .catch(error => {
            console.error("Error saving plan:", error);
            showToast('❌ Kunne ikke lagre planen');
        });
}

// Display custom plans
function displayCustomPlans() {
    const container = document.getElementById('customPlanList');
    const customPlans = window.customPlans || [];
    
    if (customPlans.length === 0) {
        container.innerHTML = `
            <div class="alert alert-secondary text-center p-4">
                <i class="bi bi-clipboard-plus fs-1 text-muted mb-3 d-block"></i>
                <strong>Ingen egendefinerte planer ennå</strong><br>
                <span class="text-muted small">Klikk "Ny plan" for å lage en tilpasset doseringsplan.</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = customPlans.map(plan => `
        <div class="log-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex gap-3 flex-grow-1">
                     <div class="d-flex align-items-center justify-content-center bg-light rounded-circle" style="width: 42px; height: 42px; flex-shrink: 0;">
                        <span style="font-size: 1.2rem;">💊</span>
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #333;">${plan.name}</div>
                        <div style="font-size: 0.8rem; color: #888;">
                            ${plan.medicines.length} medisiner • Opprettet av ${plan.createdBy || 'Ukjent'}
                        </div>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light text-muted border-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                        <li>
                            <a class="dropdown-item py-2" href="#" onclick="activatePlan('${plan.id}')">
                                <i class="bi bi-lightning-charge text-warning me-2"></i>Aktiver plan
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item py-2" href="#" onclick="downloadPlanAsCalendar(${JSON.stringify(plan).replace(/"/g, '&quot;')})">
                                <i class="bi bi-calendar-event text-info me-2"></i>Last ned kalender
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item py-2 text-danger" href="#" onclick="deleteCustomPlan('${plan.id}')">
                                <i class="bi bi-trash me-2"></i>Slett plan
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Activate a custom plan (add all reminders)
function activatePlan(planId) {
    const customPlans = window.customPlans || [];
    const plan = customPlans.find(p => p.id === planId);
    
    if (!plan) {
        showToast('⚠️ Fant ikke planen');
        return;
    }
    
    if (!confirm(`Vil du aktivere planen "${plan.name}"? Dette legger til ${plan.medicines.length} påminnelser.`)) {
        return;
    }
    
    let added = 0;
    plan.medicines.forEach(med => {
        const exists = reminders.some(r => r.name === med.name && r.time === med.time);
        if (!exists) {
            addPresetReminder(med.name, med.time);
            added++;
        }
    });
    
    showToast(`✓ ${added} påminnelser lagt til fra "${plan.name}"!`);
}

// Delete custom plan
function deleteCustomPlan(planId) {
    if (!confirm('Er du sikker på at du vil slette denne planen?')) {
        return;
    }
    
    deleteCustomPlanFromFirestore(planId)
        .then(() => {
            showToast('✓ Plan slettet');
        })
        .catch(error => {
            console.error("Error deleting plan:", error);
            showToast('❌ Kunne ikke slette planen');
        });
}

// Download plan as ICS calendar file
function downloadPlanAsCalendar(plan) {
    if (typeof plan === 'string') {
        plan = JSON.parse(plan);
    }
    
    // Generate ICS file content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dosevakt//Medisinplan//NO
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${plan.name}
X-WR-TIMEZONE:Europe/Oslo
X-WR-CALDESC:Doseringsplan for Jens

`;
    
    // Add recurring events for each medicine
    plan.medicines.forEach((med, index) => {
        const [hours, minutes] = med.time.split(':');
        const now = new Date();
        const dtstart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
        
        const formatDateLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const sec = String(date.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hour}${min}${sec}`;
        };
        
        const formatDateUTC = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        icsContent += `BEGIN:VEVENT
UID:${plan.id}-${index}@dosevakt.app
DTSTAMP:${formatDateUTC(now)}
DTSTART:${formatDateLocal(dtstart)}
RRULE:FREQ=DAILY
SUMMARY:💊 ${med.name}
DESCRIPTION:Medisinering for Jens - ${plan.name}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Påminnelse 15 min før
END:VALARM
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:Tid for medisinering nå!
END:VALARM
END:VEVENT

`;
    });
    
    icsContent += 'END:VCALENDAR';
    
    // Create download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dosevakt-${plan.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('📅 Kalender lastet ned!');
}

// Initialize custom plans on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => displayCustomPlans(), 1000);
});
