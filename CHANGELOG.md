# Endringslogg - Dosevakt (Jens Medisinapp)

**Siste versjon:** v24  
**Sist oppdatert:** 29. januar 2026  
**Repository:** https://github.com/trollieske/jensapp  
**Live URL:** https://jensapp-14069.web.app

---

## v24 (29. januar 2026) - Splash Screen Comeback

### 🎬 Visuell Oppgradering
- **Splash Screen**: Gjeninnført `dosevakt.mp4` som oppstartsskjerm. Gir en profesjonell og smooth velkomst.
- **Auto-hide**: Videoen spiller automatisk (dempet) og forsvinner sømløst når den er ferdig, eller etter maks 5 sekunder.

---

## v23 (29. januar 2026) - Sikker Pålogging og Datasikkerhet

### 🔐 Sikker Pålogging (oAuth)
- **Google Innlogging**: Logg inn sikkert med din Google-konto.
- **E-post/Passord**: Mulighet for å registrere seg med e-post og passord.
- **Brukervennlig**: Automatisk gjenkjenning av innlogget bruker.
- **Dataintegritet**: Historiske data er bevart og tilgjengelig for alle innloggede brukere.

### 🛡️ Datasikkerhet
- **Firestore Rules**: Implementert strenge sikkerhetsregler.
- **Tilgangskontroll**: Kun autentiserte brukere har lese- og skrivetilgang til databasen.
- **Personvern**: Beskytter sensitive helsedata mot uautorisert tilgang.

### 🛠️ Tekniske Oppdateringer
- **Versjonshåndtering**: Oppdatert alle filer til v23 for å sikre at alle brukere får siste versjon.
- **Service Worker**: Oppdatert cache-strategi for umiddelbar oppdatering.

---

## v19 (29. januar 2026) - AI-oppslag og Skanner

### 🧠 AI-drevet Medisinoppslag
- **Google Generative AI**: Byttet fra regelbasert oversettelse til full AI-oversettelse via Google Gemini.
- **Bedre kvalitet**: Fikset problemer med blanding av norsk og engelsk i OpenFDA-data.
- **Cache-validering**: Implementert logikk for å tvinge frem nye oversettelser ved behov (f.eks. C-vitamin).

### 📱 Medisinscanner
- **Hjem-skjerm**: "Medisinscanner" har nå fått en prominent plass på Hjem-skjermen for rask tilgang.
- **Nytt menyvalg**: Også tilgjengelig som hurtigvalg i Medisinplanlegger.
- **Cache-fix**: Tvunget oppdatering av app-filer for å sikre at alle får siste versjon.
- **Hurtigtilgang**: Åpner skanneren umiddelbart uten å måtte navigere gjennom SplTools.

### 🛠️ Forbedringer
- **Deploy-fiks**: Løst problemer med sletting av `analyzeWithGemini` under deploy.
- **Parallellisering**: Raskere oversettelse ved å kjøre forespørsler parallelt.

---

## v18 (29. januar 2026) - Stabilitet og Pushover-fiks

### 🚀 Gjenoppretting og Stabilitet
- **Rollback av AI-funksjoner**: Deaktivert ustabile AI-funksjoner for å sikre kjernefunksjonalitet.
- **Fokus på stabilitet**: Gjeninnført velprøvd logikk for medisinliste og logging.

### 🔔 Varsling (Pushover & FCM)
- **Robust Pushover-integrasjon**: 
  - Fikset kritiske feil med ugyldige tokens (whitespace trimming implementert).
  - Oppdatert `sendPushoverNotification` til å returnere detaljerte feilmeldinger for enklere feilsøking.
  - Sikret at hemmeligheter (`PUSHOVER_API_TOKEN`, `PUSHOVER_USER_KEY`) hentes korrekt fra Firebase Secrets.
- **Dynamisk testing**: Oppdatert `testPush` cloud function til å støtte dynamisk tittel og melding for testing.

### 🛠️ Tekniske forbedringer
- **Linting**: Ryddet opp i JSDoc og kodesstil i `functions/index.js`.
- **PowerShell-kompatibilitet**: Tilpasset test-skript for Windows-miljø (Invoke-RestMethod).
- **Feilhåndtering**: Bedre logging av varslingsstatus i backend.

---

## v15 (25. januar 2026) - Kategorivalg og slett-funksjon

### Nye funksjoner
- **Kategorivalg ved ny medisin**: Modal for "Legg til medisin" har nå fire valg:
  - 🌅 Morgen (kategori: `dag`)
  - 🌙 Kveld (kategori: `kveld`)  
  - 🔄 Begge (legger til to entries: dag + kveld)
  - 🎯 Ved behov (kategori: `prn`)
- **Tidspunkt-input**: Valgfritt felt for å sette fast tidspunkt for medisiner
- **Slett-funksjon**: Egendefinerte medisiner har nå en søppelkasse-knapp (🗑️)
  - Kun synlig på medisiner med `isCustom: true`
  - Bekreftelsesdialog: "Er du sikker på at du vil slette..."
