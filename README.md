# 💊 Medisinlogg - Jens

En enkel og brukervennlig Progressive Web App (PWA) for logging av medisiner, sondemat, avføring, urinering og andre helserelaterte hendelser.

## 🚀 Kom i gang

### Lokal testing
1. Åpne `index.html` direkte i en moderne nettleser (Chrome anbefales)
2. Alternativt, kjør en lokal webserver:
   ```powershell
   # Fra jensapp-mappen
   python -m http.server 8000
   ```
   Åpne deretter http://localhost:8000 i nettleseren

### Installere som app på mobil
1. Åpne siden i Chrome (Android) eller Safari (iOS)
2. Trykk på menyknappen (⋮ eller ⋯)
3. Velg "Legg til på startskjerm" eller "Add to Home Screen"
4. Appen vil nå fungere som en egen app på telefonen

## 📱 Funksjoner

### ✨ Sjekkliste (NY!)
- **Rask logging**: Klikk på medisiner for å logge umiddelbart
- **Fleksibel dosering**: Juster mengde før du logger
- **Visuell feedback**: Grønn bakgrunn når gitt i dag
- **Teller**: Se hvor mange ganger en medisin er gitt
- **Smart dialogs**: Fullstendige valg for avføring og urinering

### Logging
- **Medisin**: Velg fra forhåndsdefinert liste eller legg til egendefinert
- **Sondemat**: Logg mengde og tidspunkt
- **Avføring**: Med Bristol Stool Scale (Type 1-7), mengde og farge
- **Urinering**: Mengde, farge og lukt
- **Annet**: Fritekst for andre hendelser

### Visninger
- **Sjekkliste**: Rask oversikt og logging (standardvisning)
- **I dag**: Oversikt over dagens logger
- **Historikk**: Søkbar og filtrerbar oversikt over alle logger
- **Påminnelser**: Legg til påminnelser med tidspunkt
- **Statistikk**: Se antall doser per medisin og type

### Eksport
- Eksporter alle logger til CSV-fil for videre analyse eller deling med leger

## 🔒 Personvern
- All data lagres lokalt på enheten (localStorage)
- Ingen data sendes til eksterne servere
- Du har full kontroll over dataene dine

## ⚙️ Tekniske detaljer
- **Frontend**: HTML5, Vanilla JavaScript, Bootstrap 5
- **Design**: Moderne lyst fargerikt tema med gradient bakgrunn og animasjoner
- **Lagring**: localStorage (ca. 5-10MB kapasitet)
- **Offline**: Fungerer uten internett-tilkobling
- **Notifikasjoner**: Støtter push-varsler (krever tillatelse)
- **Responsiv**: Fungerer på mobil, nettbrett og desktop
- **Farger**: Lilla-rosa gradient bakgrunn, hvite kort, fargerike knapper

## 🔔 Påminnelser
**Forhåndsdefinerte påminnelser (NY!):**
- Hurtigvalg for alle daglige medisiner basert på medisineringsplan
- Bactrim morgen/kveld, Nycoplus, Nexium, Zyprexa, Emend
- Deksklorfeniramin 3x daglig, Nutrini peptisorb
- Duplikatsjekk forhindrer samme påminnelse flere ganger

For at påminnelser skal fungere optimalt:
1. Gi nettleseren tillatelse til å vise notifikasjoner
2. På Android: Appen fungerer best når den er installert som PWA
3. På iOS: Begrensninger i Safari kan påvirke push-varsler

## 📤 GitHub Pages Deployment (valgfritt)

1. Opprett et GitHub repository
2. Push alle filene til repository
3. Gå til Settings → Pages
4. Velg "main" branch og klikk Save
5. Appen vil være tilgjengelig på `https://dittbrukernavn.github.io/repositorynavn/`

## 🔥 Firebase-integrasjon (valgfritt)

For mer pålitelige push-varsler kan du integrere Firebase Cloud Messaging:

1. Gå til [Firebase Console](https://console.firebase.google.com)
2. Opprett et nytt prosjekt
3. Legg til en web-app
4. Kopier Firebase config til `app.js`
5. Aktiver Cloud Messaging og hent VAPID-nøkkel
6. Følg instruksjonene i Grok-dokumentet for fullstendig Firebase-integrasjon

## 🆘 Feilsøking

### Appen laster ikke
- Sjekk at alle filer er i samme mappe
- Åpne Developer Tools (F12) og sjekk Console for feilmeldinger

### Notifikasjoner fungerer ikke
- Sjekk at du har gitt tillatelse til notifikasjoner
- På iOS: Installer appen som PWA fra Safari

### Data forsvinner
- localStorage kan slettes hvis nettleserdata ryddes
- Eksporter regelmessig til CSV for backup

## 📝 Medisinliste

Forhåndsdefinerte medisiner:
- Bactrim (10 ml x 2)
- Nycoplus Multi Barn (1 tablett x 1 daglig)
- Nexium (20 mg x 1-2 poser x 1)
- Zyprexa (2.5 mg tab, 1.25-2.5 mg x 1 kveld)
- Palonosetron (500 mcg, 390 μg x 1/48 timer)
- Emend (40 mg x 1, ½ av 80 mg kapsel)
- Paracetamol (300 mg x 4 ved behov)
- Movicol (1 pose x 2 ved behov)
- Deksklorfeniramin (1 mg x 3, ½ tablett Aniramin x 3)
- Nutrini peptisorb (1300 ml daglig, sondemat)
- Ibuprofen

Du kan enkelt legge til flere medisiner ved å redigere `index.html` (linje 100-113).

## 🎯 Fremtidige forbedringer
- Sky-synkronisering mellom enheter (Firebase Firestore)
- Grafer og visualiseringer
- Automatisk backup til e-post
- Deling med leger/sykehus
- Bilder/vedlegg
- Flere rapportformater (PDF)

## 💙 Støtte
For spørsmål eller problemer, se Grok-dokumentet for mer detaljert informasjon om hvordan appen er bygget.

---
**Laget med ❤️ for Jens og familie**
