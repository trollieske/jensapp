# 💊 Dosevakt - Medisin & Omsorgslogg for Jens

En moderne Progressive Web App (PWA) for sanntidslogging av medisiner, sondemat, og helse for personer med spesielle omsorgsbehov. Designet for familiebruk med multi-bruker støtte og sanntidssynkronisering via Firebase.

**Versjon:** v18 (Januar 2026)  
**Sist oppdatert:** 29. januar 2026

## 🌐 Live App

**🔗 Primær URL:** https://jensapp-14069.web.app (Firebase Hosting)  
**🔗 Alternativ:** https://jensapp.pages.dev (Cloudflare Pages)

## ✨ Hovedfunksjoner

### 👥 Multi-bruker med sanntidssynkronisering
- Bytt mellom brukere (TEL, Mari, eller egendefinert)
- Alle logger viser hvem som registrerte dem
- Dynamisk brukerliste basert på historikk
- Data synkroniseres automatisk mellom alle enheter via Firebase Firestore

### 📋 Kategorisert Medisinliste
- **🌅 Dagtid**: Medisiner som gis på morgenen/middagen
- **🌙 Kveld**: Kveldsmedisiner
- **⏰ Spesiell dosering**: Medisiner med spesielle intervaller
  - Bactrim (kun helg - lørdag/søndag)
  - Palonosetron (hver 3. dag, vises kun når det er tid)
- **🎯 Ved behov (PRN)**: Medisiner som gis kun ved behov

### 💊 Medisininfo-system
- **Lokal database**: Norsk informasjon om alle Jens sine medisiner
- **OpenFDA-integrasjon**: Automatisk oppslag for ukjente medisiner
- **Oversettelse**: 200+ medisinske termer oversettes automatisk til norsk
- **Trykk ⓘ-knappen** på en medisin for å se bruksområde, virkningsmekanisme, bivirkninger, advarsler, interaksjoner og oppbevaring

### ➕ Legg til nye medisiner
- Legg til egendefinerte medisiner i sjekklisten
- Velg kategori: Morgen, Kveld, Begge (legges til i begge), eller Ved behov
- Sett valgfritt tidspunkt for faste medisiner
- Slett egendefinerte medisiner med bekreftelsesdialog

### 🔔 Push-varsler med Cloud Functions
- Scheduled Cloud Functions kjører hvert minutt
- Sender push notifications til ALLE registrerte enheter
- Fungerer selv når appen er lukket eller i bakgrunnen
- Plattformspesifikke instruksjoner for iOS/Android
- **iOS fallback via Pushover**: Hvis web push-token mangler på iOS PWA, sendes varsler via Pushover

### 📋 Logging & Historikk
- Medisin, sondemat, avføring (Bristol Scale), urinering
- Sanntids oppdatering på alle enheter
- Søkbar og filtrerbar historikk
- CSV-eksport for legebesøk

## 🚀 Kom i gang

### 📱 Installere som app

#### iPhone/iPad:
1. Åpne https://jensapp.pages.dev i Safari
2. Trykk **Del-knappen** (↗️) nederst i skjermen
3. Velg **"Legg til på Hjem-skjerm"**
4. Åpne appen fra hjemskjermen (viktig for push-varsler!)
5. Velg bruker og aktiver notifikasjoner

#### Android:
1. Åpne https://jensapp.pages.dev i Chrome
2. Trykk menyknappen (⋮) → "Legg til på startskjerm"
3. Åpne appen og aktiver notifikasjoner

### 💻 Lokal utvikling
```bash
# Klon repository
git clone https://github.com/trollieske/jensapp.git
cd jensapp

# Kjør lokal server
python -m http.server 8000
# eller
npx serve

# Åpne http://localhost:8000
```

## 📚 Prosjektstruktur

