/**
 * Statistics & Health Dashboard
 * Handles graphing, health logging (temperature/diary), and inventory
 */

const Statistics = {
    charts: {},

    init: function() {
        console.log('Statistics module initialized');
        // Add event listener for modal open to refresh charts
        const modal = document.getElementById('statisticsModal');
        if (modal) {
            modal.addEventListener('shown.bs.modal', () => {
                this.renderCharts();
                this.renderDiaryFeed();
                this.renderInventory();
            });
        }
        
        // Listen for tab changes
        const inventoryTab = document.querySelector('button[data-bs-target="#stats-inventory"]');
        if (inventoryTab) {
            inventoryTab.addEventListener('shown.bs.tab', () => {
                this.renderInventory();
            });
        }
    },

    open: function() {
        const modal = new bootstrap.Modal(document.getElementById('statisticsModal'));
        modal.show();
    },

    // --- Logging Functions ---

    logTemperature: function() {
        const input = document.getElementById('new-temp-input');
        const temp = parseFloat(input.value);

        if (!temp || temp < 30 || temp > 45) {
            showToast('⚠️ Ugyldig temperatur');
            return;
        }

        const log = {
            id: Date.now(),
            type: 'Vitaler',
            vitalType: 'Temperature',
            value: temp,
            unit: '°C',
            time: new Date().toISOString().slice(0, 16),
            timestamp: Date.now(),
            notes: 'Logget via Helseoversikt'
        };

        this.saveLog(log, () => {
            showToast(`🌡️ Temperatur ${temp}°C lagret`);
            input.value = '';
            // Switch to overview tab
            document.querySelector('[data-bs-target="#stats-overview"]').click();
        });
    },

    logDiary: function() {
        const input = document.getElementById('new-diary-input');
        const text = input.value.trim();

        if (!text) {
            showToast('⚠️ Skriv et notat først');
            return;
        }

        const log = {
            id: Date.now(),
            type: 'Dagbok',
            content: text,
            time: new Date().toISOString().slice(0, 16),
            timestamp: Date.now()
        };

        this.saveLog(log, () => {
            showToast('📝 Dagboknotat lagret');
            input.value = '';
            // Switch to overview tab
            document.querySelector('[data-bs-target="#stats-overview"]').click();
        });
    },

    saveLog: function(log, callback) {
        if (typeof saveLogToFirestore === 'function') {
            saveLogToFirestore(log)
                .then(() => {
                    if (callback) callback();
                    // Data sync will handle UI update via listeners, but we can force chart refresh if needed
                    // setTimeout(() => this.renderCharts(), 1000); 
                })
                .catch(err => {
                    console.error(err);
                    showToast('⚠️ Feil ved lagring');
                });
        } else {
            showToast('⚠️ Firestore ikke tilgjengelig');
        }
    },

    // --- Visualization ---

    renderCharts: function() {
        if (!window.logs) return;

        const days = 7;
        const now = new Date();
        const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        const recentLogs = window.logs.filter(l => new Date(l.time || l.timestamp) >= cutoff);

        this.renderTempChart(recentLogs);
        this.renderEventsChart(recentLogs);
    },

    renderTempChart: function(logs) {
        const ctx = document.getElementById('tempChart').getContext('2d');
        
        // Filter for temperature logs
        // Support both new 'Vitaler' format and potential legacy formats if any
        const temps = logs
            .filter(l => (l.type === 'Vitaler' && l.vitalType === 'Temperature') || (l.type === 'Temperatur'))
            .map(l => ({
                x: new Date(l.time || l.timestamp),
                y: parseFloat(l.value || l.temp)
            }))
            .sort((a, b) => a.x - b.x);

        if (this.charts.temp) this.charts.temp.destroy();

        this.charts.temp = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Temperatur (°C)',
                    data: temps,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#dc3545',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'dd.MM'
                            },
                            tooltipFormat: 'dd.MM HH:mm' // Correct tooltip format
                        },
                        grid: { display: false }
                    },
                    y: {
                        min: 35,
                        max: 42,
                        grid: { borderDash: [5, 5] }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    renderEventsChart: function(logs) {
        const ctx = document.getElementById('eventsChart').getContext('2d');
        
        // Count events by day
        // Categories: Avføring, Oppkast, Sondemat (maybe too frequent?), Anfall
        const categories = ['Avføring', 'Oppkast', 'Anfall'];
        const colors = ['#795548', '#ff9800', '#6f42c1'];
        
        // Initialize data structure: { '2023-10-01': { 'Avføring': 0, ... } }
        const dailyData = {};
        const days = 7;
        const now = new Date();
        
        // Create labels for last 7 days
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = d.toISOString().slice(0, 10);
            dailyData[dateStr] = { 'Avføring': 0, 'Oppkast': 0, 'Anfall': 0 };
            labels.push(d.toLocaleDateString('no-NO', { weekday: 'short' }));
        }

        logs.forEach(l => {
            const dateStr = new Date(l.time || l.timestamp).toISOString().slice(0, 10);
            if (dailyData[dateStr] && categories.includes(l.type)) {
                dailyData[dateStr][l.type]++;
            }
        });

        // Transform to datasets
        const datasets = categories.map((cat, index) => ({
            label: cat,
            data: Object.keys(dailyData).sort().map(date => dailyData[date][cat]),
            backgroundColor: colors[index],
            borderRadius: 4
        }));

        if (this.charts.events) this.charts.events.destroy();

        this.charts.events = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    },

    renderDiaryFeed: function() {
        const container = document.getElementById('diary-feed');
        if (!container || !window.logs) return;

        const diaryEntries = window.logs
            .filter(l => l.type === 'Dagbok')
            .sort((a, b) => new Date(b.time || b.timestamp) - new Date(a.time || a.timestamp));

        if (diaryEntries.length === 0) {
            container.innerHTML = '<div class="text-muted text-center small py-3">Ingen dagboknotater ennå.</div>';
            return;
        }

        container.innerHTML = diaryEntries.map(entry => `
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted fw-bold">
                            ${new Date(entry.time || entry.timestamp).toLocaleString('no-NO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </small>
                        ${entry.loggedBy ? `<span class="badge bg-secondary opacity-50">${entry.loggedBy}</span>` : ''}
                    </div>
                    <p class="mb-0" style="white-space: pre-line;">${entry.content}</p>
                </div>
            </div>
        `).join('');
    },

    renderInventory: function() {
        const container = document.getElementById('inventory-list');
        if (!container || !window.checklistItems || !window.checklistItems.medicines) return;

        const medicines = window.checklistItems.medicines.filter(m => m.stock !== undefined && m.stock !== null);

        if (medicines.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="bg-light rounded-circle d-inline-flex p-3 mb-3">
                        <i class="bi bi-box-seam text-muted fs-1"></i>
                    </div>
                    <p class="text-muted small">Ingen medisiner med lagerstyring.</p>
                    <p class="text-muted x-small">Rediger en medisin i sjekklisten for å aktivere lagerstyring.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = medicines.map((med, index) => {
            const stock = parseInt(med.stock) || 0;
            const threshold = parseInt(med.lowStockThreshold) || 5;
            const isLow = stock <= threshold;
            const statusColor = isLow ? 'danger' : (stock <= threshold * 2 ? 'warning' : 'success');
            const statusIcon = isLow ? 'exclamation-triangle-fill' : 'box-seam';
            
            // Find global index for update
            const globalIndex = window.checklistItems.medicines.indexOf(med);

            return `
            <div class="card border-0 shadow-sm rounded-4 mb-2">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-${statusColor} bg-opacity-10 text-${statusColor} rounded-4 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                <i class="bi bi-${statusIcon} fs-4"></i>
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${med.name}</h6>
                                <div class="small text-muted">${med.dose || ''} ${med.unit || ''}</div>
                                <div class="mt-1">
                                    <span class="badge bg-${statusColor} rounded-pill">
                                        ${stock} igjen
                                    </span>
                                    ${isLow ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill ms-1">Lavt lager!</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-sm btn-outline-primary rounded-3" onclick="Statistics.updateStock(${globalIndex}, 10)">
                                <i class="bi bi-plus-lg"></i> Påfyll
                            </button>
                            <button class="btn btn-sm btn-outline-secondary rounded-3" onclick="Statistics.updateStock(${globalIndex}, -1)">
                                <i class="bi bi-dash-lg"></i> Juster
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    updateStock: function(index, change) {
        const med = window.checklistItems.medicines[index];
        if (!med) return;

        let newStock = (parseInt(med.stock) || 0) + change;
        if (change < 0 && newStock < 0) newStock = 0; // Prevent negative

        // Optional: Prompt for exact amount if "Juster" (change = -1 is placeholder logic, maybe use prompt)
        if (change === -1) {
            const input = prompt(`Juster lagerbeholdning for ${med.name}:`, med.stock);
            if (input === null) return;
            const val = parseInt(input);
            if (isNaN(val) || val < 0) {
                alert('Ugyldig antall');
                return;
            }
            newStock = val;
        } else if (change === 10) {
            // "Påfyll" - maybe ask how much? Defaulting to asking is better
            const input = prompt(`Legg til antall for ${med.name}:`, 10);
             if (input === null) return;
            const val = parseInt(input);
            if (isNaN(val) || val <= 0) {
                alert('Ugyldig antall');
                return;
            }
            newStock = (parseInt(med.stock) || 0) + val;
        }

        med.stock = newStock;

        // Save
        if (typeof saveChecklistItems === 'function') {
            saveChecklistItems(); // Uses app.js wrapper
        } else if (typeof saveChecklistToFirestore === 'function') {
            saveChecklistToFirestore(window.checklistItems);
        }
        
        showToast(`📦 Lager oppdatert: ${med.name} = ${newStock}`);
        this.renderInventory();
    }
};

// Global accessor
window.openStatistics = function() {
    Statistics.open();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Statistics.init();
});