- **Automatisk migrering**: `migrateOldMedicines()` kjøres ved oppstart
  - Medisiner uten `category`-felt får `category: 'prn'` og `isCustom: true`
  - Løser problemet med Marevan og andre medisiner som ikke vistes

### Forbedringer
- **Utvidet oversettelsesordbok**: Fra ~50 til 200+ medisinske termer
  - Nye kategorier: legemiddeltyper, bivirkninger, kroppsdeler, medisinske tilstander
  - Nye fraser: instruksjoner, advarsler, doseringsinformasjon
- **Service worker v15**: Cache oppdatert med nye filer

### Tekniske endringer
- `app.js`:
  - `addNewMedicineToChecklist()`: Leser kategorivalg fra radio-knapper, håndterer "begge" ved å legge til to entries
  - `deleteMedicineFromChecklist(name, category)`: Ny funksjon for sletting
  - `migrateOldMedicines()`: Kjøres automatisk ved oppstart
  - `renderMedicineItem()`: Viser slett-knapp for egendefinerte medisiner
- `medicine-info.js`:
  - `medicalTranslations`: Utvidet fra ~50 til 200+ termer
- `index.html`:
  - Modal redesignet med radio-knapper for kategorivalg
  - Tidspunkt-input felt lagt til

### Filer endret
- `app.js` (linjer 1302-1427, 586-630)
- `medicine-info.js` (linjer 308-553)
- `index.html` (linjer 1060-1116)
- `sw.js` (linje 1: cache name)

---

## v14 (24. januar 2026) - Medisininfo-system

### Nye funksjoner
- **Medisininfo-system**: Ny `medicine-info.js` med komplett system
  - Lokal database med norsk informasjon om alle Jens sine medisiner
  - OpenFDA API-integrasjon for ukjente medisiner
  - Automatisk oversettelse fra engelsk til norsk
- **Info-knapp (ⓘ)**: Vises ved hver medisin i sjekklisten
  - Trykk for å se: bruksområde, virkningsmekanisme, bivirkninger, advarsler, interaksjoner, oppbevaring
- **Loading-modal**: Vises mens medisininfo hentes fra API

### Tekniske detaljer
- `medicine-info.js` (ny fil, 516 linjer):
  - `medicineDatabase`: Lokal database med norsk medisininfo
  - `showMedicineInfo(name)`: Hovedfunksjon som viser info-modal
  - `fetchMedicineInfoExternal(name)`: Henter fra OpenFDA API
  - `translateToNorwegian(text)`: Oversetter engelske termer
  - `extractAndTranslate()`, `extractSideEffects()`: Parserer API-respons
  - `medicalTranslations`: Ordbok med ~50 medisinske termer

---

## v13 (23. januar 2026) - Påminnelse-forbedringer

### Bugfiks
- **Time-input zoom på iOS**: Fikset ved å sette `font-size: 16px`
- **Påminnelse-tidspunkt endres umiddelbart**: Endret fra `onchange` til "Lagre"-knapp

### UI-forbedringer
- **Påminnelse-kort redesignet**:
  - To-linje layout: navn øverst, tid + knapper under
  - Lagre-knapp ved siden av tidsinput
  - Slett-knapp med ikon

### Tekniske endringer
- `app.js`:
  - `displayReminders()`: Nytt design med flex-layout
  - `saveReminderTime(reminderId)`: Ny funksjon for å lagre tidendringer
  - Alle time-inputs har nå `font-size: 16px`

---

## v12 (22. januar 2026) - Logo og Firebase Hosting

### Nye funksjoner
- **Firebase Hosting**: Migrerte til Firebase som primær hosting
  - URL: https://jensapp-14069.web.app
  - Cloudflare Pages beholdt som backup
- **Logo og header redesign**:
  - Ny `logo-full.png` for hjemskjerm (120px)
  - Ny `favicon.png` for header (36px)
  - Header viser favicon + "Dosevakt" tekst

### UI-forbedringer
- **Hjemskjerm redesignet**:
  - Gradient-kort i 2x2 grid for hovedseksjoner
  - "Hurtigvalg"-seksjon med raske handlinger
  - Moderne utseende med avrundede hjørner og skygger

---

## Tidligere versjoner (v1-v11)

## 2026-01-24 - Sjekkliste-forbedringer

### Endringer implementert:

#### Versjon 1.0 - Grunnleggende sjekkliste
- Lagt til ny "Sjekkliste"-tab som standardvisning
- Quick-log funksjonalitet for medisiner
- Visuell indikator (grønn) når medisin er gitt i dag
- Teller for antall doser per medisin
- Rask-knapper for toalettlogging

#### Versjon 1.1 - Forbedringer (IMPLEMENTERT 24.01.2026 kl 11:09)
**Problemer fikset:**
1. ✅ Avføring/urinering logging er nå forbedret med fullstendige dialogs
2. ✅ Lagt til input-felt for å justere mengde før logging
3. ✅ Design er nå moderne og intuitivt
4. ✅ Apple-stil visuelt utseende implementert