```
jensapp/
├── index.html              # Hoved-HTML med Bootstrap UI
├── app.js                  # Core app logic & Firebase realtime sync
├── firebase-config.js      # Firebase initialisering & FCM token handling
├── dosing-plan.js          # Doseringsplan builder
├── medicine-info.js        # Medisininfo-system med OpenFDA API
├── sw.js                   # Service Worker for PWA & offline support (v15)
├── manifest.json           # PWA manifest
├── logo.svg                # SVG logo for header
├── logo-full.png           # Full-størrelse logo for hjemskjerm
├── favicon.png             # Favicon/header-ikon
├── icon-192.png            # PWA-ikon 192x192
├── icon-512.png            # PWA-ikon 512x512
├── wrangler.jsonc          # Cloudflare Pages config
├── firebase.json           # Firebase project config
├── functions/
│   ├── index.js            # Cloud Functions (scheduled reminders)
│   ├── package.json        # Node.js dependencies
│   └── .eslintrc.js        # ESLint config
└── .firebase/              # Firebase deployment cache
```

## 🛠️ Teknisk arkitektur

### Frontend
- **HTML/CSS/JS**: Vanilla JavaScript, Bootstrap 5
- **PWA**: Service Worker, offline support, installable
- **Design**: Gradient bakgrunn, responsive layout, mobile-first

### Backend & Database
- **Firebase Firestore**: NoSQL database for sanntidssynkronisering
  - `logs` collection: Alle medisiner/mat/helse-logger
  - `reminders` collection: Påminnelser med tidspunkt
  - `fcmTokens` collection: FCM tokens fra registrerte enheter
- **Firebase Cloud Functions (v2)**:
  - `checkReminders`: Scheduled function (every 1 minute) som sjekker påminnelser
  - `saveFcmTokenHttp`: HTTP function for å registrere FCM tokens
  - `testPush`: Sender test-varsel til alle registrerte tokens + Pushover
  - `debugPushStatus`: Returnerer tokenCount, siste oppdateringstid og Pushover-konfig status
- **Firebase Cloud Messaging (FCM)**: Push notifications til alle enheter
- **Pushover**: Failover-kanal for iOS PWA (bruker API Token + User Key)

### Deployment
- **Cloudflare Pages**: Static hosting med automatic git deployments
- **Firebase Blaze Plan**: Cloud Functions (gratis kvote: 2M invocations/måned)

### Dataflyt
```
[Bruker registrerer logg]
         ↓
[app.js: saveLogToFirestore()]
         ↓
[Firebase Firestore]
         ↓
[Realtime Listener på alle enheter]
         ↓
[UI oppdateres automatisk]
```

### Push Notifications Flyt
```
[Bruker aktiverer varsler]
         ↓
[FCM token genereres]
         ↓
[saveFcmTokenHttp Cloud Function]
         ↓
[Token lagres i Firestore]

[Hver minutt:]
[checkReminders Cloud Function]
         ↓
[Sjekker om påminnelse matcher current time (Europe/Oslo)]
         ↓
[Sender FCM melding til alle tokens]
         ↓
[iOS PWA fallback via Pushover hvis token mangler]
         ↓
[Push notification vises på alle enheter]
```

## 🔧 Utvikling & Deployment

### Firebase Setup
```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login til Firebase
firebase login

# Initialiser Functions (allerede gjort)
firebase init functions

# Deploy Cloud Functions
firebase deploy --only functions
```

### Cloud Functions Development
```bash
cd functions
npm install
npm run lint          # Sjekk kodekvalitet
firebase emulators:start  # Test lokalt
```

### Cloudflare Pages Deployment
- **Automatic**: Push til `main` branch deployer automatisk
- **Manual**: Via Cloudflare Dashboard
- **Build settings**: Static site (ingen build command nødvendig)

### Testing Push Notifications Locally
1. Kjør Firebase Emulators
2. Test FCM token registrering
3. Test scheduled functions manuelt
4. Test status og Pushover

#### Endepunkter
- `saveFcmTokenHttp`: https://savefcmtokenhttp-a2ims7es6a-uc.a.run.app
- `testPush`: https://testpush-a2ims7es6a-uc.a.run.app
- `debugPushStatus`: https://us-central1-jensapp-14069.cloudfunctions.net/debugPushStatus

#### Pushover-konfigurasjon
- User Key: settes i Cloud Functions
- API Token: settes i Cloud Functions (se `PUSHOVER_API_TOKEN`)
- iOS-status i appen viser: **“Aktivert via Pushover ✅”** når FCM-token mangler

