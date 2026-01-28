// Medicine Information Database
// Based on Felleskatalogen and medical references

const medicineDatabase = {
    // --- Smertestillende og Febernedsettende ---
    'Paracet': {
        name: 'Paracet',
        activeIngredient: 'Paracetamol',
        category: 'Smertestillende',
        indication: 'Lindrer mild til moderat smerte og senker feber. Førstevalg ved smerter hos barn.',
        mechanism: 'Hemmer prostaglandinsyntesen i sentralnervesystemet.',
        sideEffects: ['Svært sjeldne ved riktig bruk', 'Leverskade ved overdose'],
        warnings: 'Maks 4 doser i døgnet. Minst 4-6 timer mellom doser.',
        interaction: 'Forsiktighet med andre paracetamol-produkter.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Paracetamol': {
        name: 'Paracetamol',
        activeIngredient: 'Paracetamol',
        category: 'Smertestillende',
        indication: 'Lindrer mild til moderat smerte og senker feber.',
        mechanism: 'Hemmer prostaglandinsyntesen i sentralnervesystemet.',
        sideEffects: ['Svært sjeldne ved riktig bruk'],
        warnings: 'Overdosering kan gi leverskade.',
        interaction: 'Ingen kjente ved normal bruk.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Acetaminophen': {
        name: 'Acetaminophen (Paracetamol)',
        activeIngredient: 'Paracetamol',
        category: 'Smertestillende',
        indication: 'Amerikansk navn for Paracetamol. Lindrer smerte og feber.',
        mechanism: 'Se Paracetamol.',
        sideEffects: ['Se Paracetamol'],
        warnings: 'Se Paracetamol.',
        interaction: 'Se Paracetamol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ibux': {
        name: 'Ibux',
        activeIngredient: 'Ibuprofen',
        category: 'NSAID',
        indication: 'Smertestillende, febernedsettende og betennelsesdempende.',
        mechanism: 'Hemmer COX-enzymer og reduserer betennelse.',
        sideEffects: ['Magebesvær', 'Kvalme', 'Hodepine'],
        warnings: 'Tas med mat. Forsiktighet ved astma og magesår.',
        interaction: 'Blodfortynnende, andre NSAIDs.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ibuprofen': {
        name: 'Ibuprofen',
        activeIngredient: 'Ibuprofen',
        category: 'NSAID',
        indication: 'Smertestillende og betennelsesdempende.',
        mechanism: 'Hemmer prostaglandinsyntesen.',
        sideEffects: ['Magesmerter', 'Kvalme'],
        warnings: 'Kan gi magesår ved langvarig bruk.',
        interaction: 'Blodtrykksmedisin, blodfortynnende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Pinex': {
        name: 'Pinex',
        activeIngredient: 'Paracetamol',
        category: 'Smertestillende',
        indication: 'Smerter og feber.',
        mechanism: 'Se Paracet.',
        sideEffects: ['Sjeldne'],
        warnings: 'Se Paracet.',
        interaction: 'Se Paracet.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Paralgin Forte': {
        name: 'Paralgin Forte',
        activeIngredient: 'Paracetamol + Kodein',
        category: 'Sterkt smertestillende (Opioid)',
        indication: 'Moderate til sterke smerter.',
        mechanism: 'Kombinasjonseffekt på smertereseptorer.',
        sideEffects: ['Døsighet', 'Forstoppelse', 'Kvalme'],
        warnings: 'Kan gi avhengighet. Påvirker kjøreevne (rød trekant).',
        interaction: 'Alkohol, sovemedisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Voltaren': {
        name: 'Voltaren',
        activeIngredient: 'Diklofenak',
        category: 'NSAID',
        indication: 'Smerter og betennelse i ledd og muskler.',
        mechanism: 'Kraftig betennelsesdempende effekt.',
        sideEffects: ['Magesmerter', 'Kvalme', 'Hodepine'],
        warnings: 'Økt risiko for hjerte-kar-bivirkninger ved langvarig bruk.',
        interaction: 'Blodfortynnende, blodtrykksmedisin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Tramadol': {
        name: 'Tramadol',
        activeIngredient: 'Tramadol',
        category: 'Smertestillende (Opioid)',
        indication: 'Moderate til sterke smerter.',
        mechanism: 'Påvirker smerteopplevelsen i sentralnervesystemet.',
        sideEffects: ['Kvalme', 'Svimmelhet', 'Forstoppelse'],
        warnings: 'Fare for avhengighet. Kan gi kramper.',
        interaction: 'Antidepressiva, sovemedisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Nobligan': {
        name: 'Nobligan',
        activeIngredient: 'Tramadol',
        category: 'Smertestillende (Opioid)',
        indication: 'Moderate til sterke smerter.',
        mechanism: 'Se Tramadol.',
        sideEffects: ['Kvalme', 'Døsighet'],
        warnings: 'Fare for avhengighet.',
        interaction: 'Se Tramadol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Brexidol': {
        name: 'Brexidol',
        activeIngredient: 'Piroksikam',
        category: 'NSAID',
        indication: 'Revmatiske smerter og betennelse.',
        mechanism: 'Betennelsesdempende.',
        sideEffects: ['Magesmerter', 'Hudreaksjoner'],
        warnings: 'Unngå soling (fotosensitivitet).',
        interaction: 'Blodfortynnende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Hjerte og Kar ---
    'Albyl-E': {
        name: 'Albyl-E',
        activeIngredient: 'Acetylsalisylsyre',
        category: 'Blodfortynnende',
        indication: 'Forebygging av blodpropp.',
        mechanism: 'Hemmer blodplater fra å klumpe seg.',
        sideEffects: ['Økt blødningstendens', 'Magebesvær'],
        warnings: 'Skal ikke brukes av barn (Reyes syndrom).',
        interaction: 'Andre blodfortynnende, NSAIDs.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Lipitor': {
        name: 'Lipitor',
        activeIngredient: 'Atorvastatin',
        category: 'Kolesterolsenkende',
        indication: 'Høyt kolesterol, forebygging av hjerte-kar-sykdom.',
        mechanism: 'Hemmer kolesterolproduksjon i leveren.',
        sideEffects: ['Muskelsmerter', 'Magebesvær'],
        warnings: 'Kontakt lege ved uforklarlige muskelsmerter.',
        interaction: 'Grapefruktjuice, visse antibiotika.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Zocor': {
        name: 'Zocor',
        activeIngredient: 'Simvastatin',
        category: 'Kolesterolsenkende',
        indication: 'Høyt kolesterol.',
        mechanism: 'Se Lipitor.',
        sideEffects: ['Muskelsmerter'],
        warnings: 'Tas om kvelden.',
        interaction: 'Mange interaksjoner, sjekk med lege.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Selo-Zok': {
        name: 'Selo-Zok',
        activeIngredient: 'Metoprolol',
        category: 'Betablokker',
        indication: 'Høyt blodtrykk, angina, hjerterytmeforstyrrelser.',
        mechanism: 'Senker pulsen og blodtrykket.',
        sideEffects: ['Tretthet', 'Kalde hender/føtter'],
        warnings: 'Ikke slutt brått.',
        interaction: 'Andre blodtrykksmedisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Metoprolol': {
        name: 'Metoprolol',
        activeIngredient: 'Metoprolol',
        category: 'Betablokker',
        indication: 'Høyt blodtrykk, hjertebank.',
        mechanism: 'Blokkerer stresshormoner på hjertet.',
        sideEffects: ['Svimmelhet', 'Tretthet'],
        warnings: 'Forsiktighet ved astma.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Amlodipin': {
        name: 'Amlodipin',
        activeIngredient: 'Amlodipin',
        category: 'Kalsiumblokker',
        indication: 'Høyt blodtrykk, angina.',
        mechanism: 'Utvider blodårene.',
        sideEffects: ['Hevelse i ankler (ødem)', 'Hodepine'],
        warnings: 'Grapefrukt bør unngås.',
        interaction: 'Simvastatin (dosebegrensning).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Norvasc': {
        name: 'Norvasc',
        activeIngredient: 'Amlodipin',
        category: 'Kalsiumblokker',
        indication: 'Høyt blodtrykk.',
        mechanism: 'Se Amlodipin.',
        sideEffects: ['Ankelødem'],
        warnings: 'Se Amlodipin.',
        interaction: 'Se Amlodipin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Atacand': {
        name: 'Atacand',
        activeIngredient: 'Candesartan',
        category: 'Blodtrykksmedisin (ARB)',
        indication: 'Høyt blodtrykk, hjertesvikt.',
        mechanism: 'Blokkerer hormonet som trekker sammen blodårene.',
        sideEffects: ['Svimmelhet'],
        warnings: 'Sjekk nyrefunksjon.',
        interaction: 'Kaliumtilskudd.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Marevan': {
        name: 'Marevan',
        activeIngredient: 'Warfarin',
        category: 'Blodfortynnende',
        indication: 'Forebygging av blodpropp.',
        mechanism: 'Hemmer K-vitamin.',
        sideEffects: ['Blødninger'],
        warnings: 'Krever jevnlig måling av INR. Mange matvarer påvirker effekten.',
        interaction: 'Svært mange! Sjekk alltid ved ny medisin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Xarelto': {
        name: 'Xarelto',
        activeIngredient: 'Rivaroksaban',
        category: 'Blodfortynnende (DOAK)',
        indication: 'Forebygging av slag og blodpropp.',
        mechanism: 'Hemmer faktor Xa.',
        sideEffects: ['Blødning', 'Svimmelhet'],
        warnings: 'Tas med mat (viktig for opptak).',
        interaction: 'Visse soppmidler og epilepsimedisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Eliquis': {
        name: 'Eliquis',
        activeIngredient: 'Apixaban',
        category: 'Blodfortynnende (DOAK)',
        indication: 'Forebygging av blodpropp.',
        mechanism: 'Hemmer faktor Xa.',
        sideEffects: ['Blødning', 'Blåmerker'],
        warnings: 'Svelges hele.',
        interaction: 'Færre enn Marevan.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Nitroglyserin': {
        name: 'Nitroglyserin',
        activeIngredient: 'Glyseryltrinitrat',
        category: 'Hjertemedisin',
        indication: 'Angina pectoris (brystsmerter).',
        mechanism: 'Utvider kransårene raskt.',
        sideEffects: ['Hodepine ("nitrohodepine")', 'Rødming'],
        warnings: 'Sitt ned når du tar den (kan besvime).',
        interaction: 'Viagra/Cialis (FARLIG kombinasjon).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Diabetes og Stoffskifte ---
    'Metformin': {
        name: 'Metformin',
        activeIngredient: 'Metformin',
        category: 'Diabetesmedisin',
        indication: 'Diabetes type 2.',
        mechanism: 'Øker insulinfølsomhet og reduserer sukkerproduksjon i lever.',
        sideEffects: ['Magebesvær', 'Diaré', 'Metallsmak'],
        warnings: 'Tas med mat for å redusere magebesvær.',
        interaction: 'Røntgenkontrast (pause før/etter).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Glucophage': {
        name: 'Glucophage',
        activeIngredient: 'Metformin',
        category: 'Diabetesmedisin',
        indication: 'Diabetes type 2.',
        mechanism: 'Se Metformin.',
        sideEffects: ['Diaré', 'Kvalme'],
        warnings: 'Se Metformin.',
        interaction: 'Se Metformin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Insulin': {
        name: 'Insulin',
        activeIngredient: 'Insulin',
        category: 'Diabetesmedisin',
        indication: 'Diabetes type 1 og 2.',
        mechanism: 'Senker blodsukkeret.',
        sideEffects: ['Lavt blodsukker (føling)', 'Vektøkning'],
        warnings: 'Bytt injeksjonssted jevnlig.',
        interaction: 'Alkohol kan forsterke effekten.',
        storage: 'Kjøleskap (uåpnet), romtemp (i bruk).',
        source: 'Felleskatalogen'
    },
    'Lantus': {
        name: 'Lantus',
        activeIngredient: 'Insulin glargin',
        category: 'Langtidsvirkende insulin',
        indication: 'Diabetes.',
        mechanism: 'Jevn virkning over 24 timer.',
        sideEffects: ['Føling'],
        warnings: 'Tas til samme tid hver dag.',
        interaction: 'Se Insulin.',
        storage: 'Kjøleskap.',
        source: 'Felleskatalogen'
    },
    'NovoRapid': {
        name: 'NovoRapid',
        activeIngredient: 'Insulin aspart',
        category: 'Hurtigvirkende insulin',
        indication: 'Diabetes, tas til måltider.',
        mechanism: 'Virker raskt etter injeksjon.',
        sideEffects: ['Føling'],
        warnings: 'Spis mat straks etter injeksjon.',
        interaction: 'Se Insulin.',
        storage: 'Kjøleskap.',
        source: 'Felleskatalogen'
    },
    'Ozempic': {
        name: 'Ozempic',
        activeIngredient: 'Semaglutid',
        category: 'Diabetesmedisin (GLP-1)',
        indication: 'Diabetes type 2.',
        mechanism: 'Øker insulinproduksjon, reduserer appetitt.',
        sideEffects: ['Kvalme', 'Diaré', 'Oppkast'],
        warnings: 'Gradvis opptrapping for å unngå kvalme.',
        interaction: 'Kan påvirke opptak av andre medisiner pga langsommere magesekktømming.',
        storage: 'Kjøleskap.',
        source: 'Felleskatalogen'
    },
    'Levaxin': {
        name: 'Levaxin',
        activeIngredient: 'Levotyroksin',
        category: 'Stoffskiftemedisin',
        indication: 'Lavt stoffskifte (hypotyreose).',
        mechanism: 'Erstatter manglende tyroksin.',
        sideEffects: ['Hjertebank (ved for høy dose)', 'Svette'],
        warnings: 'Tas på tom mage med vann, 30 min før frokost.',
        interaction: 'Jern, kalsium (4 timers avstand).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Allergi og Lunger ---
    'Zyrtec': {
        name: 'Zyrtec',
        activeIngredient: 'Cetirizin',
        category: 'Antihistamin',
        indication: 'Allergi, høysnue, elveblest.',
        mechanism: 'Blokkerer histaminreseptorer.',
        sideEffects: ['Tretthet', 'Munntørrhet'],
        warnings: 'Kan virke sløvende på enkelte.',
        interaction: 'Alkohol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Aerius': {
        name: 'Aerius',
        activeIngredient: 'Desloratadin',
        category: 'Antihistamin',
        indication: 'Allergi og elveblest.',
        mechanism: 'Ikke-sløvende antihistamin.',
        sideEffects: ['Hodepine', 'Munntørrhet'],
        warnings: 'Tas uavhengig av mat.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ventoline': {
        name: 'Ventoline',
        activeIngredient: 'Salbutamol',
        category: 'Bronkdilaterende',
        indication: 'Astma, KOLS, akutt pustebesvær.',
        mechanism: 'Utvider luftveiene raskt.',
        sideEffects: ['Skjelving', 'Hjertebank', 'Uro'],
        warnings: 'Bruk ved behov eller før anstrengelse.',
        interaction: 'Betablokkere.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Flutide': {
        name: 'Flutide',
        activeIngredient: 'Flutikason',
        category: 'Kortikosteroid (inhalasjon)',
        indication: 'Forebyggende mot astma.',
        mechanism: 'Demper betennelse i luftveiene.',
        sideEffects: ['Sopp i munnen', 'Heshet'],
        warnings: 'Skyll munnen etter bruk.',
        interaction: 'Visse soppmidler.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Seretide': {
        name: 'Seretide',
        activeIngredient: 'Salmeterol + Flutikason',
        category: 'Kombinasjonsprellarat (Astma)',
        indication: 'Vedlikeholdsbehandling av astma og KOLS.',
        mechanism: 'Både utvidende og betennelsesdempende.',
        sideEffects: ['Hjertebank', 'Skjelving', 'Sopp i munn'],
        warnings: 'Skyll munnen etter bruk.',
        interaction: 'Betablokkere.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Singulair': {
        name: 'Singulair',
        activeIngredient: 'Montelukast',
        category: 'Leukotrienantagonist',
        indication: 'Tilleggsbehandling ved astma og allergi.',
        mechanism: 'Blokkerer stoffer som gir betennelse i luftveiene.',
        sideEffects: ['Magesmerter', 'Hodepine'],
        warnings: 'Kan i sjeldne tilfeller påvirke humøret.',
        interaction: 'Visse epilepsimedisiner.',
        storage: 'Mørkt og tørt.',
        source: 'Felleskatalogen'
    },
    'Nasonex': {
        name: 'Nasonex',
        activeIngredient: 'Mometason',
        category: 'Nesepray (Kortison)',
        indication: 'Allergisk nesetetthet, polypper.',
        mechanism: 'Demper betennelse i nesen.',
        sideEffects: ['Neseblødning', 'Irritasjon i nesen'],
        warnings: 'Ristes før bruk.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Mage og Tarm ---
    'Movicol': {
        name: 'Movicol',
        activeIngredient: 'Makrogol',
        category: 'Avføringsmiddel',
        indication: 'Forstoppelse.',
        mechanism: 'Binder vann i tarmen og mykgjør avføring.',
        sideEffects: ['Luft i magen', 'Romling', 'Kvalme'],
        warnings: 'Løses i vann. Drikk rikelig.',
        interaction: 'Kan redusere opptak av andre medisiner (ta med tidsavstand).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Duphalac': {
        name: 'Duphalac',
        activeIngredient: 'Laktulose',
        category: 'Avføringsmiddel',
        indication: 'Forstoppelse.',
        mechanism: 'Binder vann i tarmen.',
        sideEffects: ['Luft i magen (særlig i starten)', 'Magesmerter'],
        warnings: 'Inneholder sukkerarter.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Nexium': {
        name: 'Nexium',
        activeIngredient: 'Esomeprazol',
        category: 'Protonpumpehemmer',
        indication: 'Sure oppstøt, halsbrann, magesår.',
        mechanism: 'Reduserer produksjonen av magesyre.',
        sideEffects: ['Hodepine', 'Magebesvær'],
        warnings: 'Langtidsbruk kan påvirke opptak av vitaminer.',
        interaction: 'Kan påvirke opptak av andre medisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Somac': {
        name: 'Somac',
        activeIngredient: 'Pantoprazol',
        category: 'Protonpumpehemmer',
        indication: 'Magesår, refluks.',
        mechanism: 'Hemmer syreproduksjon.',
        sideEffects: ['Godt tolerert, ev. hodepine'],
        warnings: 'Tas helst før frokost.',
        interaction: 'Færre interaksjoner enn andre PPI.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Idoform': {
        name: 'Idoform',
        activeIngredient: 'Melkesyrebakterier',
        category: 'Kosttilskudd/Mage',
        indication: 'Gjenopprette tarmflora, feriemage.',
        mechanism: 'Tilfører gode bakterier til tarmen.',
        sideEffects: ['Ingen vanlige'],
        warnings: 'Ingen spesielle.',
        interaction: 'Tas med avstand til antibiotika.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Imodium': {
        name: 'Imodium',
        activeIngredient: 'Loperamid',
        category: 'Stoppende middel',
        indication: 'Akutt diaré.',
        mechanism: 'Demper tarmbevegelsene.',
        sideEffects: ['Forstoppelse', 'Mageknip'],
        warnings: 'Skal ikke brukes ved blodig diaré eller høy feber.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Antibiotika og Infeksjon ---
    'Apocillin': {
        name: 'Apocillin',
        activeIngredient: 'Fenoksymetylpenicillin',
        category: 'Antibiotikum',
        indication: 'Luftveisinfeksjoner, halsbetennelse.',
        mechanism: 'Dreper bakterier.',
        sideEffects: ['Kvalme', 'Diaré', 'Utslett'],
        warnings: 'Allergi mot penicillin?',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Imacillin': {
        name: 'Imacillin',
        activeIngredient: 'Amoksicillin',
        category: 'Antibiotikum',
        indication: 'Luftveisinfeksjoner, ørebetennelse.',
        mechanism: 'Bredspektret penicillin.',
        sideEffects: ['Magebesvær', 'Utslett'],
        warnings: 'Kryssallergi med penicillin.',
        interaction: 'Metotreksat.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ery-Max': {
        name: 'Ery-Max',
        activeIngredient: 'Erytromycin',
        category: 'Antibiotikum',
        indication: 'Alternativ ved penicillinallergi, lungebetennelse.',
        mechanism: 'Hemmer bakterievekst.',
        sideEffects: ['Magesmerter', 'Kvalme'],
        warnings: 'Kan gi kraftige magesmerter hos noen.',
        interaction: 'Mange interaksjoner! Sjekk med lege.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Bactrim': {
        name: 'Bactrim',
        activeIngredient: 'Sulfametoksazol + Trimetoprim',
        category: 'Antibiotikum',
        indication: 'Urinveisinfeksjon, luftveisinfeksjon.',
        mechanism: 'Hemmer folsyresyntese.',
        sideEffects: ['Kvalme', 'Utslett'],
        warnings: 'Drikk rikelig.',
        interaction: 'Blodfortynnende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Doxylin': {
        name: 'Doxylin',
        activeIngredient: 'Doksysyklin',
        category: 'Antibiotikum',
        indication: 'Luftveisinfeksjoner, borreliose.',
        mechanism: 'Bredspektret.',
        sideEffects: ['Kvalme', 'Solømfintlighet'],
        warnings: 'Unngå soling. Tas med rikelig drikke (ikke melk).',
        interaction: 'Melk, jern, kalk (reduserer opptak).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Selexid': {
        name: 'Selexid',
        activeIngredient: 'Pivmecillinam',
        category: 'Antibiotikum',
        indication: 'Urinveisinfeksjon (blærekatarr).',
        mechanism: 'Dreper bakterier i urinen.',
        sideEffects: ['Kvalme', 'Soppinfeksjon'],
        warnings: 'Tas med rikelig drikke. Kan gi spiserørsirritasjon.',
        interaction: 'Valproat (epilepsimedisin).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Furadantin': {
        name: 'Furadantin',
        activeIngredient: 'Nitrofurantoin',
        category: 'Antibiotikum',
        indication: 'Urinveisinfeksjon.',
        mechanism: 'Hemmer bakterier.',
        sideEffects: ['Kvalme', 'Mørk urin'],
        warnings: 'Tas med mat.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Tamiflu': {
        name: 'Tamiflu',
        activeIngredient: 'Oseltamivir',
        category: 'Antiviralt middel',
        indication: 'Influensa.',
        mechanism: 'Hemmer virusspredning.',
        sideEffects: ['Kvalme', 'Hodepine'],
        warnings: 'Må startes innen 48 timer etter symptomstart.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Valtrex': {
        name: 'Valtrex',
        activeIngredient: 'Valaciklovir',
        category: 'Antiviralt middel',
        indication: 'Herpes, helvetesild.',
        mechanism: 'Hemmer virusformering.',
        sideEffects: ['Hodepine', 'Kvalme'],
        warnings: 'Drikk rikelig.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Psykisk Helse og Søvn ---
    'Cipralex': {
        name: 'Cipralex',
        activeIngredient: 'Escitalopram',
        category: 'Antidepressivum (SSRI)',
        indication: 'Depresjon, angst.',
        mechanism: 'Øker serotonin i hjernen.',
        sideEffects: ['Kvalme (i starten)', 'Seksuelle bivirkninger'],
        warnings: 'Ikke slutt brått. Virkning kommer gradvis.',
        interaction: 'Johannesurt, andre serotonerge midler.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Zoloft': {
        name: 'Zoloft',
        activeIngredient: 'Sertralin',
        category: 'Antidepressivum (SSRI)',
        indication: 'Depresjon, angst, tvangslidelse.',
        mechanism: 'Øker serotonin.',
        sideEffects: ['Magebesvær', 'Søvnvansker'],
        warnings: 'Se Cipralex.',
        interaction: 'Se Cipralex.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Remeron': {
        name: 'Remeron',
        activeIngredient: 'Mirtazapin',
        category: 'Antidepressivum',
        indication: 'Depresjon, særlig ved søvnvansker.',
        mechanism: 'Påvirker noradrenalin og serotonin.',
        sideEffects: ['Tretthet', 'Økt matlyst/vektøkning'],
        warnings: 'Tas om kvelden.',
        interaction: 'Alkohol forsterker tretthet.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Sobril': {
        name: 'Sobril',
        activeIngredient: 'Oksazepam',
        category: 'Beroligende',
        indication: 'Angst, uro.',
        mechanism: 'Dempende effekt (benzodiazepin).',
        sideEffects: ['Døsighet', 'Muskelsvakhet'],
        warnings: 'Avhengighetsskapende. Rød trekant.',
        interaction: 'Alkohol, sterke smertestillende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Valium': {
        name: 'Valium',
        activeIngredient: 'Diazepam',
        category: 'Beroligende',
        indication: 'Angst, muskelkramper.',
        mechanism: 'Benzodiazepin.',
        sideEffects: ['Døsighet'],
        warnings: 'Avhengighetsfare. Lang halveringstid.',
        interaction: 'Alkohol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Imovane': {
        name: 'Imovane',
        activeIngredient: 'Zopiklon',
        category: 'Sovemedisin',
        indication: 'Søvnvansker.',
        mechanism: 'Innsovningstablett.',
        sideEffects: ['Metallsmak i munnen', 'Døsighet dagen etter'],
        warnings: 'For kortvarig bruk. Vanedannende.',
        interaction: 'Alkohol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Stilnoct': {
        name: 'Stilnoct',
        activeIngredient: 'Zolpidem',
        category: 'Sovemedisin',
        indication: 'Innsovningsvansker.',
        mechanism: 'Virker raskt.',
        sideEffects: ['Hallusinasjoner (sjelden)', 'Hukommelsestap'],
        warnings: 'Tas umiddelbart før sengetid.',
        interaction: 'Alkohol.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Ritalin': {
        name: 'Ritalin',
        activeIngredient: 'Metylfenidat',
        category: 'Sentralstimulerende',
        indication: 'ADHD, narkolepsi.',
        mechanism: 'Øker dopamin og noradrenalin.',
        sideEffects: ['Nedsatt appetitt', 'Søvnvansker', 'Hjertebank'],
        warnings: 'Følg blodtrykk og puls.',
        interaction: 'MAO-hemmere.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Buccolam': {
        name: 'Buccolam',
        activeIngredient: 'Midazolam',
        category: 'Krampestillende (Nødmedisin)',
        indication: 'Akutt behandling av langvarige krampeanfall.',
        mechanism: 'Dempende effekt på hjernen (benzodiazepin).',
        sideEffects: ['Døsighet', 'Pustepåvirkning'],
        warnings: 'Gis i munnhulen. Følg nøye instruks for når den skal gis.',
        interaction: 'Forsterker andre sløvende medisiner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Stesolid': {
        name: 'Stesolid',
        activeIngredient: 'Diazepam',
        category: 'Krampestillende/Beroligende',
        indication: 'Krampeanfall, uro, angst.',
        mechanism: 'Benzodiazepin.',
        sideEffects: ['Døsighet', 'Muskelsvakhet'],
        warnings: 'Avhengighetsskapende ved lang bruk.',
        interaction: 'Alkohol, sterke smertestillende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Keppra': {
        name: 'Keppra',
        activeIngredient: 'Levetiracetam',
        category: 'Antiepileptikum',
        indication: 'Forebygging av epileptiske anfall.',
        mechanism: 'Stabiliserer nerveceller.',
        sideEffects: ['Tretthet', 'Irritabilitet', 'Humørsvingninger'],
        warnings: 'Ikke slutt brått.',
        interaction: 'Få interaksjoner.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Orfiril': {
        name: 'Orfiril',
        activeIngredient: 'Valproat',
        category: 'Antiepileptikum',
        indication: 'Epilepsi, bipolar lidelse.',
        mechanism: 'Øker GABA i hjernen.',
        sideEffects: ['Vektøkning', 'Skjelving', 'Hårtap'],
        warnings: 'Kan påvirke lever og blodplater.',
        interaction: 'Lamictal, aspirin.',
        storage: 'Tørt.',
        source: 'Felleskatalogen'
    },
    'Lamictal': {
        name: 'Lamictal',
        activeIngredient: 'Lamotrigin',
        category: 'Antiepileptikum',
        indication: 'Epilepsi, bipolar depresjon.',
        mechanism: 'Hemmer natriumkanaler.',
        sideEffects: ['Utslett (kan være alvorlig)', 'Hodepine'],
        warnings: 'Kontakt lege straks ved utslett! Opptrapping viktig.',
        interaction: 'P-piller, Orfiril.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Kvinne- og Mannshelse ---
    'Loette': {
        name: 'Loette',
        activeIngredient: 'Levonorgestrel + Etinyløstradiol',
        category: 'P-pille',
        indication: 'Prevensjon.',
        mechanism: 'Hemmer eggløsning.',
        sideEffects: ['Mellomblødninger', 'Humørsvingninger'],
        warnings: 'Økt risiko for blodpropp (lav).',
        interaction: 'Visse antibiotika, johannesurt.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Cerazette': {
        name: 'Cerazette',
        activeIngredient: 'Desogestrel',
        category: 'Minipille',
        indication: 'Prevensjon.',
        mechanism: 'Hemmer eggløsning, endrer slim.',
        sideEffects: ['Uregelmessige blødninger', 'Akne'],
        warnings: 'Tas til samme tid hver dag.',
        interaction: 'Ingen østrogen, lavere blodpropprisiko.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Vagifem': {
        name: 'Vagifem',
        activeIngredient: 'Østradiol',
        category: 'Lokalt østrogen',
        indication: 'Tørr skjede i overgangsalder.',
        mechanism: 'Tilfører østrogen lokalt.',
        sideEffects: ['Utflod'],
        warnings: 'Lokal virkning, lite systemisk opptak.',
        interaction: 'Ingen vesentlige.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Viagra': {
        name: 'Viagra',
        activeIngredient: 'Sildenafil',
        category: 'Potensmiddel',
        indication: 'Erektil dysfunksjon.',
        mechanism: 'Øker blodtilstrømning.',
        sideEffects: ['Hodepine', 'Rødming', 'Tett nese'],
        warnings: 'Farlig i kombinasjon med nitro-medisiner!',
        interaction: 'Nitroglyserin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Cialis': {
        name: 'Cialis',
        activeIngredient: 'Tadalafil',
        category: 'Potensmiddel',
        indication: 'Erektil dysfunksjon.',
        mechanism: 'Langtidsvirkende effekt.',
        sideEffects: ['Ryggsmerter', 'Hodepine'],
        warnings: 'Se Viagra.',
        interaction: 'Nitroglyserin.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },

    // --- Hud og Annet ---
    'Hydrokortison': {
        name: 'Hydrokortison',
        activeIngredient: 'Hydrokortison',
        category: 'Kortisonkrem (Mild)',
        indication: 'Eksem, insektstikk, solbrenthet.',
        mechanism: 'Demper kløe og betennelse.',
        sideEffects: ['Tynn hud ved lang bruk'],
        warnings: 'Ikke bruk i åpne sår.',
        interaction: 'Ingen.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Brulidine': {
        name: 'Brulidine',
        activeIngredient: 'Dibrompropamidin',
        category: 'Antiseptisk krem',
        indication: 'Småsår, kutt, skrubbsår.',
        mechanism: 'Dreper bakterier.',
        sideEffects: ['Svie'],
        warnings: 'Unngå langvarig bruk.',
        interaction: 'Ingen.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Bacimycin': {
        name: 'Bacimycin',
        activeIngredient: 'Bacitracin + Klorheksidin',
        category: 'Sårsalve',
        indication: 'Infiserte sår.',
        mechanism: 'Antibakteriell.',
        sideEffects: ['Allergi (sjelden)'],
        warnings: 'Ikke i øret.',
        interaction: 'Ingen.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Klorhexidin': {
        name: 'Klorhexidin',
        activeIngredient: 'Klorheksidin',
        category: 'Desinfeksjon',
        indication: 'Rens av sår.',
        mechanism: 'Dreper bakterier.',
        sideEffects: ['Svie'],
        warnings: 'Ikke i øret eller øyet.',
        interaction: 'Såpe (opphever effekten).',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    
    // --- Ernæring og Vitaminer ---
    'Nycoplus Multi': {
        name: 'Nycoplus Multi',
        activeIngredient: 'Vitaminer/Mineraler',
        category: 'Kosttilskudd',
        indication: 'Sikre inntak av næringsstoffer.',
        mechanism: '-',
        sideEffects: ['Ingen'],
        warnings: 'Ikke ta dobbel dose.',
        interaction: 'Ingen.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'D-vitamin': {
        name: 'D-vitamin',
        activeIngredient: 'Kolekalsiferol',
        category: 'Vitamin',
        indication: 'Forebygging av D-vitaminmangel.',
        mechanism: 'Viktig for skjelett og immunforsvar.',
        sideEffects: ['Ingen ved normal dose'],
        warnings: 'Overdose kan være skadelig.',
        interaction: 'Ingen.',
        storage: 'Mørkt.',
        source: 'Felleskatalogen'
    },
    'Nutrini peptisorb': {
        name: 'Nutrini peptisorb',
        activeIngredient: 'Sondenæring',
        category: 'Medisinsk ernæring',
        indication: 'Sondenæring for barn med malabsorpsjon.',
        mechanism: 'Lettfordøyelig næring.',
        sideEffects: ['Diaré (hvis gitt for raskt)'],
        warnings: 'Ristes før bruk.',
        interaction: '-',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    
    // --- Kvalme ---
    'Emend': {
        name: 'Emend',
        activeIngredient: 'Aprepitant',
        category: 'Kvalmestillende',
        indication: 'Forebygger kvalme ved cellegift.',
        mechanism: 'Blokkerer NK1-reseptorer.',
        sideEffects: ['Tretthet', 'Hikke'],
        warnings: 'Tas før kur.',
        interaction: 'P-piller, blodfortynnende.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    },
    'Zofran': {
        name: 'Zofran',
        activeIngredient: 'Ondansetron',
        category: 'Kvalmestillende',
        indication: 'Kvalme etter operasjon eller cellegift.',
        mechanism: 'Blokkerer serotoninsignaler.',
        sideEffects: ['Hodepine', 'Forstoppelse'],
        warnings: 'Kan påvirke hjerterytmen.',
        interaction: 'Andre medisiner som påvirker hjertet.',
        storage: 'Romtemperatur.',
        source: 'Felleskatalogen'
    }
};

// Expose database globally
window.medicineDatabase = medicineDatabase;

// Function to show medicine info modal
async function showMedicineInfo(medicineName) {
    if (!medicineName) return;
    medicineName = medicineName.trim();
    
    // Try to find exact match first
    let info = medicineDatabase[medicineName];
    
    // If not found, try partial match (case insensitive)
    if (!info) {
        const lowerName = medicineName.toLowerCase();
        for (const key in medicineDatabase) {
            if (key.toLowerCase() === lowerName || 
                key.toLowerCase().includes(lowerName) || 
                lowerName.includes(key.toLowerCase())) {
                info = medicineDatabase[key];
                break;
            }
        }
    }
    
    // If still not found, try to fetch from OpenFDA
    if (!info) {
        // Show loading state
        showLoadingModal(medicineName);
        
        try {
            // Try to fetch from API
            info = await fetchMedicineInfoExternal(medicineName);
        } catch (err) {
            console.error('Error fetching medicine info:', err);
            info = null;
        } finally {
            // Close loading modal and ensure backdrop is removed
            const loadingModal = document.getElementById('medicineLoadingModal');
            if (loadingModal) {
                const modalInstance = bootstrap.Modal.getInstance(loadingModal);
                if (modalInstance) modalInstance.hide();
                loadingModal.remove();
                
                // Aggressive cleanup of lingering backdrops
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
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
    'indications': 'indikasjoner',
    
    // Additional translations for FDA data
    'active ingredient': 'virkestoff',
    'inactive ingredients': 'hjelpestoffer',
    'purpose': 'formål',
    'keep out of reach of children': 'oppbevares utilgjengelig for barn',
    'directions': 'bruksanvisning',
    'uses': 'bruksområder',
    'ask a doctor': 'spør lege',
    'stop use': 'avslutt bruk',
    'symptoms': 'symptomer',
    'occur': 'oppstå',
    'persist': 'vedvarer',
    'contains': 'inneholder',
    'daily': 'daglig',
    'adults and children': 'voksne og barn',
    'years of age and older': 'år og eldre',
    'under 12 years of age': 'under 12 år',
    'take': 'ta',
    'every': 'hver',
    'hours': 'timer',
    'minutes': 'minutter',
    'not more than': 'ikke mer enn',
    'directed by a doctor': 'anvist av lege',
    'administration': 'administrering',
    'adverse': 'uønskede',
    'reaction': 'reaksjon',
    'hypersensitivity': 'overfølsomhet',
    'renal': 'nyre',
    'hepatic': 'lever',
    'impairment': 'nedsatt funksjon',
    'discontinue': 'avbryt',
    'monitor': 'overvåk',
    'risk': 'risiko',
    'increased': 'økt',
    'decreased': 'redusert',
    'associated with': 'forbundet med',
    'following': 'følgende',
    'include': 'inkluderer',
    'including': 'inkludert',
    'such as': 'slik som',
    'due to': 'på grunn av',
    'because of': 'på grunn av',
    'history of': 'historie med',
    'prior to': 'før',
    'concomitant': 'samtidig',
    'use': 'bruk',
    'safety': 'sikkerhet',
    'efficacy': 'effekt',
    'administer': 'gi',
    'recommended': 'anbefalt',
    'patients': 'pasienter',
    'with': 'med',
    'without': 'uten',
    'or': 'eller',
    'and': 'og',
    'the': 'den/det',
    'of': 'av',
    'in': 'i',
    'to': 'til',
    'for': 'for',
    'is': 'er',
    'are': 'er',
    'not': 'ikke',
    'be': 'være',
    'have': 'ha',
    'has': 'har',
    'may': 'kan',
    'can': 'kan',
    'will': 'vil',
    'should': 'bør'
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
    
    // Helper to clean name (remove dosage, form, etc.)
    const cleanName = (name) => {
        return name
            .replace(/\d+(\s?mg|\s?ml|\s?g|\s?mikrog)/gi, '') // Remove dosage (500mg, 10 ml)
            .replace(/\(.*\)/g, '') // Remove parentheses content
            .replace(/tabletter|mikstur|dråper|kapsler|salve|krem/gi, '') // Remove form
            .trim();
    };

    const tryFetch = async (query) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000); // 8s timeout
        try {
            const response = await fetch(
                `https://api.fda.gov/drug/label.json?search=${query}&limit=1`,
                { signal: controller.signal }
            );
            clearTimeout(id);
            if (response.ok) return await response.json();
            return null;
        } catch (e) {
            clearTimeout(id);
            return null;
        }
    };

    try {
        let data = null;
        const name = encodeURIComponent(medicineName);
        
        // 1. Try exact match on brand name
        data = await tryFetch(`openfda.brand_name:"${name}"`);
        
        // 2. Try exact match on generic name
        if (!data) {
            data = await tryFetch(`openfda.generic_name:"${name}"`);
        }

        // 3. Try cleaned name if different
        const cleaned = cleanName(medicineName);
        if (!data && cleaned && cleaned !== medicineName) {
            console.log(`Retrying with cleaned name: ${cleaned}`);
            const cleanedEnc = encodeURIComponent(cleaned);
            data = await tryFetch(`openfda.brand_name:"${cleanedEnc}"`);
            if (!data) {
                data = await tryFetch(`openfda.generic_name:"${cleanedEnc}"`);
            }
        }
        
        // 4. Try fuzzy search as last resort (no quotes)
        if (!data) {
             data = await tryFetch(`openfda.brand_name:${name}`);
        }

        if (data) {
            return parseOpenFDAResponse(data, medicineName);
        }
        
        console.log('OpenFDA: No results found');
        return null;
        
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
    window.medicineDatabase[originalName] = info;
    
    // Save to Firestore for persistence
    if (typeof saveCustomMedicineToFirestore === 'function') {
        saveCustomMedicineToFirestore(info);
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

// Add info to medicine database dynamically (synced with Firestore)
function addMedicineToDatabase(name, info) {
    medicineDatabase[name] = info;
    
    // Save to Firestore
    if (typeof saveCustomMedicineToFirestore === 'function') {
        saveCustomMedicineToFirestore(info)
            .then(() => console.log('Custom medicine info saved to Firestore'))
            .catch(err => console.error('Error saving custom medicine:', err));
    }
}

// Merge custom medicines from Firestore (called by firebase-config.js)
window.mergeCustomMedicines = function(customMedicines) {
    if (!customMedicines) return;
    
    console.log('Merging custom medicines from Firestore:', Object.keys(customMedicines).length);
    Object.assign(medicineDatabase, customMedicines);
};

// Legacy function (kept for compatibility but does nothing with localStorage)
function loadCustomMedicineInfo() {
    // No-op: data is loaded via Firestore sync
    console.log('Custom medicine info loading via Firestore sync...');
}

// Initialize
// loadCustomMedicineInfo(); // No need to call, sync handles it

// Initialize custom dropdown logic
function initMedicineDropdown() {
    const input = document.getElementById('newMedicineName');
    const suggestions = document.getElementById('medicineSuggestions');
    
    if (!input || !suggestions) return;

    // Handle input
    input.addEventListener('input', () => {
        const value = input.value.trim().toLowerCase();
        
        // Hide if empty
        if (!value) {
            suggestions.style.display = 'none';
            return;
        }
        
        // Filter medicines
        const matches = Object.keys(medicineDatabase).filter(name => 
            name.toLowerCase().includes(value)
        ).sort((a, b) => {
            // Prioritize startsWith
            const aStarts = a.toLowerCase().startsWith(value);
            const bStarts = b.toLowerCase().startsWith(value);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.localeCompare(b, 'no');
        });
        
        // Show suggestions
        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(name => `
                <button type="button" class="list-group-item list-group-item-action" onclick="selectMedicine('${name}')">
                    ${name}
                </button>
            `).join('');
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    });
    
    // Hide when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

// Select medicine from dropdown
window.selectMedicine = function(name) {
    const input = document.getElementById('newMedicineName');
    const suggestions = document.getElementById('medicineSuggestions');
    
    if (input) {
        input.value = name;
        // Optionally trigger change event if needed
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    }
    
    if (suggestions) {
        suggestions.style.display = 'none';
    }
};

// Call on load and when database updates
document.addEventListener('DOMContentLoaded', () => {
    // populateMedicineDatalist(); // Legacy datalist
    initMedicineDropdown(); // New custom dropdown
});
// Also call immediately in case DOM is ready
initMedicineDropdown();

// Hook into mergeCustomMedicines to update list
const originalMerge = window.mergeCustomMedicines;
window.mergeCustomMedicines = function(customMedicines) {
    if (originalMerge) originalMerge(customMedicines);
    else {
        if (!customMedicines) return;
        Object.assign(medicineDatabase, customMedicines);
    }
    // populateMedicineDatalist(); // Legacy
    // No need to repopulate custom dropdown as it filters live
};
