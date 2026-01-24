# 🔔 Firebase Push Notifications Setup

## Hva du gjør nå (Steg 1-4):

### Steg 1: Opprett Firebase-prosjekt ✅
1. Gå til: https://console.firebase.google.com
2. Klikk "Add project"
3. Navn: `jensapp` eller `jens-medisin`
4. Google Analytics: Av (ikke nødvendig)
5. Klikk "Create project"

### Steg 2: Legg til Web App
1. På Firebase-dashboardet, klikk på **Web-ikonet** `</>`
2. App nickname: `Jensapp Web`
3. **IKKE** kryss av "Set up Firebase Hosting"
4. Klikk "Register app"
5. **KOPIER** Firebase config-koden som vises

Eksempel på config (din vil være annerledes):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "jensapp-xyz.firebaseapp.com",
  projectId: "jensapp-xyz",
  storageBucket: "jensapp-xyz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Steg 3: Aktiver Cloud Messaging
1. I Firebase Console, gå til **Build** → **Cloud Messaging**
2. Klikk på **Web Push certificates** tab
3. Klikk **"Generate key pair"**
4. **KOPIER** VAPID key (lang string)

### Steg 4: Send meg informasjonen
**Lim inn her (i chatten):**
1. Firebase config (hele objektet)
2. VAPID key

---

## Hva JEG gjør (automatisk):

### Steg 5: Oppdater koden
- Setter inn Firebase config
- Setter inn VAPID key
- Oppdaterer index.html med Firebase SDK
- Forbedrer service worker
- Legger til push notification handlers

### Steg 6: Deploy
- Git commit og push
- Netlify deployer automatisk
- Live på 1-2 minutter!

### Steg 7: Test
- Be om notification permission
- Få FCM token
- Test push-varsler

---

## Resultatet:

### ✅ Før Firebase:
- Notifikasjoner kun når app er åpen
- Ikke pålitelig
- Begrenset på iOS

### 🚀 Etter Firebase:
- Notifikasjoner selv når app er lukket
- Pålitelige varsler
- Fungerer på Android + Desktop
- Bedre på iOS (med PWA)

---

## Testing etter setup:

1. Åpne appen i Chrome/Edge
2. Gi tillatelse til notifikasjoner
3. Legg til påminnelse
4. **Lukk appen**
5. Du får varsel på riktig tidspunkt!

---

## Notater:

- Firebase er 100% gratis for dette brukstilfelle
- Ingen kredittkortkrav
- Push-varsler fungerer globalt
- Data lagres fortsatt lokalt (ingen endring)

---

**Når du har Firebase config og VAPID key, lim dem inn i chatten!**
