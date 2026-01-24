# 🚀 Deploy Jens Medisinapp Online (Gratis)

## Metode 1: Netlify Drop (Enklest - 5 minutter)

### Trinn 1: Forbered filene
1. Åpne File Explorer
2. Gå til `C:\Users\cKlappy\jensapp`
3. Marker ALLE filer (Ctrl+A)
4. Høyreklikk → "Send til" → "Compressed (zipped) folder"
5. Gi navn: `jensapp.zip`

### Trinn 2: Deploy til Netlify
1. Åpne nettleser
2. Gå til: https://app.netlify.com/drop
3. Dra `jensapp.zip` inn i boksen
4. **FERDIG!** Du får en URL: `https://random-navn-123456.netlify.app`

### Trinn 3: Egendefinert navn (valgfritt)
1. På Netlify, klikk "Site settings"
2. Klikk "Change site name"
3. Skriv f.eks: `jens-medisinapp`
4. Ny URL: `https://jens-medisinapp.netlify.app`

**Fordeler:**
- ✅ Gratis for alltid
- ✅ Automatisk HTTPS
- ✅ Rask (global CDN)
- ✅ Fungerer på mobil
- ✅ Installere som app fra nettsiden

---

## Metode 2: GitHub Pages (Krever Git)

### Trinn 1: Installer Git
1. Last ned: https://git-scm.com/download/win
2. Installer med standardvalg
3. Restart PowerShell

### Trinn 2: Opprett GitHub-konto
1. Gå til: https://github.com/signup
2. Opprett gratis konto

### Trinn 3: Kjør disse kommandoene

```powershell
# Gå til jensapp-mappen
cd C:\Users\cKlappy\jensapp

# Initialiser git
git init

# Legg til alle filer
git add .

# Commit
git commit -m "Initial commit - Jens medisinapp v1.2"

# Opprett repository på GitHub (erstatt DITT_BRUKERNAVN)
# Gå til https://github.com/new først og opprett repository "jensapp"

# Koble til GitHub
git remote add origin https://github.com/DITT_BRUKERNAVN/jensapp.git

# Push til GitHub
git branch -M main
git push -u origin main
```

### Trinn 4: Aktiver GitHub Pages
1. Gå til repository på GitHub
2. Klikk "Settings"
3. Scroll ned til "Pages"
4. Under "Source", velg "main" branch
5. Klikk "Save"
6. Vent 1-2 minutter
7. URL: `https://DITT_BRUKERNAVN.github.io/jensapp/`

---

## Metode 3: Vercel (Alternativ til Netlify)

### Steg-for-steg:
1. Gå til: https://vercel.com/new
2. Logg inn med GitHub (eller e-post)
3. Dra `jensapp`-mappen inn i boksen
4. Klikk "Deploy"
5. **FERDIG!** URL: `https://jensapp-random.vercel.app`

---

## Min anbefaling: Netlify Drop

**Hvorfor?**
- 🚀 Raskest å sette opp (5 min)
- 💰 Helt gratis
- 🔒 Automatisk HTTPS
- 📱 Fungerer perfekt med PWA
- 🌍 Kan deles med hvem som helst
- 🔄 Lett å oppdatere (bare dra ny zip)

**Oppdatere appen senere:**
1. Gjør endringer i `C:\Users\cKlappy\jensapp`
2. Lag ny zip-fil
3. Dra den inn i Netlify Deploy boksen
4. Ferdig! Ny versjon er live

---

## Testing etter deploy

### Sjekkliste:
- [ ] Åpne URL i mobil-browser
- [ ] Test sjekkliste-funksjonen
- [ ] Test påminnelser
- [ ] Logg inn medisiner
- [ ] Sjekk at design ser riktig ut
- [ ] Installer som app (iOS/Android):
  - Chrome (Android): Meny → "Add to Home screen"
  - Safari (iOS): Del-knapp → "Add to Home Screen"

### PWA-test:
- [ ] Fungerer offline (slå av internett, åpne appen)
- [ ] Notifikasjoner fungerer
- [ ] Data lagres lokalt

---

## Sikkerhet

**OBS! VIKTIG:**
- ✅ All data lagres LOKALT på enheten
- ✅ Ingen data sendes til server
- ✅ Appen fungerer offline
- ⚠️ IKKE del URL med ukjente (selv om data er lokal)
- ⚠️ Data slettes hvis man sletter nettleser-data

**Backup-anbefaling:**
- Eksporter til CSV regelmessig (knapp i appen)
- Lagre CSV-filer trygt

---

## Tilleggstips

### Egendefinert domene (valgfritt, krever kjøp):
1. Kjøp domene på Namecheap/GoDaddy (ca. 100kr/år)
2. Koble til Netlify/Vercel (gratis)
3. Eksempel: `jens-medisin.no`

### QR-kode for enkel tilgang:
1. Gå til: https://www.qr-code-generator.com/
2. Lim inn URL
3. Last ned QR-kode
4. Print og heng på kjøleskapet
5. Mari kan skanne og åpne appen direkte

---

## Trenger du hjelp?

Hvis du vil at JEG skal deploye det:
1. Opprett Netlify-konto (gratis): https://app.netlify.com/signup
2. Si fra, så guider jeg deg gjennom!

Eller for GitHub Pages:
1. Installer Git
2. Opprett GitHub-konto
3. Si fra, så kjører jeg kommandoene for deg!