## 🔒 Personvern & Sikkerhet
- **Firebase Firestore**: Data lagres i Google Cloud (Europa-region)
- **Offline-first**: Firestore caching gir offline støtte
- **Ingen tredjepartsanalyse**: Ingen Google Analytics, Facebook Pixel, etc.
- **FCM Tokens**: Kun brukt for push notifications, ingen tracking
- **GDPR-compliant**: All data kan slettes via Firebase Console

## 📊 Datamodell

### Firestore Collections

#### `logs`
```json
{
  "id": 1737812400000,
  "type": "Medisin",
  "name": "Bactrim",
  "amount": 10,
  "unit": "ml",
  "time": "2024-01-25T08:00",
  "timestamp": 1737812400000,
  "notes": "Gitt med frokost",
  "loggedBy": "Mari",
  "loggedAt": Timestamp
}
```

#### `reminders`
```json
{
  "id": 1737812400000,
  "name": "Bactrim morgen",
  "time": "08:00",
  "createdBy": "TEL",
  "createdAt": Timestamp
}
```

#### `fcmTokens`
```json
{
  "token": "dA1B2c3D4e5...",
  "userId": "Mari",
  "updatedAt": Timestamp
}
```

## 🆘 Feilsøking

### Push-varsler fungerer ikke

**iPhone/iPad:**
1. Sjekk at appen er **installert på hjemskjermen** (ikke Safari)
2. Åpne appen fra hjemskjermen, IKKE Safari
3. Gå til iOS Innstillinger → Notifikasjoner → Jensapp
4. Sjekk at "Tillat notifikasjoner" er på

**Android:**
1. Sjekk at Chrome har notifikasjonstillatelse
2. Android Innstillinger → Apper → Chrome → Notifikasjoner
3. Sjekk Firebase Cloud Functions logs i Firebase Console

**Alle plattformer:**
```bash
# Sjekk Cloud Functions logs
firebase functions:log

# Test manuelt at scheduled function kjører
# Se Firebase Console → Functions → checkReminders → Logs
```

### Data synkroniserer ikke
1. Sjekk internettforbindelse
2. Åpne Developer Console (F12) → Console
3. Se etter Firestore-feil
4. Sjekk at Firebase config er korrekt i `firebase-config.js`

### Appen laster ikke
1. Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. Clear cache og reload
3. Sjekk Developer Console for feilmeldinger

## 💊 Medisinliste

### Dagtid (🌅)
- **Bactrim** 10 ml - Kun helg (lørdag/søndag)
- **Nycoplus Multi Barn** 1 tablett
- **Nexium** 1-2 poser
- **Emend** 40 mg

### Kveld (🌙)
- **Bactrim** 10 ml - Kun helg (lørdag/søndag)
- **Zyprexa** 1.25-2.5 mg

### Spesiell dosering (⏰)
- **Palonosetron** 500 μg - Hver 3. dag (vises kun når aktuelt)

### Ved behov - PRN (🎯)
- **Paracetamol** 300 mg (maks 4 doser/døgn)
- **Movicol** 1 pose (avføringsregulerende)
- **Deksklorfeniramin** 1 mg (antihistamin)
- **Ibuprofen** 200 mg (betennelsesdempende)

### Sondemat
- **Nutrini peptisorb** 1300 ml daglig

> **Redigere medisinlisten**: Se `app.js` linje 6-30 for å endre medisiner, doser eller kategorier.

## 🛣️ Roadmap

### ✅ Fullført
- ✅ Multi-bruker med sanntidssynkronisering
- ✅ Firebase Firestore integration
- ✅ Cloud Functions for scheduled push notifications
- ✅ Kategorisert medisinliste (dag/kveld/spesiell/PRN)
- ✅ Weekend-only og every-3-days scheduling
- ✅ iOS PWA installation guide
- ✅ Cloudflare Pages + Firebase Hosting deployment
- ✅ CSV export
- ✅ Medisininfo-system med lokal database og OpenFDA API
- ✅ Legg til egendefinerte medisiner med kategorivalg
- ✅ Slett-funksjon for medisiner med bekreftelse
- ✅ Migrering av gamle medisiner uten kategori
- ✅ Ny hjemside med gradient-kort design
- ✅ Logo og header redesign
- ✅ Forbedret påminnelse-UI med tidlagring
- ✅ 200+ medisinske termer oversatt til norsk

