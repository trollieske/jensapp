// timers.js - Advanced Timer Functionality for Dosevakt
// Phase 1: Basic Timer & Persistence

let timers = [];
let presets = [];
const TIMER_STORAGE_KEY = 'dosevakt_timers';
const PRESET_STORAGE_KEY = 'dosevakt_timer_presets';

// Web Worker for background stability
let timerWorker = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTimers();
    loadPresets();
    
    // Initialize Web Worker
    if (window.Worker) {
        timerWorker = new Worker('timer-worker.js');
        timerWorker.onmessage = function(e) {
            if (e.data === 'tick') {
                updateTimerLoop();
            }
        };
        timerWorker.postMessage('start');
    } else {
        // Fallback for browsers without Worker support
        setInterval(updateTimerLoop, 1000);
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
        // We don't ask immediately on load to avoid annoyance, 
        // but we'll ask when adding the first timer.
    }
});

function loadTimers() {
    try {
        const stored = localStorage.getItem(TIMER_STORAGE_KEY);
        if (stored) {
            timers = JSON.parse(stored);
            // Cleanup: Remove invalid timers or fix states if needed
        }
    } catch (e) {
        console.error('Failed to load timers', e);
        timers = [];
    }
    renderTimers();
}

function saveTimers() {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
}

function loadPresets() {
    try {
        const stored = localStorage.getItem(PRESET_STORAGE_KEY);
        if (stored) {
            presets = JSON.parse(stored);
        } else {
            // Default presets if none exist
            presets = [
                { name: 'Paracet IV', minutes: '15', volume: '50', alarmBefore: 2 },
                { name: 'Antibiotika', minutes: '30', volume: '100', alarmBefore: 5 },
                { name: 'Væske (Rask)', minutes: '60', volume: '1000', alarmBefore: 10 },
                { name: 'Væske (Vedlikehold)', minutes: '240', volume: '1000', alarmBefore: 15 },
                { name: 'Sondemat (Bolus)', minutes: '20', volume: '200', alarmBefore: 2 },
                { name: 'Ernæring (Natt)', minutes: '720', volume: '500', alarmBefore: 30 }
            ];
            savePresets();
        }
    } catch (e) {
        console.error('Failed to load presets', e);
        presets = [];
    }
    renderPresets();
}

function savePresets() {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    renderPresets();
}

function deletePreset(index) {
    if (confirm('Slette denne malen?')) {
        presets.splice(index, 1);
        savePresets();
    }
}

// Create a new timer
function createTimer(name, minutes, volume, alarmBefore = 0, saveAsPreset = false) {
    if (!name || !minutes) {
        showToast('⚠️ Fyll ut navn og tid');
        return;
    }

    const durationSec = Math.round(parseFloat(minutes) * 60);
    const now = Date.now();
    const endTime = new Date(now + durationSec * 1000).toISOString();
    
    // Calculate flowrate if volume is provided (ml/hr)
    // minutes / 60 = hours
    const flowRate = volume ? (parseFloat(volume) / (parseFloat(minutes) / 60)).toFixed(1) : null;
    
    if (saveAsPreset) {
        presets.push({
            name,
            minutes,
            volume,
            alarmBefore
        });
        savePresets();
    }

    const timer = {
        id: Date.now().toString(),
        name,
        totalDuration: durationSec,
        initialVolume: volume ? parseFloat(volume) : null,
        flowRate: flowRate,
        endTime: endTime,
        alarmBefore: parseInt(alarmBefore) || 0, // Minutes before end to notify
        remainingWhenPaused: null,
        status: 'running',
        notified: false,
        preAlarmNotified: false,
        createdAt: new Date().toISOString()
    };
    
    timers.push(timer);
    saveTimers();
    renderTimers();
    
    // Switch to timers tab
    const timersTab = document.getElementById('timers-tab');
    if (timersTab) timersTab.click();
    
    // Request permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    showToast(`✅ Timer "${name}" startet`);
    
    // Close modal if open
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTimerModal'));
    if (modal) modal.hide();
    
    // Reset form
    document.getElementById('newTimerForm').reset();
    // Reset range input and display if they exist
    const alarmRange = document.getElementById('alarmBeforeRange');
    if (alarmRange) {
        alarmRange.value = 0;
        document.getElementById('alarmBeforeValue').textContent = '0 min';
    }
}