**Implementerte forbedringer:**
- ✅ Modal dialog for avføring med valg av mengde, konsistens (Bristol Scale), farge
- ✅ Modal dialog for urinering med valg av mengde, farge, lukt
- ✅ Input-felt i medisin-sjekkliste for å justere dose før logging
- ✅ Moderne mørk Apple-stil design med:
  - Gradient bakgrunn (#1a1a1a til #2d2d2d)
  - Blue/purple gradient på tittel
  - Smooth animasjoner og hover-effekter
  - CSS-variabler for konsistent fargepalett
  - Moderne typografi med system-fonter
- ✅ Forbedret spacing og layout
- ✅ Hover og transform animasjoner
- ✅ Input-felt for hver medisin/sondemat i sjekklisten
- ✅ Validering: krever mengde > 0 før logging
- ✅ Forbedret feedback med toast-meldinger som inkluderer mengde

**Tekniske endringer:**
- Lagt til CSS-variabler for fargetema
- Opprettet submitQuickBowelMovement() og submitQuickUrination() funksjoner
- Endret quickLogMedicineWithInput() og quickLogSondeWithInput() til å lese fra input-felt
- Lagt til to nye modale dialogs (bowelModal, urinationModal)
- Forbedret displayChecklist() til å generere input-felt per item

---

#### Versjon 1.2 - Lysere design og forhåndsdefinerte påminnelser (IMPLEMENTERT 24.01.2026 kl 11:20)
**Problemer fikset:**
1. ✅ Design var for mørkt og ensfarget - nå lysere og mer fargerikt
2. ✅ Påminnelser trengte forhåndsdefinerte valg basert på medisineringsplan

**Implementerte forbedringer:**
- ✅ Helt nytt lysere fargetema:
  - Lys bakgrunn (#f0f4f8) med hvite kort
  - Fargerik gradient bakgrunn (lilla til rosa)
  - Hvite modale dialogs og kort
  - Mørk tekst for bedre lesbarhet
  - Fargerike accent-farger (blå, grønn, lilla, oransje, rosa)
- ✅ Forhåndsdefinerte påminnelser basert på medisineringsplan:
  - Bactrim morgen (08:00) og kveld (20:00)
  - Nycoplus Multi Barn (08:00)
  - Nexium (08:00)
  - Zyprexa (18:00)
  - Emend (08:00)
  - Deksklorfeniramin x3 daglig (08:00, 14:00, 20:00)
  - Nutrini peptisorb (08:00)
- ✅ Hurtigvalg-knapper med emojis og farger
- ✅ Duplikatsjekk - kan ikke legge til samme påminnelse flere ganger
- ✅ Forbedret layout med cards for organisering
- ✅ Box-shadows og moderne styling
- ✅ Gradient på knapper og tittel

**Tekniske endringer:**
- Oppdatert CSS-variabler til lyst tema
- Lagt til addPresetReminder(name, time) funksjon
- Omstrukturert Påminnelser-tab med cards
- Lagt til 10+ forhåndsdefinerte påminnelser
- Forbedret button hover-effekter
- Container har nå hvit bakgrunn med shadow

---

#### Deployment-forberedelser (24.01.2026 kl 11:29)
**Filer lagt til:**
- ✅ `DEPLOY_GUIDE.md` - Fullstendig guide for deploy til Netlify/GitHub/Vercel
- ✅ `QUICK_START.txt` - Rask guide for Netlify Drop
- ✅ `.gitignore` - For GitHub repository
- ✅ `jensapp-deploy.zip` - Klar for deploy (på Desktop)

**Deploy-alternativer:**
1. **Netlify Drop** (Anbefalt - 5 min)
   - Dra zip-fil til https://app.netlify.com/drop
   - Ingen installasjon nødvendig
   - Gratis HTTPS + CDN
   
2. **GitHub Pages** (Krever Git)
   - Versjonskontroll inkludert
   - URL: username.github.io/jensapp
   
3. **Vercel** (Alternativ)
   - Lik Netlify
   - God ytelse

**Status:**
- ✅ Zip-fil opprettet: `C:\Users\cKlappy\Desktop\jensapp-deploy.zip`
- ✅ Klar for deploy
- ✅ PWA fungerer online
- ✅ Offline support inkludert

### Teknisk info:
- Utviklingsmiljø: Lokal HTML/JS/CSS Progressive Web App
- Lagring: localStorage (klient-side)
- Bootstrap 5.3.3 for UI-komponenter
- Vanilla JavaScript (ingen frameworks)

### Backup:
Før hver større endring, ta backup:
```powershell
Copy-Item -Path "C:\Users\cKlappy\jensapp" -Destination "C:\Users\cKlappy\jensapp_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
```

### Kontaktpersoner:
- Utviklet for: Jens og familie (Mari)
- Basert på: jensapp.docx dokument i Downloads-mappen
