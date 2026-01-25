// Medicine Information Database
// Based on Felleskatalogen and medical references

const medicineDatabase = {
    'Bactrim': {
        name: 'Bactrim',
        activeIngredient: 'Sulfametoksazol + Trimetoprim',
        category: 'Antibiotikum',
        indication: 'Brukes mot bakterielle infeksjoner, spesielt urinveisinfeksjoner, luftveisinfeksjoner og for å forebygge infeksjoner hos immunsvekkede pasienter.',
        mechanism: 'Hemmer bakterienes evne til å produsere folsyre, som er nødvendig for deres vekst og formering.',
        sideEffects: ['Kvalme', 'Oppkast', 'Diaré', 'Utslett', 'Hodepine'],
        warnings: 'Drikk rikelig med væske. Unngå langvarig soling. Kan påvirke blodverdier ved langvarig bruk.',
        interaction: 'Kan forsterke effekten av blodfortynnende medisiner.',
        storage: 'Oppbevares ved romtemperatur, beskyttet mot lys.',
        source: 'Felleskatalogen'
    },
    'Nycoplus Multi Barn': {
        name: 'Nycoplus Multi Barn',
        activeIngredient: 'Vitaminer og mineraler',
        category: 'Kosttilskudd',
        indication: 'Multivitamin- og mineraltilskudd for barn. Sikrer tilstrekkelig inntak av essensielle næringsstoffer.',
        mechanism: 'Tilfører kroppen viktige vitaminer og mineraler som er nødvendige for normal vekst og utvikling.',
        sideEffects: ['Sjelden bivirkninger ved anbefalt dose'],
        warnings: 'Ikke overskrid anbefalt dose. Oppbevares utilgjengelig for barn.',
        interaction: 'Ingen kjente klinisk relevante interaksjoner.',
        storage: 'Tørt og kjølig, beskyttet mot lys.',
        source: 'Felleskatalogen'
    },
    'Nexium': {
        name: 'Nexium',
        activeIngredient: 'Esomeprazol',
        category: 'Protonpumpehemmer (PPI)',
        indication: 'Behandler syrerelaterte mageproblemer som halsbrann, sure oppstøt og magesår. Beskytter magen ved bruk av visse medisiner.',
        mechanism: 'Reduserer mengden magesyre ved å hemme protonpumpen i mageslimhinnen.',
        sideEffects: ['Hodepine', 'Magesmerter', 'Kvalme', 'Diaré', 'Forstoppelse'],
        warnings: 'Langvarig bruk kan gi lavt magnesium- og B12-nivå. Tas helst før måltid.',
        interaction: 'Kan påvirke opptak av andre legemidler. Informer lege om andre medisiner.',
        storage: 'Oppbevares ved romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Emend': {
        name: 'Emend',
        activeIngredient: 'Aprepitant',
        category: 'Antiemetikum (NK1-reseptorantagonist)',
        indication: 'Forebygger kvalme og oppkast forårsaket av cellegiftbehandling (kjemoterapi).',
        mechanism: 'Blokkerer substans P (NK1-reseptorer) i hjernens brekningssenter, som reduserer kvalme.',
        sideEffects: ['Hikke', 'Tretthet', 'Forstoppelse', 'Hodepine', 'Appetittløshet'],
        warnings: 'Tas vanligvis 1 time før cellegift. Følg nøye legens instruksjoner for dosering.',
        interaction: 'Kan påvirke effekten av andre legemidler, inkludert p-piller og blodfortynnende.',
        storage: 'Oppbevares ved romtemperatur i original pakning.',
        source: 'Felleskatalogen'
    },
    'Zyprexa': {
        name: 'Zyprexa',
        activeIngredient: 'Olanzapin',
        category: 'Antipsykotikum',
        indication: 'Hos barn med kreft brukes det i lave doser mot kvalme og for å stimulere appetitt. Kan også hjelpe mot angst og søvnproblemer.',
        mechanism: 'Påvirker signalstoffene dopamin og serotonin i hjernen. Ved lave doser har det god effekt mot kvalme.',
        sideEffects: ['Døsighet', 'Vektøkning', 'Økt appetitt', 'Svimmelhet', 'Munntørrhet'],
        warnings: 'Gis om kvelden pga. døsighet. Start med lav dose. Kan øke blodsukkeret.',
        interaction: 'Effekten kan forsterkes av andre beroligende midler.',
        storage: 'Oppbevares ved romtemperatur, beskyttet mot lys og fuktighet.',
        source: 'Felleskatalogen'
    },
    'Palonosetron': {
        name: 'Palonosetron',
        activeIngredient: 'Palonosetron',
        category: 'Antiemetikum (5-HT3-antagonist)',
        indication: 'Forebygger kvalme og oppkast ved cellegiftbehandling. Har lang virketid (gis hver 2.-3. dag).',
        mechanism: 'Blokkerer serotonin (5-HT3) reseptorer i tarmen og hjernen som utløser kvalme.',
        sideEffects: ['Hodepine', 'Forstoppelse', 'Svimmelhet', 'Diaré'],
        warnings: 'Gis vanligvis 30 minutter før cellegift. Lang halveringstid betyr at det gis sjeldnere enn andre kvalmestillende.',
        interaction: 'Bør brukes med forsiktighet sammen med andre medisiner som påvirker hjerterytmen.',
        storage: 'Oppbevares i kjøleskap (2-8°C).',
        source: 'Felleskatalogen'
    },
    'Paracetamol': {
        name: 'Paracetamol',
        activeIngredient: 'Paracetamol',
        category: 'Smertestillende og febernedsettende',
        indication: 'Lindrer mild til moderat smerte og senker feber. Førstevalgsmedisin ved smerter hos barn.',
        mechanism: 'Hemmer prostaglandinsyntesen i sentralnervesystemet, noe som reduserer smerte og feber.',
        sideEffects: ['Sjelden ved riktig dosering', 'Leverskade ved overdose'],
        warnings: '⚠️ VIKTIG: Maks 4 doser per døgn! Minst 4-6 timer mellom dosene. Overdose er farlig for leveren.',
        interaction: 'Forsiktighet ved bruk sammen med andre paracetamol-holdige preparater.',
        storage: 'Oppbevares ved romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Movicol': {
        name: 'Movicol',
        activeIngredient: 'Makrogol + elektrolytter',
        category: 'Avføringsmiddel (osmotisk laksativ)',
        indication: 'Behandler og forebygger forstoppelse. Mykgjør avføringen og gjør det lettere å gå på toalettet.',
        mechanism: 'Binder vann i tarmen slik at avføringen blir mykere og passerer lettere.',
        sideEffects: ['Magesmerter', 'Oppblåsthet', 'Kvalme', 'Diaré ved høy dose'],
        warnings: 'Drikk rikelig med væske. Løs opp pulveret i vann. Effekt innen 1-2 dager.',
        interaction: 'Ingen kjente klinisk relevante interaksjoner.',
        storage: 'Oppbevares tørt ved romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Deksklorfeniramin': {
        name: 'Deksklorfeniramin',
        activeIngredient: 'Deksklorfeniramin',
        category: 'Antihistamin',
        indication: 'Lindrer allergiske reaksjoner, kløe, elveblest og allergisk snue. Kan også brukes ved kvalme.',
        mechanism: 'Blokkerer histaminreseptorer (H1) og reduserer dermed allergiske symptomer.',
        sideEffects: ['Døsighet', 'Munntørrhet', 'Svimmelhet', 'Uklart syn'],
        warnings: 'Kan gi døsighet - forsiktighet ved aktiviteter som krever årvåkenhet. Unngå alkohol.',
        interaction: 'Effekten forsterkes av andre beroligende midler og alkohol.',
        storage: 'Oppbevares ved romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ibuprofen': {
        name: 'Ibuprofen',
        activeIngredient: 'Ibuprofen',
        category: 'NSAID (betennelsesdempende)',
        indication: 'Smertestillende, febernedsettende og betennelsesdempende. Effektiv ved smerter med betennelse.',
        mechanism: 'Hemmer enzymet COX som produserer prostaglandiner, stoffer som gir smerte og betennelse.',
        sideEffects: ['Magebesvær', 'Kvalme', 'Hodepine', 'Svimmelhet'],
        warnings: '⚠️ Tas med mat for å beskytte magen. Forsiktighet ved astma, nyreproblemer eller magesår.',
        interaction: 'Kan redusere effekten av blodtrykksmedisin. Øker blødningsrisiko med blodfortynnende.',
        storage: 'Oppbevares ved romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Nutrini peptisorb': {
        name: 'Nutrini peptisorb',
        activeIngredient: 'Peptibasert sondenæring',
        category: 'Medisinsk ernæring',
        indication: 'Komplett sondenæring for barn med nedsatt toleranse for vanlig mat. Lettfordøyelig peptibasert formel.',
        mechanism: 'Gir alle nødvendige næringsstoffer (proteiner, karbohydrater, fett, vitaminer, mineraler) i lettfordøyelig form.',
        sideEffects: ['Diaré ved for rask tilførsel', 'Oppblåsthet', 'Kvalme'],
        warnings: 'Start langsomt og øk gradvis. Følg legens anbefalinger for hastighet og mengde.',
        interaction: 'Ingen kjente interaksjoner.',
        storage: 'Uåpnet: romtemperatur. Åpnet: kjøleskap, bruk innen 24 timer.',
        source: 'Felleskatalogen'
    }
};

// Function to show medicine info modal
async function showMedicineInfo(medicineName) {
    // Try to find exact match first
    let info = medicineDatabase[medicineName];
    
    // If not found, try partial match
    if (!info) {
        const lowerName = medicineName.toLowerCase();
        for (const key in medicineDatabase) {
            if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
                info = medicineDatabase[key];
                break;
            }
        }
    }
    
    // If still not found, try to fetch from OpenFDA
    if (!info) {
        // Show loading state
        showLoadingModal(medicineName);
        
        // Try to fetch from API
        info = await fetchMedicineInfoExternal(medicineName);
        
        // Close loading modal
        const loadingModal = document.getElementById('medicineLoadingModal');
        if (loadingModal) {
            bootstrap.Modal.getInstance(loadingModal)?.hide();
            loadingModal.remove();
        }
        
        // If still no info, use fallback
        if (!info) {
            info = {
                name: medicineName,
                activeIngredient: 'Ukjent',
                category: 'Legemiddel',
                indication: 'Informasjon ikke tilgjengelig. Kontakt lege eller farmasøyt.',
                mechanism: 'Virkningsmekanisme ikke tilgjengelig.',
                sideEffects: ['Se pakningsvedlegg'],
                warnings: 'Følg alltid legens anbefalinger og les pakningsvedlegget.',
                interaction: 'Spør lege eller apotek om interaksjoner.',
                storage: 'Se pakningsvedlegg for oppbevaringsinformasjon.',
                source: 'Ingen ekstern kilde funnet'
            };
        }
    }
    
    // Show the info modal
    showMedicineInfoModal(info);
}

// Show loading modal while fetching
function showLoadingModal(medicineName) {
    const loadingHtml = `
        <div class="modal fade" id="medicineLoadingModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 16px; text-align: center; padding: 40px;">
                    <div class="spinner-border text-success mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Laster...</span>
                    </div>
                    <h5 style="color: #333;">Søker etter ${medicineName}...</h5>
                    <p style="color: #666; font-size: 0.9rem;">Henter informasjon fra legemiddeldatabase</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
    const modal = new bootstrap.Modal(document.getElementById('medicineLoadingModal'));
    modal.show();
}

// Show the actual medicine info modal
function showMedicineInfoModal(info) {
    
    // Create and show modal
    const modalHtml = `
        <div class="modal fade" id="medicineInfoModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content" style="border-radius: 20px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 24px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.9; letter-spacing: 1px;">${info.category}</div>
                                <h4 style="margin: 4px 0 8px; font-weight: 700;">${info.name}</h4>
                                <div style="font-size: 0.9rem; opacity: 0.9;">
                                    <i class="bi bi-capsule"></i> ${info.activeIngredient}
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" style="opacity: 1;"></button>
                        </div>
                    </div>
                    <div class="modal-body" style="padding: 24px;">
                        <div style="margin-bottom: 20px;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">💊</span> Hva brukes det til?
                            </div>
                            <p style="color: #555; margin: 0; line-height: 1.6;">${info.indication}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">⚙️</span> Hvordan virker det?
                            </div>
                            <p style="color: #555; margin: 0; line-height: 1.6;">${info.mechanism}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">⚠️</span> Mulige bivirkninger
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${info.sideEffects.map(effect => `
                                    <span style="background: #FFF3E0; color: #E65100; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">${effect}</span>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div style="background: #FFF8E1; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #FFC107;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">📋</span> Viktig å vite
                            </div>
                            <p style="color: #555; margin: 0; line-height: 1.6;">${info.warnings}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">🔄</span> Interaksjoner
                            </div>
                            <p style="color: #555; margin: 0; line-height: 1.6;">${info.interaction}</p>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">🏠</span> Oppbevaring
                            </div>
                            <p style="color: #555; margin: 0; line-height: 1.6;">${info.storage}</p>
                        </div>
                        
                        <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 20px;">
                            <p style="color: #999; font-size: 0.8rem; margin: 0;">
                                <i class="bi bi-info-circle"></i> Kilde: ${info.source}. 
                                Informasjonen er veiledende. Følg alltid legens anbefalinger og les pakningsvedlegget.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('medicineInfoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('medicineInfoModal'));
    modal.show();
    
    // Clean up after hiding
    document.getElementById('medicineInfoModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Translations for common medical terms (English to Norwegian)
const medicalTranslations = {
    // Drug categories and types
    'antibiotic': 'antibiotikum',
    'analgesic': 'smertestillende',
    'antipyretic': 'febernedsettende',
    'antiemetic': 'kvalmestillende',
    'antipsychotic': 'antipsykotikum',
    'antihistamine': 'antihistamin',
    'proton pump inhibitor': 'protonpumpehemmer',
    'laxative': 'avføringsmiddel',
    'vitamin': 'vitamin',
    'supplement': 'kosttilskudd',
    'nsaid': 'NSAID (betennelsesdempende)',
    'anti-inflammatory': 'betennelsesdempende',
    'anticonvulsant': 'antiepileptikum',
    'antidepressant': 'antidepressiva',
    'sedative': 'beroligende middel',
    'anticoagulant': 'blodfortynnende',
    'diuretic': 'vanndrivende',
    'antifungal': 'soppmiddel',
    'antiviral': 'antiviralt middel',
    'immunosuppressant': 'immunhemmende',
    'corticosteroid': 'kortikosteroid',
    'chemotherapy': 'cellegift',
    'opioid': 'opioid',
    'benzodiazepine': 'benzodiazepin',
    
    // Common side effects
    'nausea': 'kvalme',
    'vomiting': 'oppkast',
    'diarrhea': 'diaré',
    'diarrhoea': 'diaré',
    'constipation': 'forstoppelse',
    'headache': 'hodepine',
    'dizziness': 'svimmelhet',
    'drowsiness': 'døsighet',
    'fatigue': 'tretthet',
    'rash': 'utslett',
    'dry mouth': 'munntørrhet',
    'abdominal pain': 'magesmerter',
    'stomach pain': 'magesmerter',
    'loss of appetite': 'appetittløshet',
    'weight gain': 'vektøkning',
    'weight loss': 'vekttap',
    'insomnia': 'søvnløshet',
    'anxiety': 'angst',
    'itching': 'kløe',
    'pruritus': 'kløe',
    'blurred vision': 'uklart syn',
    'fever': 'feber',
    'chills': 'frysninger',
    'sweating': 'svetting',
    'tremor': 'skjelving',
    'weakness': 'svakhet',
    'pain': 'smerte',
    'swelling': 'hevelse',
    'edema': 'ødem',
    'numbness': 'nummenhet',
    'tingling': 'prikking',
    'muscle pain': 'muskelsmerter',
    'joint pain': 'leddsmerter',
    'back pain': 'ryggsmerter',
    'chest pain': 'brystsmerter',
    'shortness of breath': 'kortpustethet',
    'difficulty breathing': 'pustevansker',
    'cough': 'hoste',
    'sore throat': 'sår hals',
    'runny nose': 'rennende nese',
    'nasal congestion': 'tett nese',
    'bleeding': 'blødning',
    'bruising': 'blåmerker',
    'hair loss': 'hårtap',
    'alopecia': 'hårtap',
    'infection': 'infeksjon',
    'decreased appetite': 'nedsatt appetitt',
    'increased appetite': 'økt appetitt',
    'depression': 'depresjon',
    'mood changes': 'humørsvingninger',
    'confusion': 'forvirring',
    'memory problems': 'hukommelsesproblemer',
    'difficulty sleeping': 'søvnproblemer',
    'nightmares': 'mareritt',
    'hallucinations': 'hallusinasjoner',
    'seizures': 'krampeanfall',
    'convulsions': 'kramper',
    'palpitations': 'hjertebank',
    'irregular heartbeat': 'uregelmessig hjerterytme',
    'high blood pressure': 'høyt blodtrykk',
    'low blood pressure': 'lavt blodtrykk',
    'hypotension': 'lavt blodtrykk',
    'hypertension': 'høyt blodtrykk',
    
    // Body parts/systems
    'liver': 'lever',
    'kidney': 'nyre',
    'kidneys': 'nyrer',
    'heart': 'hjerte',
    'stomach': 'mage',
    'intestine': 'tarm',
    'intestines': 'tarmer',
    'brain': 'hjerne',
    'skin': 'hud',
    'blood': 'blod',
    'bone': 'ben',
    'bones': 'ben',
    'muscle': 'muskel',
    'muscles': 'muskler',
    'lung': 'lunge',
    'lungs': 'lunger',
    'eye': 'øye',
    'eyes': 'øyne',
    'ear': 'øre',
    'ears': 'ører',
    'mouth': 'munn',
    'throat': 'hals',
    'nose': 'nese',
    'bladder': 'blære',
    'pancreas': 'bukspyttkjertel',
    'spleen': 'milt',
    'thyroid': 'skjoldbruskkjertel',
    'immune system': 'immunsystem',
    'nervous system': 'nervesystem',
    'cardiovascular': 'hjerte-kar',
    'gastrointestinal': 'mage-tarm',
    'respiratory': 'puste-',
    
    // Medical conditions
    'cancer': 'kreft',
    'tumor': 'svulst',
    'diabetes': 'diabetes',
    'asthma': 'astma',
    'pneumonia': 'lungebetennelse',
    'inflammation': 'betennelse',
    'allergy': 'allergi',
    'allergies': 'allergier',
    'disease': 'sykdom',
    'disorder': 'lidelse',
    'syndrome': 'syndrom',
    'condition': 'tilstand',
    'chronic': 'kronisk',
    'acute': 'akutt',
    'severe': 'alvorlig',
    'mild': 'mild',
    'moderate': 'moderat',
    
    // Common phrases and instructions
    'take with food': 'tas med mat',
    'take with water': 'tas med vann',
    'do not exceed': 'ikke overskrid',
    'consult doctor': 'kontakt lege',
    'consult your doctor': 'kontakt legen din',
    'contact your doctor': 'kontakt legen din',
    'tell your doctor': 'fortell legen din',
    'allergic reaction': 'allergisk reaksjon',
    'side effects': 'bivirkninger',
    'adverse reactions': 'bivirkninger',
    'overdose': 'overdose',
    'dose': 'dose',
    'dosage': 'dosering',
    'treatment': 'behandling',
    'therapy': 'terapi',
    'medication': 'medisin',
    'drug': 'legemiddel',
    'medicine': 'medisin',
    'prescription': 'resept',
    'tablet': 'tablett',
    'tablets': 'tabletter',
    'capsule': 'kapsel',
    'capsules': 'kapsler',
    'oral': 'oral',
    'injection': 'injeksjon',
    'intravenous': 'intravenøs',
    'topical': 'lokal',
    'once daily': 'én gang daglig',
    'twice daily': 'to ganger daglig',
    'three times daily': 'tre ganger daglig',
    'as needed': 'ved behov',
    'before meals': 'før måltider',
    'after meals': 'etter måltider',
    'with meals': 'med måltider',
    'at bedtime': 'ved sengetid',
    'in the morning': 'om morgenen',
    'in the evening': 'om kvelden',
    'do not': 'ikke',
    'should not': 'bør ikke',
    'may cause': 'kan forårsake',
    'can cause': 'kan forårsake',
    'is used to': 'brukes til',
    'used to treat': 'brukes til behandling av',
    'used for': 'brukes til',
    'if you have': 'hvis du har',
    'if you are': 'hvis du er',
    'while taking': 'mens du tar',
    'during treatment': 'under behandling',
    'seek medical attention': 'søk medisinsk hjelp',
    'call your doctor': 'ring legen din',
    'stop taking': 'slutt å ta',
    'continue taking': 'fortsett å ta',
    'children': 'barn',
    'adults': 'voksne',
    'elderly': 'eldre',
    'pregnancy': 'graviditet',
    'pregnant': 'gravid',
    'breastfeeding': 'amming',
    'breast-feeding': 'amming',
    'nursing': 'ammende',
    'women': 'kvinner',
    'men': 'menn',
    'patients': 'pasienter',
    'patient': 'pasient',
    'immediately': 'umiddelbart',
    'serious': 'alvorlig',
    'common': 'vanlig',
    'rare': 'sjelden',
    'very common': 'svært vanlig',
    'very rare': 'svært sjelden',
    'unlikely': 'usannsynlig',
    'likely': 'sannsynlig',
    'unknown': 'ukjent',
    'reported': 'rapportert',
    'observed': 'observert',
    'studies': 'studier',
    'clinical trials': 'kliniske studier',
    'store': 'oppbevar',
    'storage': 'oppbevaring',
    'room temperature': 'romtemperatur',
    'refrigerate': 'i kjøleskap',
    'keep away from': 'hold unna',
    'out of reach of children': 'utilgjengelig for barn',
    'expiration date': 'utløpsdato',
    'warnings': 'advarsler',
    'precautions': 'forsiktighetsregler',
    'contraindications': 'kontraindikasjoner',
    'interactions': 'interaksjoner',
    'drug interactions': 'legemiddelinteraksjoner',
    'alcohol': 'alkohol',
    'food': 'mat',
    'grapefruit': 'grapefrukt',
    'avoid': 'unngå',
    'caution': 'forsiktighet',
    'warning': 'advarsel',
    'important': 'viktig',
    'note': 'merk',
    'indication': 'indikasjon',
    'indications': 'indikasjoner'
};

// Translate text from English to Norwegian (simple word replacement)
function translateToNorwegian(text) {
    if (!text) return text;
    
    let translated = text.toLowerCase();
    
    // Replace known medical terms
    for (const [eng, nor] of Object.entries(medicalTranslations)) {
        const regex = new RegExp(eng, 'gi');
        translated = translated.replace(regex, nor);
    }
    
    // Capitalize first letter
    return translated.charAt(0).toUpperCase() + translated.slice(1);
}

// Fetch medicine info from OpenFDA API
async function fetchMedicineInfoExternal(medicineName) {
    console.log(`Looking up: ${medicineName} via OpenFDA`);
    
    try {
        // Search OpenFDA drug label API
        const searchName = encodeURIComponent(medicineName);
        const response = await fetch(
            `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${searchName}"+openfda.generic_name:"${searchName}"&limit=1`
        );
        
        if (!response.ok) {
            // Try broader search
            const broaderResponse = await fetch(
                `https://api.fda.gov/drug/label.json?search=${searchName}&limit=1`
            );
            if (!broaderResponse.ok) {
                console.log('OpenFDA: No results found');
                return null;
            }
            const data = await broaderResponse.json();
            return parseOpenFDAResponse(data, medicineName);
        }
        
        const data = await response.json();
        return parseOpenFDAResponse(data, medicineName);
        
    } catch (error) {
        console.error('OpenFDA API error:', error);
        return null;
    }
}

// Parse OpenFDA response and convert to our format
function parseOpenFDAResponse(data, originalName) {
    if (!data.results || data.results.length === 0) {
        return null;
    }
    
    const drug = data.results[0];
    const openfda = drug.openfda || {};
    
    // Extract and translate information
    const info = {
        name: originalName,
        activeIngredient: openfda.generic_name ? openfda.generic_name[0] : 'Ukjent',
        category: openfda.pharm_class_epc ? translateToNorwegian(openfda.pharm_class_epc[0]) : 'Legemiddel',
        indication: extractAndTranslate(drug.indications_and_usage, 'Brukes til behandling av ulike tilstander.'),
        mechanism: extractAndTranslate(drug.mechanism_of_action, extractAndTranslate(drug.clinical_pharmacology, 'Virkningsmekanisme ikke tilgjengelig.')),
        sideEffects: extractSideEffects(drug.adverse_reactions || drug.warnings),
        warnings: extractAndTranslate(drug.warnings_and_cautions || drug.warnings, 'Følg legens anbefalinger.'),
        interaction: extractAndTranslate(drug.drug_interactions, 'Informer lege om andre medisiner du bruker.'),
        storage: extractAndTranslate(drug.storage_and_handling, 'Oppbevares ved romtemperatur.'),
        source: 'OpenFDA / Oversatt til norsk'
    };
    
    // Cache the result
    medicineDatabase[originalName] = info;
    
    // Save to localStorage for persistence
    try {
        const customMeds = JSON.parse(localStorage.getItem('customMedicineInfo') || '{}');
        customMeds[originalName] = info;
        localStorage.setItem('customMedicineInfo', JSON.stringify(customMeds));
    } catch (e) {
        console.error('Error caching medicine info:', e);
    }
    
    return info;
}

// Extract text from FDA array field and translate
function extractAndTranslate(field, fallback) {
    if (!field || field.length === 0) return fallback;
    
    let text = Array.isArray(field) ? field[0] : field;
    
    // Clean up the text (remove HTML, excessive whitespace)
    text = text.replace(/<[^>]*>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (text.length > 500) {
        text = text.substring(0, 497) + '...';
    }
    
    // Translate common terms
    return translateToNorwegian(text);
}

// Extract side effects as array
function extractSideEffects(field) {
    if (!field || field.length === 0) {
        return ['Se pakningsvedlegg'];
    }
    
    let text = Array.isArray(field) ? field[0] : field;
    text = text.replace(/<[^>]*>/g, ' ').toLowerCase();
    
    // Common side effects to look for
    const commonEffects = [
        'nausea', 'vomiting', 'diarrhea', 'constipation', 'headache',
        'dizziness', 'drowsiness', 'fatigue', 'rash', 'dry mouth',
        'abdominal pain', 'loss of appetite', 'weight gain', 'insomnia'
    ];
    
    const foundEffects = [];
    for (const effect of commonEffects) {
        if (text.includes(effect)) {
            foundEffects.push(translateToNorwegian(effect));
        }
    }
    
    return foundEffects.length > 0 ? foundEffects.slice(0, 6) : ['Se pakningsvedlegg'];
}

// Add info to medicine database dynamically
function addMedicineToDatabase(name, info) {
    medicineDatabase[name] = info;
    localStorage.setItem('customMedicineInfo', JSON.stringify(
        Object.fromEntries(
            Object.entries(medicineDatabase).filter(([key]) => !['Bactrim', 'Nexium', 'Emend', 'Zyprexa', 'Palonosetron', 'Paracetamol', 'Movicol', 'Deksklorfeniramin', 'Ibuprofen', 'Nutrini peptisorb', 'Nycoplus Multi Barn'].includes(key))
        )
    ));
}

// Load custom medicine info from localStorage
function loadCustomMedicineInfo() {
    try {
        const custom = JSON.parse(localStorage.getItem('customMedicineInfo') || '{}');
        Object.assign(medicineDatabase, custom);
    } catch (e) {
        console.error('Error loading custom medicine info:', e);
    }
}

// Initialize
loadCustomMedicineInfo();