function deleteTimer(id) {
    if (confirm('Slette denne timeren?')) {
        timers = timers.filter(t => t.id !== id);
        saveTimers();
        renderTimers();
    }
}

function toggleTimerPause(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    if (timer.status === 'running') {
        // Pause
        timer.status = 'paused';
        timer.remainingWhenPaused = getRemainingSeconds(timer);
        timer.endTime = null;
    } else if (timer.status === 'paused') {
        // Resume
        timer.status = 'running';
        const now = Date.now();
        timer.endTime = new Date(now + timer.remainingWhenPaused * 1000).toISOString();
        timer.remainingWhenPaused = null;
    }
    
    saveTimers();
    renderTimers();
}

function getRemainingSeconds(timer) {
    if (timer.status === 'paused') {
        return timer.remainingWhenPaused;
    }
    if (timer.status === 'completed') {
        return 0;
    }
    
    const end = new Date(timer.endTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / 1000));
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerLoop() {
    let changed = false;
    const now = Date.now();
    
    timers.forEach(timer => {
        if (timer.status === 'running') {
            const end = new Date(timer.endTime).getTime();
            const remainingSec = Math.ceil((end - now) / 1000);
            
            // Check for pre-alarm
            if (timer.alarmBefore > 0 && !timer.preAlarmNotified) {
                if (remainingSec <= timer.alarmBefore * 60 && remainingSec > 0) {
                    notifyTimerPreAlarm(timer);
                    timer.preAlarmNotified = true;
                    changed = true;
                }
            }

            if (now >= end) {
                timer.status = 'completed';
                changed = true;
                if (!timer.notified) {
                    notifyTimerFinished(timer);
                    timer.notified = true;
                }
            }
        }
    });
    
    if (changed) {
        saveTimers();
    }
    // Only re-render if visible or if state changed? 
    // For smooth countdown, we should re-render active timers every second.
    // To save performance, we can check if the timers tab is active.
    const timersTab = document.getElementById('timers');
    if (timersTab && timersTab.classList.contains('active') || changed) {
        renderTimers();
    }
    
    // Update badge count
    updateTimerBadge();
}

function notifyTimerPreAlarm(timer) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('Dosevakt Timer', {
                body: `Snart ferdig: ${timer.name} (${timer.alarmBefore} min igjen)`,
                icon: './icon-192.png',
                vibrate: [100, 50, 100]
            });
        } catch (e) {
            console.error('Notification failed', e);
        }
    }
}

function notifyTimerFinished(timer) {
    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            // Mobile devices often require a service worker for notifications, 
            // but let's try standard API first.
            new Notification('Dosevakt Timer', {
                body: `Tiden er ute for: ${timer.name}`,
                icon: './icon-192.png',
                vibrate: [200, 100, 200]
            });
        } catch (e) {
            console.error('Notification failed', e);
        }
    }
    
    // In-app Toast
    // showToast(`⏰ Tiden er ute: ${timer.name}`); 
    // ^ Maybe too transient. A modal or alert might be better, but let's stick to UI update + sound.
    
    // Play sound (if interaction allows)
    // const audio = new Audio('path/to/alert.mp3');
    // audio.play().catch(e => console.log('Audio autoplay blocked'));
}

