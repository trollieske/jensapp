// Custom Dosing Plan Management

// Add doctor's complete plan
function addDoctorPlan() {
    if (!confirm('Dette vil legge til alle medisiner fra legens plan med anbefalte tidspunkter. Fortsette?')) {
        return;
    }
    
    const doctorPlan = [
        { name: 'Bactrim morgen', time: '08:00' },
        { name: 'Bactrim kveld', time: '20:00' },
        { name: 'Nycoplus Multi Barn', time: '08:00' },
        { name: 'Nexium', time: '08:00' },
        { name: 'Zyprexa', time: '18:00' },
        { name: 'Emend', time: '08:00' },
        { name: 'Deksklorfeniramin morgen', time: '08:00' },
        { name: 'Deksklorfeniramin middag', time: '14:00' },
        { name: 'Deksklorfeniramin kveld', time: '20:00' },
        { name: 'Nutrini peptisorb', time: '08:00' }
    ];
    
    let added = 0;
    doctorPlan.forEach(reminder => {
        const exists = reminders.some(r => r.name === reminder.name && r.time === reminder.time);
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
    
    window.allMedicines = [
        { name: 'Bactrim', default: '08:00' },
        { name: 'Nycoplus Multi Barn', default: '08:00' },
        { name: 'Nexium', default: '08:00' },
        { name: 'Zyprexa', default: '18:00' },
        { name: 'Emend', default: '08:00' },
        { name: 'Paracetamol', default: '10:00' },
        { name: 'Movicol', default: '08:00' },
        { name: 'Deksklorfeniramin', default: '08:00' },
        { name: 'Nutrini peptisorb', default: '08:00' }
    ];
    
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
    
    // Save plan to localStorage (could be Firestore in future)
    const customPlans = JSON.parse(localStorage.getItem('customPlans') || '[]');
    const newPlan = {
        id: Date.now(),
        name: planName,
        medicines: selectedMedicines,
        createdBy: currentUser || 'Unknown',
        createdAt: new Date().toISOString()
    };
    
    customPlans.push(newPlan);
    localStorage.setItem('customPlans', JSON.stringify(customPlans));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('customPlanModal')).hide();
    
    // Refresh custom plan list
    displayCustomPlans();
    
    // Ask if user wants to download calendar
    if (confirm('✅ Plan lagret! Vil du laste ned en kalender (.ics) med denne doseringsplanen?')) {
        downloadPlanAsCalendar(newPlan);
    }
    
    showToast(`✓ Plan "${planName}" opprettet!`);
}

// Display custom plans
function displayCustomPlans() {
    const container = document.getElementById('customPlanList');
    const customPlans = JSON.parse(localStorage.getItem('customPlans') || '[]');
    
    if (customPlans.length === 0) {
        container.innerHTML = `
            <div class="alert alert-secondary">
                <strong>Ingen egendefinerte planer ennå</strong><br>
                Klikk "Ny plan" for å lage en tilpasset doseringsplan.
            </div>
        `;
        return;
    }
    
    container.innerHTML = customPlans.map(plan => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-2">${plan.name}</h6>
                        <small class="text-muted">
                            ${plan.medicines.length} medisiner • Opprettet av ${plan.createdBy}
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-success" onclick="activatePlan(${plan.id})" title="Aktiver plan">
                            ⚡ Aktiver
                        </button>
                        <button class="btn btn-sm btn-info" onclick="downloadPlanAsCalendar(${JSON.stringify(plan).replace(/"/g, '&quot;')})" title="Last ned kalender">
                            📅
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCustomPlan(${plan.id})" title="Slett plan">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Activate a custom plan (add all reminders)
function activatePlan(planId) {
    const customPlans = JSON.parse(localStorage.getItem('customPlans') || '[]');
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
    
    let customPlans = JSON.parse(localStorage.getItem('customPlans') || '[]');
    customPlans = customPlans.filter(p => p.id !== planId);
    localStorage.setItem('customPlans', JSON.stringify(customPlans));
    
    displayCustomPlans();
    showToast('✓ Plan slettet');
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
