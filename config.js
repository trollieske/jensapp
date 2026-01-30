// Central Configuration for Dosevakt
// Contains static data for medicines, checklist items, and plans

const AppConfig = {
    // Default checklist items
    checklist: {
        medicines: [
            // DAGTID
            { name: 'Bactrim', dose: '10 ml', unit: 'ml', category: 'dag', days: [0, 6], times: ['08:00'], description: 'Antibiotikum mot bakterielle infeksjoner - kun lørdag og søndag' },
            { name: 'Nycoplus Multi Barn', dose: '1 tablett', unit: 'tablett', category: 'dag', times: ['08:00'], description: 'Multivitamin og mineraltilskudd' },
            { name: 'Nexium', dose: '1-2 poser', unit: 'pose', category: 'dag', times: ['08:00'], description: 'Protonpumpehemmer mot syrerelaterte mageproblemer' },
            { name: 'Emend', dose: '40 mg', unit: 'mg', category: 'dag', times: ['08:00'], description: 'Antiemetikum mot kvalme ved cellegift' },
            
            // KVELD
            { name: 'Bactrim', dose: '10 ml', unit: 'ml', category: 'kveld', days: [0, 6], times: ['20:00'], description: 'Antibiotikum mot bakterielle infeksjoner - kun lørdag og søndag' },
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
    },

    // Doctor's plan presets (for dosing-plan.js)
    doctorPlan: [
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
    ],

    // All available medicines for time picker (for dosing-plan.js)
    allMedicines: [
        { name: 'Bactrim', default: '08:00' },
        { name: 'Nycoplus Multi Barn', default: '08:00' },
        { name: 'Nexium', default: '08:00' },
        { name: 'Zyprexa', default: '18:00' },
        { name: 'Emend', default: '08:00' },
        { name: 'Paracetamol', default: '10:00' },
        { name: 'Movicol', default: '08:00' },
        { name: 'Deksklorfeniramin', default: '08:00' },
        { name: 'Nutrini peptisorb', default: '08:00' }
    ],

    // UI Configuration
    ui: {
        typeIcons: {
            'Medisin': '<i class="bi bi-capsule"></i>',
            'Sondemat': '<i class="bi bi-droplet-half"></i>',
            'Avføring': '<i class="bi bi-recycle"></i>',
            'vannlating': '<i class="bi bi-droplet"></i>',
            'Oppkast': '<i class="bi bi-emoji-dizzy"></i>',
            'Annet': '<i class="bi bi-file-text"></i>'
        },
        typeColors: {
            'Medisin': 'linear-gradient(135deg, #4CAF50, #81C784)',
            'Sondemat': 'linear-gradient(135deg, #2196F3, #64B5F6)',
            'Avføring': 'linear-gradient(135deg, #FF9800, #FFB74D)',
            'vannlating': 'linear-gradient(135deg, #00BCD4, #4DD0E1)',
            'Oppkast': 'linear-gradient(135deg, #F44336, #E57373)',
            'Annet': 'linear-gradient(135deg, #9C27B0, #BA68C8)'
        }
    }
};

// Prevent modification if needed, but for now we keep it mutable if necessary
// Object.freeze(AppConfig);