### 📅 Planlagt
- 📈 Grafer og visualiseringer (Chart.js)
- 📸 Bilder/vedlegg på logger
- 📊 Statistikk-dashboard
- 📝 PDF-rapporter for legebesøk
- 🔔 Reminder snooze-funksjon
- 💬 In-app chat mellom brukere
- 🤖 AI-basert medisininteraksjon warnings

## 👥 Bidragsytere
- **Tomer Klarsen** - Initial development, Firebase integration, Cloud Functions
- **Warp AI** - Architecture design, bug fixes, documentation

## 📃 Endringslogg
### v17 (28. januar 2026)
- **Strukturell omskriving**: Kodebasen er splittet i moduler (`data.js`, `ui.js`, `utils.js`, `app.js`) for bedre vedlikehold
- **Designoppdatering**:
  - Ny hamburgermeny (Bootstrap Offcanvas)
  - Kompakt header (120px) for mer skjermplass
  - Bytte til SVG-logo for skarpere visning
  - Fjernet store/unødvendige elementer fra forsiden
- **Ytelse**: Fjernet duplikatkode og optimalisert lasting
- **Bugfiks**: Rettet visning av brukere og logo i menyer

### v16 (27. januar 2026)
- **Pushover fallback (iOS)**: Varsler leveres via Pushover når FCM-token mangler på iOS PWA
- **debugPushStatus**: Nytt status-endepunkt for å se antall tokens og siste oppdateringstid
- **UI**: Notifikasjonsstatus på iOS viser nå “Aktivert via Pushover ✅”
- **Scheduled push**: Forbedret `checkReminders` med idempotens (2 min) og APNs time-sensitive
- **Test endpoints**: Dokumenterte `testPush` og `saveFcmTokenHttp`

### v15 (25. januar 2026)
- **Legg til medisin redesignet**: Kategorivalg (Morgen/Kveld/Begge/Ved behov), tidspunkt-input
- **Slett-funksjon**: Egendefinerte medisiner kan slettes med bekreftelsesdialog
- **Migrering**: Gamle medisiner uten kategori flyttes automatisk til "Ved behov"
- **Forbedret oversettelse**: Utvidet ordbok fra ~50 til 200+ medisinske termer
- Service worker oppdatert til v15

### v14 (24. januar 2026)
- **Medisininfo-system**: Ny `medicine-info.js` med lokal database og OpenFDA-integrasjon
- **Info-knapp (ⓘ)**: Vises ved hver medisin i sjekklisten
- **Norsk oversettelse**: Automatisk oversettelse av engelske medisinske termer
- **Loading-indikator**: Viser modal mens medisininfo hentes fra API

### v13 (23. januar 2026)
- **Påminnelser forbedret**: Nytt design med to-linje layout og Lagre-knapp
- **Font-size 16px**: Forhindrer iOS zoom på input-felter
- **Fikset time-input bug**: Endret fra onchange til Lagre-knapp

### v12 (22. januar 2026)
- **Logo og header redesign**: Ny favicon og logo-full
- **Hjemskjerm redesignet**: Gradient-kort med hurtigvalg-knapper
- **Firebase Hosting**: Migrerte fra kun Cloudflare til Firebase Hosting som primær

### v11 og tidligere
- Initial Firebase Firestore integration
- Multi-bruker støtte
- Push notifications via Cloud Functions
- PWA med offline-støtte
- Kategorisert medisinliste

## 📝 Lisens
Private project - ikke for kommersiell bruk.

## 📧 Kontakt
For spørsmål: tomeriklarsen1@gmail.com

---

<div align="center">

**Laget med ❤️ for Jens og familie**

👨‍⚕️ Medisinsk informasjon kun til informasjonsformål  
🚨 Kontakt alltid lege ved medisinske spørsmål

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

</div>
