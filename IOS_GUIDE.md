# 📱 iPhone/iOS Guide - Jensapp

## ⚠️ VIKTIG om iOS og notifikasjoner:

### iOS Safari begrensninger:
- ❌ Firebase Cloud Messaging fungerer IKKE på iOS Safari
- ⚠️ Web Push API er begrenset
- ✅ Nettleser-notifikasjoner fungerer **delvis**

---

## 🔔 Slik aktiverer du notifikasjoner på iPhone:

### Metode 1: PWA-installasjon (Anbefalt)

1. **Åpne Safari** (må være Safari!)
2. **Gå til:** `jensapp.netlify.app`
3. **Klikk Del-knappen** (⬆️ nederst)
4. **Velg "Legg til på Hjem-skjerm"**
5. **Åpne appen fra hjemskjermen**
6. **Klikk på "Aktiver notifikasjoner"** i Påminnelser-tab
7. **Tillat** når Safari spør

### Metode 2: Safari-innstillinger

Hvis notifikasjoner ikke fungerer:

1. **Åpne Innstillinger** på iPhone
2. **Gå til Safari**
3. **Scroll ned til "Nettsteder"**
4. **Klikk "Notifikasjoner"**
5. **Finn jensapp.netlify.app**
6. **Tillat notifikasjoner**

---

## 📊 Hva fungerer og ikke fungerer:

### ✅ Fungerer på iOS:
- Logging av medisiner
- Sjekkliste
- Historikk og statistikk
- Offline-funksjonalitet
- PWA-installasjon
- **Notifikasjoner når appen er åpen**

### ⚠️ Begrenset på iOS:
- Notifikasjoner når appen er lukket (iOS-begrensning)
- Bakgrunns-synkronisering

### ❌ Fungerer IKKE på iOS:
- Firebase Cloud Messaging (iOS Safari støtter det ikke)
- Push-varsler når appen er helt stengt

---

## 💡 Beste praksis for iOS:

1. **Installer som PWA** (Legg til på Hjem-skjerm)
2. **Hold appen åpen i bakgrunnen**
3. **Bruk iOS Kalender/Påminnelser** som backup:
   - Legg inn medisin-tidspunkter i iOS Kalender
   - Sett opp daglige påminnelser i iOS Påminnelser-app

---

## 🔄 Alternativ løsning: iOS Shortcuts

Vil du at jeg lager en iOS Shortcut som:
- Åpner appen
- Viser dagens medisiner
- Integrerer med iOS Påminnelser

Si fra, så lager jeg den! 📲

---

## 🚨 Hvis notifikasjoner ikke fungerer:

### På iPhone:

1. **Sjekk Safari-innstillinger:**
   - Innstillinger → Safari → Notifikasjoner
   
2. **Sjekk Notifikasjon-innstillinger:**
   - Innstillinger → Notifikasjoner → Safari
   - Påse at "Tillat notifikasjoner" er på

3. **Restart Safari:**
   - Lukk Safari helt
   - Åpne på nytt

4. **Re-installer PWA:**
   - Slett appen fra hjemskjermen
   - Legg til på nytt

---

## ✅ Android vs iOS sammenligning:

### Android (Chrome):
- ✅ Firebase Cloud Messaging
- ✅ Push-varsler når app er lukket
- ✅ Pålitelige notifikasjoner
- ✅ Bakgrunns-synkronisering

### iOS (Safari):
- ⚠️ Begrenset push-støtte
- ⚠️ Notifikasjoner kun når app er åpen/bakgrunn
- ✅ PWA fungerer
- ✅ Offline-støtte

---

## 📞 Support:

Hvis du har problemer med notifikasjoner på iOS:
1. Bruk iOS Kalender/Påminnelser som backup
2. Hold appen åpen i bakgrunnen
3. Sjekk Safari-innstillinger
4. Vurder Android for bedre notifikasjons-støtte

---

**Laget for Jens og familie ❤️**
