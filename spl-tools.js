/**
 * SplTools - Sykepleierverktøy for Dosevakt
 * Inneholder: Dosekalkulator, Interaksjonssjekk, Vitaler, Trender, Kamera
 */

class SplTools {
    constructor() {
        // API Stubs / Services
        this.api = {
            // Mock Felleskatalogen/FDA lookup
            lookupMedicine: async (query) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const mockDb = [
                            { name: 'Paracet 500mg', type: 'Smertestillende' },
                            { name: 'Ibux 400mg', type: 'Betennelsesdempende' },
                            { name: 'Nexium 20mg', type: 'Syrehemmende' },
                            { name: 'Zyrtec 10mg', type: 'Allergimedisin' },
                            { name: 'Metoprolol 50mg', type: 'Blodtrykk' }
                        ];
                        // Return random or matching
                        const match = mockDb.find(m => m.name.toLowerCase().includes(query.toLowerCase())) || 
                                     mockDb[Math.floor(Math.random() * mockDb.length)];
                        resolve(match);
                    }, 1500); // Simulate network delay
                });
            },

            // Mock Interaction Service
            checkInteractions: async (medList) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const rules = [
                            { pair: ['paracet', 'ibux'], severity: 'medium', title: 'Økt risiko for bivirkninger', desc: 'Samtidig bruk kan øke risiko for mageplager.' },
                            { pair: ['marevan', 'ibux'], severity: 'high', title: 'Blødningsfare', desc: 'Kombinasjonen øker risikoen for blødninger betydelig.' },
                            { pair: ['sobril', 'cosylan'], severity: 'high', title: 'Økt sedasjon', desc: 'Fare for respirasjonshemming.' }
                        ];
                        
                        const findings = [];
                        const meds = medList.map(m => m.toLowerCase());
                        
                        // O(n^2) check
                        for (let i = 0; i < meds.length; i++) {
                            for (let j = i + 1; j < meds.length; j++) {
                                const m1 = meds[i];
                                const m2 = meds[j];
                                const rule = rules.find(r => r.pair.includes(m1) && r.pair.includes(m2));
                                if (rule) {
                                    findings.push({ ...rule, pair: `${m1} + ${m2}` });
                                }
                            }
                        }
                        resolve(findings);
                    }, 1200);
                });
            }
        };

        this.init();
    }

    init() {
        console.log("SplTools initializing...");
        this.setupEventListeners();
        
        // Listen for tab activation to refresh data
        const interactionsTab = document.getElementById('interactions-tab');
        if (interactionsTab) {
            interactionsTab.addEventListener('shown.bs.tab', () => this.loadActiveMeds());
        }
        const vitalsTab = document.getElementById('vitals-tab');
        if (vitalsTab) {
            vitalsTab.addEventListener('shown.bs.tab', () => this.loadActiveMeds());
        }
        const trendsTab = document.getElementById('trends-tab');
        if (trendsTab) {
            trendsTab.addEventListener('shown.bs.tab', () => this.initTrends());
        }
        const scanTab = document.getElementById('scan-tab');
        if (scanTab) {
            scanTab.addEventListener('shown.bs.tab', () => this.initScan());
        }
    }

    setupEventListeners() {
        // Dosekalkulator events
        const calcBtn = document.getElementById('calc-dose-btn');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => this.calculateDose());
        }
    }

    /**
     * 1. Dosekalkulator (mg/kg)
     */
    calculateDose() {
        const weight = parseFloat(document.getElementById('calc-weight').value);
        const doseBase = parseFloat(document.getElementById('calc-dose-base').value);
        const doseType = document.querySelector('input[name="doseType"]:checked').value; // 'per_dose' or 'per_day'
        const dosesPerDay = parseInt(document.getElementById('calc-doses-per-day').value) || 1;
        const maxDose = parseFloat(document.getElementById('calc-max-dose').value) || Infinity;
        const concentration = parseFloat(document.getElementById('calc-concentration').value); // mg/ml (optional)

        if (!weight || !doseBase) {
            alert("Vennligst fyll inn vekt og dosering.");
            return;
        }

        let totalDailyMg = 0;
        let mgPerDose = 0;

        if (doseType === 'per_day') {
            totalDailyMg = weight * doseBase;
            mgPerDose = totalDailyMg / dosesPerDay;
        } else {
            // per_dose
            mgPerDose = weight * doseBase;
            totalDailyMg = mgPerDose * dosesPerDay;
        }

        // Check max dose
        let warning = "";
        if (totalDailyMg > maxDose) {
            warning = `⚠️ Overskrider maks døgndose (${maxDose} mg)!`;
        }

        // Display results
        document.getElementById('res-total-daily').textContent = `${totalDailyMg.toFixed(1)} mg`;
        document.getElementById('res-per-dose').textContent = `${mgPerDose.toFixed(1)} mg`;
        
        // Volume calculation
        if (concentration && concentration > 0) {
            const mlPerDose = mgPerDose / concentration;
            document.getElementById('res-volume').textContent = `${mlPerDose.toFixed(1)} ml`;
            document.getElementById('res-volume-container').classList.remove('hidden');
        } else {
            document.getElementById('res-volume-container').classList.add('hidden');
        }

        document.getElementById('calc-warning').textContent = warning;
        document.getElementById('calc-results').classList.remove('hidden');
    }

    /**
     * 2. Interaksjonssjekk
     */
    loadActiveMeds() {
        const listContainer = document.getElementById('active-meds-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        const meds = this.getActiveMedicines();

        if (meds.length === 0) {
            listContainer.innerHTML = '<span class="text-muted small">Ingen aktive medisiner funnet.</span>';
            return;
        }

        meds.forEach(med => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-normal px-3 py-2 rounded-pill';
            badge.textContent = med;
            listContainer.appendChild(badge);
        });
    }

    getActiveMedicines() {
        let meds = [];
        // Fetch from window.checklistItems (synced from Firestore)
        if (window.checklistItems && window.checklistItems.medicines) {
            meds = window.checklistItems.medicines.map(m => m.name);
        }
        
        // Add some mock meds if list is empty for testing
        if (meds.length === 0) {
            console.log("No meds found, using mock data for demo");
            meds = ['Ibux', 'Paracet', 'Neurontin']; 
        }

        return meds;
    }

    async checkInteractions() {
        const meds = this.getActiveMedicines();
        const resultsContainer = document.getElementById('interaction-results');
        resultsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted small">Analyserer interaksjoner...</p></div>';

        if (meds.length < 2) {
            resultsContainer.innerHTML = `
                <div class="alert alert-info rounded-4 border-0 shadow-sm">
                    <i class="bi bi-info-circle me-2"></i>Minst to medisiner trengs for å sjekke interaksjoner.
                </div>`;
            return;
        }

        try {
            const foundInteractions = await this.api.checkInteractions(meds);

            if (foundInteractions.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-success rounded-4 border-0 shadow-sm">
                        <i class="bi bi-check-circle me-2"></i>Ingen kjente interaksjoner funnet.
                    </div>`;
            } else {
                resultsContainer.innerHTML = ''; // Clear loading
                foundInteractions.forEach(item => {
                    const alertClass = item.severity === 'high' ? 'alert-danger' : 'alert-warning';
                    const icon = item.severity === 'high' ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill';
                    
                    const html = `
                        <div class="alert ${alertClass} rounded-4 border-0 shadow-sm">
                            <div class="d-flex align-items-center mb-2">
                                <i class="bi ${icon} fs-4 me-3"></i>
                                <div>
                                    <h6 class="fw-bold mb-0">${item.title}</h6>
                                    <small class="fw-bold opacity-75">${item.pair}</small>
                                </div>
                            </div>
                            <p class="mb-0 small">${item.desc}</p>
                        </div>
                    `;
                    resultsContainer.insertAdjacentHTML('beforeend', html);
                });
            }
        } catch (err) {
            resultsContainer.innerHTML = `<div class="alert alert-danger">Feil ved analyse: ${err.message}</div>`;
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 3. Vitalparameter-logging
     */
    saveVitals() {
        const sys = document.getElementById('vital-sys').value;
        const dia = document.getElementById('vital-dia').value;
        const pulse = document.getElementById('vital-pulse').value;
        const temp = document.getElementById('vital-temp').value;
        const spo2 = document.getElementById('vital-spo2').value;
        const notes = document.getElementById('vital-notes').value;
        
        const medSelect = document.getElementById('vital-med-select');
        const medName = medSelect ? medSelect.value : '';
        
        const contextEl = document.querySelector('input[name="vitalContext"]:checked');
        const context = contextEl ? contextEl.value : 'none';

        // Basic validation
        if (!sys && !pulse && !temp && !spo2 && !notes) {
            alert("Vennligst fyll ut minst én verdi.");
            return;
        }

        const vitalsLog = {
            id: Date.now(),
            type: 'Vitaler',
            time: new Date().toISOString(),
            sys, dia, pulse, temp, spo2,
            notes,
            medication: medName,
            context: context
        };

        // Reuse existing saveLogToFirestore if available
        if (typeof saveLogToFirestore === 'function') {
            saveLogToFirestore(vitalsLog)
                .then(() => {
                    alert("Vitaler lagret!");
                    document.getElementById('vitals-form').reset();
                })
                .catch(err => alert("Feil ved lagring: " + err.message));
        } else {
            console.log("Mock save:", vitalsLog);
            alert("Vitaler lagret (Simulert)!");
        }
    }

    /**
     * 4. Trend-analyse
     */
    initTrends() {
        this.trendPeriod = 7; // days
        this.trendType = 'meds'; // 'meds' or 'vitals'
        this.renderTrends();
    }

    updateTrendPeriod(days, element) {
        this.trendPeriod = days;
        // Update active dropdown item
        const dropdown = element.closest('.dropdown-menu');
        dropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        
        // Update dropdown button text
        const btn = element.closest('.dropdown').querySelector('.dropdown-toggle');
        btn.textContent = element.textContent;

        this.renderTrends();
    }

    updateTrendType(type) {
        this.trendType = type;
        this.renderTrends();
    }

    renderTrends() {
        const container = document.getElementById('trend-chart-container');
        const statsContainer = document.getElementById('trend-stats');
        if (!container || !statsContainer) return;

        container.innerHTML = '';
        
        // 1. Filter Data
        const now = new Date();
        const cutoff = new Date(now.getTime() - (this.trendPeriod * 24 * 60 * 60 * 1000));
        
        const logs = (window.logs || []).filter(log => {
            const logTime = new Date(log.time || log.timestamp);
            return logTime >= cutoff && logTime <= now;
        });

        let dataPoints = [];

        if (this.trendType === 'meds') {
            // Aggregate by day
            const dailyCounts = {};
            // Initialize all days with 0
            for (let i = 0; i < this.trendPeriod; i++) {
                const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
                const dayStr = d.toISOString().slice(0, 10); // YYYY-MM-DD for sorting
                dailyCounts[dayStr] = 0;
            }

            logs.filter(l => l.type === 'Medisin').forEach(l => {
                const dayStr = new Date(l.time || l.timestamp).toISOString().slice(0, 10);
                if (dailyCounts.hasOwnProperty(dayStr)) {
                    dailyCounts[dayStr]++;
                }
            });
            
            dataPoints = Object.entries(dailyCounts)
                .map(([dateIso, count]) => {
                    const d = new Date(dateIso);
                    return { 
                        date: d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' }),
                        value: count,
                        ts: d.getTime()
                    };
                })
                .sort((a, b) => a.ts - b.ts);
        } else {
            // Vitals (Pulse for demo)
            const vitals = logs.filter(l => l.type === 'Vitaler' && l.pulse);
            dataPoints = vitals.map(l => {
                const d = new Date(l.time || l.timestamp);
                return {
                    date: d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' }),
                    value: parseInt(l.pulse),
                    ts: d.getTime()
                };
            }).sort((a, b) => a.ts - b.ts);
        }

        if (dataPoints.length === 0) {
            container.innerHTML = '<div class="text-center w-100 text-muted align-self-center">Ingen data for perioden</div>';
            statsContainer.innerHTML = '-';
            return;
        }

        // 2. Render SVG Chart (Simple Bar Chart)
        const maxVal = Math.max(...dataPoints.map(d => d.value), 5); // Min max 5
        const height = 200;
        const width = container.offsetWidth || 300; // Fallback width
        const barWidth = (width / dataPoints.length) * 0.6;
        const gap = (width / dataPoints.length) * 0.4;

        let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible;">`;
        
        // Grid lines
        svg += `<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#ccc" stroke-width="1" />`;
        svg += `<line x1="0" y1="0" x2="${width}" y2="0" stroke="#eee" stroke-width="1" stroke-dasharray="4" />`;
        
        dataPoints.forEach((d, i) => {
            const barHeight = (d.value / maxVal) * (height - 30); // Leave space for labels
            const x = i * (width / dataPoints.length) + gap/2;
            const y = height - barHeight;
            const color = this.trendType === 'meds' ? 'var(--bs-primary)' : 'var(--bs-danger)';
            
            // Bar
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2" opacity="0.8" />`;
            
            // Value label
            if (d.value > 0) {
                svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#666" font-weight="bold">${d.value}</text>`;
            }
            
            // Date label (show every nth label to avoid crowding)
            const showLabel = dataPoints.length <= 7 || i % Math.ceil(dataPoints.length / 7) === 0;
            if (showLabel) {
                 svg += `<text x="${x + barWidth/2}" y="${height + 15}" text-anchor="middle" font-size="10" fill="#999">${d.date}</text>`;
            }
        });

        svg += `</svg>`;
        container.innerHTML = svg;

        // 3. Update Stats
        const total = dataPoints.reduce((sum, d) => sum + d.value, 0);
        const avg = dataPoints.length ? (total / dataPoints.length).toFixed(1) : 0;
        const label = this.trendType === 'meds' ? 'Doser' : 'Slag/min';
        
        statsContainer.innerHTML = `
            <div><strong class="d-block fs-5">${total}</strong><span class="text-uppercase small text-muted">Totalt</span></div>
            <div><strong class="d-block fs-5">${avg}</strong><span class="text-uppercase small text-muted">Snitt</span></div>
            <div><strong class="d-block fs-5">${maxVal}</strong><span class="text-uppercase small text-muted">Maks</span></div>
        `;
    }

    /**
     * 5. Kamerafunksjon
     */
    initScan() {
        this.videoElement = document.getElementById('camera-stream');
        if (this.videoElement && !this.cameraActive) {
            this.startCamera();
        }
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.videoElement.srcObject = stream;
            this.cameraActive = true;
        } catch (err) {
            console.error("Camera error:", err);
            const container = this.videoElement.parentElement;
            container.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-white p-3 text-center"><p>Kunne ikke starte kamera.<br>Sjekk at du har gitt tillatelse.</p></div>';
        }
    }

    async captureImage() {
        if (!this.cameraActive) return;

        // Visual feedback
        this.videoElement.style.opacity = "0.5";
        setTimeout(() => this.videoElement.style.opacity = "1", 200);

        // Show processing state
        const resultContainer = document.getElementById('scan-result');
        const matchName = document.getElementById('scan-match-name');
        
        resultContainer.classList.add('hidden');
        
        // Simulate scanning logic (OCR/Barcode)
        // In a real app, we would grab a frame from the video stream here
        
        try {
            // Mock extracting text/barcode -> "Paracet"
            // Using API stub
            const result = await this.api.lookupMedicine("Paracet"); // Simulate finding something
            
            if (result) {
                matchName.textContent = result.name;
                document.getElementById('scan-match-type').textContent = result.type; // Assuming we add this span
                resultContainer.classList.remove('hidden');
            }
        } catch (err) {
            console.error("Scan error:", err);
            alert("Kunne ikke identifisere medisin.");
        }
    }

    addScannedMed() {
        const name = document.getElementById('scan-match-name').textContent;
        
        if (!window.checklistItems) window.checklistItems = {};
        if (!window.checklistItems.medicines) window.checklistItems.medicines = [];
        
        const newMed = {
            name: name,
            dose: '1', // Default placeholder
            unit: 'stk',
            category: 'dag',
            times: ['08:00'],
            description: 'Lagt til via skanner',
            isCustom: true
        };
        
        window.checklistItems.medicines.push(newMed);
        
        if (typeof saveChecklistItems === 'function') {
            saveChecklistItems();
            alert(`Lagret ${name} i medisinlisten!`);
        } else {
            console.log("Mock save med:", newMed);
            alert(`La til ${name} i medisinlisten (Simulert)`);
        }
        
        document.getElementById('scan-result').classList.add('hidden');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.splTools = new SplTools();
});
