/**
 * SplTools - Sykepleierverktøy for Dosevakt
 * Inneholder: Dosekalkulator, Interaksjonssjekk, Vitaler, Trender, Kamera
 */

class SplTools {
    constructor() {
        // API Stubs / Services
        this.api = {
            // Real Lookup via Open Food Facts (with fallback and improved translation)
            lookupMedicine: async (query) => {
                // Check if query is barcode (numeric)
                const isBarcode = /^\d+$/.test(query);
                
                if (!isBarcode) {
                    // Simple local search for non-barcode queries
                    const mockDb = [
                        { name: 'Paracet 500mg', type: 'Smertestillende', ean: '7046260001854' },
                        { name: 'Ibux 400mg', type: 'Betennelsesdempende', ean: '7046260001908' },
                        { name: 'Nexium 20mg', type: 'Syrehemmende', ean: '1234567890123' },
                        { name: 'Zyrtec 10mg', type: 'Allergimedisin', ean: '3216549870123' }
                    ];
                    return mockDb.find(m => m.name.toLowerCase().includes(query.toLowerCase()));
                }

                // Try Open Food Facts API for EANs
                try {
                    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${query}.json`);
                    const data = await response.json();

                    if (data.status === 1) {
                        const p = data.product;
                        
                        // Extract name (Prioritize Norwegian)
                        const name = p.product_name_no || p.product_name_nb || p.product_name_nn || p.product_name || `Produkt ${query}`;
                        
                        // Extract and translate category/type
                        let type = 'Ukjent';
                        
                        // 1. Try explicit Norwegian tags
                        if (p.categories_tags && Array.isArray(p.categories_tags)) {
                            const noTag = p.categories_tags.find(t => t.startsWith('no:') || t.startsWith('nb:') || t.startsWith('nn:'));
                            if (noTag) {
                                type = noTag.split(':')[1];
                            } else {
                                // Fallback to first tag (usually English) and translate
                                const enTag = p.categories_tags[0];
                                if (enTag) {
                                    type = enTag.split(':')[1] || enTag;
                                }
                            }
                        } else if (p.categories) {
                            type = p.categories.split(',')[0];
                        }
                        
                        // Clean and translate
                        type = this.translateText(type);

                        return {
                            name: name,
                            type: this.capitalize(type),
                            ean: query,
                            source: 'OpenFoodFacts'
                        };
                    }
                } catch (e) {
                    console.warn("Open Food Facts lookup failed", e);
                }

                // Fallback for specific demo items if API fails or not found (and network is down)
                const fallbackDb = [
                     { name: 'Paracet 500mg', type: 'Smertestillende', ean: '7046260001854' },
                     { name: 'Ibux 400mg', type: 'Betennelsesdempende', ean: '7046260001908' },
                     { name: 'C-Vitaminer', type: 'Kosttilskudd', ean: '7038310001234' }
                ];
                
                const match = fallbackDb.find(m => m.ean === query);
                if (match) return match;

                // Return generic if nothing found
                return { 
                    name: `Ukjent vare (${query})`, 
                    type: 'Ukjent', 
                    ean: query,
                    isUnknown: true 
                };
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

    translateText(text) {
        if (!text) return 'Ukjent';
        
        text = text.toLowerCase().trim().replace(/-/g, ' ');
        
        const dictionary = {
            // Medisiner / Helse
            'medicines': 'medisiner',
            'dietary supplements': 'kosttilskudd',
            'supplements': 'kosttilskudd',
            'vitamins': 'vitaminer',
            'painkillers': 'smertestillende',
            'analgesics': 'smertestillende',
            'anti inflammatory': 'betennelsesdempende',
            'antihistamines': 'allergimedisin',
            'first aid': 'førstehjelp',
            'hygiene': 'hygiene',
            'pharmacy': 'apotekvarer',
            
            // Mat / Drikke (Vanlig i OpenFoodFacts)
            'beverages': 'drikke',
            'snacks': 'snacks',
            'dairies': 'meieriprodukter',
            'meats': 'kjøttvarer',
            'groceries': 'dagligvarer',
            'fresh foods': 'ferskvarer',
            'canned foods': 'hermetikk',
            'plant based foods': 'plantebasert',
            'fruits': 'frukt',
            'vegetables': 'grønnsaker',
            'seafood': 'sjømat',
            'frozen foods': 'frysevarer',
            'breakfasts': 'frokostvarer',
            'cereals': 'frokostblanding',
            'biscuits': 'kjeks',
            'cakes': 'kaker',
            'chocolates': 'sjokolade',
            'salty snacks': 'salt snacks',
            'sweet snacks': 'søt snacks',
            'condiments': 'smakstilsetning',
            'sauces': 'sauser',
            'fats': 'fettkilder',
            'oils': 'oljer',
            
            // Generiske termer
            'unknown': 'ukjent',
            'items': 'varer',
            'products': 'produkter'
        };

        // Direct lookup
        if (dictionary[text]) return dictionary[text];
        
        // Partial match lookup (e.g. "sugary snacks" -> "snacks")
        for (const [eng, nor] of Object.entries(dictionary)) {
            if (text.includes(eng)) return nor;
        }

        return text; // Return original if no translation found
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
     * 5. Kamerafunksjon (QuaggaJS Barcode Scanner)
     */
    initScan() {
        // Only start if not active
        if (this.cameraActive) return;
        this.startScanner();
    }

    startScanner() {
        if (!window.Quagga) {
            console.error("QuaggaJS not loaded");
            return;
        }

        const container = document.getElementById('scanner-container');
        if (!container) return;
        
        // Cleanup any existing videos/canvases
        const existingVideo = container.querySelector('video');
        if (existingVideo) existingVideo.remove();
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) existingCanvas.remove();

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: container, // Use container directly
                constraints: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader"]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error("Quagga init error:", err);
                container.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-white p-3 text-center"><p>Kunne ikke starte skanner.<br>Sjekk at du har gitt tillatelse.</p></div>';
                return;
            }
            console.log("Quagga initialization finished. Ready to start");
            Quagga.start();
            this.cameraActive = true;
            
            // Ensure playsinline for iOS (even though CSS handles size)
            setTimeout(() => {
                const video = container.querySelector('video');
                if (video) {
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('autoplay', 'true');
                    video.setAttribute('muted', 'true');
                    if (video.paused) video.play().catch(e => console.warn(e));
                }
            }, 500);
        });

        Quagga.onDetected((data) => {
            const code = data.codeResult.code;
            if (this.lastScannedCode === code) return; // Simple debounce
            
            this.lastScannedCode = code;
            console.log("Barcode detected:", code);
            
            // Visual feedback
            if (Quagga.canvas && Quagga.canvas.dom.overlay) {
                const drawingCanvas = Quagga.canvas.dom.overlay;
                drawingCanvas.style.border = "4px solid #4CAF50";
                setTimeout(() => drawingCanvas.style.border = "none", 300);
            }

            this.handleScanResult(code);
        });
    }

    startCameraLegacy() {
        // Fallback if Quagga fails to load
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                this.videoElement.srcObject = stream;
                this.cameraActive = true;
            })
            .catch(err => console.error("Camera error:", err));
    }

    async handleScanResult(code) {
        if (this.isProcessingScan) return;
        this.isProcessingScan = true;

        const resultContainer = document.getElementById('scan-result');
        const matchName = document.getElementById('scan-match-name');
        
        try {
            const result = await this.api.lookupMedicine(code);
            
            if (result) {
                matchName.textContent = result.name;
                const typeEl = document.getElementById('scan-match-type');
                if(typeEl) typeEl.textContent = result.type;
                
                resultContainer.classList.remove('hidden');
                
                // Auto-scroll to result
                resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (err) {
            console.error("Lookup error:", err);
        } finally {
            // Allow scanning again after 3 seconds
            setTimeout(() => { 
                this.isProcessingScan = false; 
                this.lastScannedCode = null; // Allow re-scan of same item
            }, 3000); 
        }
    }

    captureImage() {
        // Real Capture Logic
        const container = this.videoElement.parentElement;
        const activeVideo = container.querySelector('video');

        if (!activeVideo || (activeVideo.paused && !activeVideo.srcObject && !activeVideo.src)) {
            alert("Kamera er ikke aktivt.");
            return;
        }

        // Show loading indicator
        const loader = document.getElementById('scan-loading');
        if (loader) loader.classList.remove('d-none');

        const canvas = document.createElement("canvas");
        canvas.width = activeVideo.videoWidth || 640;
        canvas.height = activeVideo.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL("image/png");
        
        // Visual feedback
        activeVideo.style.opacity = "0.5";
        
        Quagga.decodeSingle({
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "code_128_reader"]
            },
            locate: true,
            src: dataURL
        }, (result) => {
            // Restore video and hide loader
            activeVideo.style.opacity = "1";
            if (loader) loader.classList.add('d-none');

            if (result && result.codeResult && result.codeResult.code) {
                console.log("Single decode success:", result.codeResult.code);
                this.handleScanResult(result.codeResult.code);
            } else {
                console.log("No barcode found in snapshot");
                // Ask user if they want to enter manually
                setTimeout(() => {
                    const manual = prompt("Fant ingen strekkode i bildet. Vil du skrive inn EAN manuelt?", "");
                    if (manual) {
                        this.handleScanResult(manual);
                    }
                }, 100);
            }
        });
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