function updateTimerBadge() {
    const activeCount = timers.filter(t => t.status === 'running').length;
    const badge = document.getElementById('activeTimersBadge');
    if (badge) {
        badge.textContent = activeCount > 0 ? activeCount : '';
        badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
    
    // Also update the menu badge if it exists
    const menuBadge = document.getElementById('menuTimersBadge');
    if (menuBadge) {
        menuBadge.textContent = activeCount;
        menuBadge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
}

function renderTimers() {
    const container = document.getElementById('activeTimersList');
    if (!container) return; // Tab might not be rendered yet
    
    container.innerHTML = '';
    
    if (timers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-stopwatch fs-1 d-block mb-3 opacity-50"></i>
                <p>Ingen aktive timere</p>
                <button class="btn btn-primary rounded-pill px-4" data-bs-toggle="modal" data-bs-target="#addTimerModal">
                    Start ny timer
                </button>
            </div>
        `;
        return;
    }
    
    // Sort: Running first, then Paused, then Completed
    const sortedTimers = [...timers].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return 0;
    });

    sortedTimers.forEach(timer => {
        const remaining = getRemainingSeconds(timer);
        const progress = Math.min(100, ((timer.totalDuration - remaining) / timer.totalDuration) * 100);
        
        // Calculate remaining volume info if applicable
        let volumeInfo = '';
        if (timer.initialVolume) {
            const remainingVol = (remaining / timer.totalDuration * timer.initialVolume).toFixed(0);
            volumeInfo = `
                <div class="d-flex align-items-center mt-1" style="font-size: 0.85rem; color: var(--text-secondary);">
                    <span class="d-flex align-items-center me-3">
                        <i class="bi bi-droplet-half text-info me-1"></i>
                        ${remainingVol} ml igjen
                    </span>
                    <span class="badge bg-light text-dark border">
                        ${timer.flowRate} ml/t
                    </span>
                </div>
            `;
        }
        
        const el = document.createElement('div');
        el.className = `card border-0 shadow-sm mb-3 overflow-hidden ${timer.status === 'completed' ? 'bg-danger bg-opacity-10' : ''}`;
        
        let statusIcon = 'bi-play-circle-fill';
        let statusColor = 'text-primary';
        let actionBtn = `
            <button class="btn btn-light text-primary rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" 
                    style="width: 42px; height: 42px;" onclick="toggleTimerPause('${timer.id}')">
                <i class="bi bi-pause-fill fs-4"></i>
            </button>
        `;
        
        if (timer.status === 'paused') {
            statusIcon = 'bi-pause-circle-fill';
            statusColor = 'text-warning';
            actionBtn = `
                <button class="btn btn-primary rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" 
                        style="width: 42px; height: 42px;" onclick="toggleTimerPause('${timer.id}')">
                    <i class="bi bi-play-fill fs-4"></i>
                </button>
            `;
        } else if (timer.status === 'completed') {
            statusIcon = 'bi-exclamation-circle-fill';
            statusColor = 'text-danger';
            actionBtn = `
                <button class="btn btn-danger text-white rounded-pill px-3 py-2 shadow-sm" onclick="deleteTimer('${timer.id}')">
                    Avslutt
                </button>
            `;
        }

        el.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex flex-column">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi ${statusIcon} ${statusColor} fs-5"></i>
                            <h6 class="mb-0 fw-bold text-dark">${timer.name}</h6>
                        </div>
                        ${volumeInfo}
                    </div>
                    <div class="fw-bold font-monospace fs-4 ${timer.status === 'completed' ? 'text-danger blink' : 'text-dark'}">
                        ${formatDuration(remaining)}
                    </div>
                </div>
                
                <div class="progress" style="height: 6px; background-color: #e9ecef; border-radius: 3px;">
                    <div class="progress-bar ${timer.status === 'completed' ? 'bg-danger' : 'bg-primary'}" 
                         role="progressbar" 
                         style="width: ${progress}%" 
                         aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <small class="text-muted">
                        ${timer.status === 'running' ? 'Kjører...' : (timer.status === 'paused' ? 'Pauset' : 'Fullført!')}
                    </small>
                    <div class="d-flex gap-2">
                        ${timer.status !== 'completed' ? `
                            <button class="btn btn-light text-danger rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" 
                                    style="width: 42px; height: 42px;" onclick="deleteTimer('${timer.id}')">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        ` : ''}
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(el);
    });
}

function renderPresets() {
    const container = document.getElementById('presetList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (presets.length === 0) {
        container.innerHTML = '<div class="text-muted small fst-italic">Ingen lagrede maler</div>';
        return;
    }
    
    presets.forEach((preset, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-secondary btn-sm rounded-pill m-1 d-inline-flex align-items-center gap-2';
        btn.innerHTML = `
            <span>${preset.name} (${preset.minutes}m)</span>
            <i class="bi bi-x-circle-fill text-muted opacity-50" onclick="event.stopPropagation(); deletePreset(${index})"></i>
        `;
        btn.onclick = () => loadPresetIntoForm(preset);
        container.appendChild(btn);
    });
}

function loadPresetIntoForm(preset) {
    document.getElementById('timerName').value = preset.name;
    document.getElementById('timerMinutes').value = preset.minutes;
    document.getElementById('timerVolume').value = preset.volume || '';
    
    const range = document.getElementById('alarmBeforeRange');
    if (range) {
        range.value = preset.alarmBefore || 0;
        document.getElementById('alarmBeforeValue').textContent = (preset.alarmBefore || 0) + ' min';
    }
}
