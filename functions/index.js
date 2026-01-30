const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {Resend} = require("resend");
const {GoogleGenerativeAI} = require("@google/generative-ai");

admin.initializeApp();

// Define secret for Resend API key
const resendApiKey = defineSecret("RESEND_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Pushover Configuration (using Secrets)
const pushoverUserKey = defineSecret("PUSHOVER_USER_KEY");
const pushoverApiToken = defineSecret("PUSHOVER_API_TOKEN");

/**
 * Send notification via Pushover
 * @param {string} title
 * @param {string} message
 * @param {number} priority (-2 to 2)
 * @param {string} sound
 * @return {Promise<Object>}
 */
async function sendPushoverNotification(title, message, priority = 0, sound = "pushover") {
  // Trim secrets to remove any potential newline/whitespace issues
  const token = pushoverApiToken.value().trim();
  const user = pushoverUserKey.value().trim();

  if (!token || !user) {
    console.log("Pushover secrets not available, skipping notification");
    return {success: false, error: "Secrets missing"};
  }

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        user: user,
        message: message,
        title: title,
        priority: priority,
        sound: sound,
      }),
    });
    const data = await response.json();
    if (data.status === 1) {
      console.log("Pushover notification sent successfully");
      return {success: true};
    } else {
      console.error("Pushover API error:", data);
      return {success: false, error: data};
    }
  } catch (error) {
    console.error("Error sending Pushover notification:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Format a Date to "HH:MM" in Europe/Oslo timezone (handles DST).
 * @param {Date} date
 * @return {string}
 */
function formatTimeHHMMInOslo(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

// Cloud Function that runs every minute to check for reminders
exports.checkReminders = onSchedule(
    {
      schedule: "every 1 minutes",
      timeZone: "Europe/Oslo",
      secrets: [pushoverApiToken, pushoverUserKey],
    },
    async () => {
      const currentTime = formatTimeHHMMInOslo(new Date());
      console.log(`Checking reminders at ${currentTime} (Europe/Oslo)`);

      try {
        // Only fetch reminders that match this minute
        const remindersSnapshot = await admin.firestore()
            .collection("reminders")
            .where("time", "==", currentTime)
            .get();

        if (remindersSnapshot.empty) {
          console.log("No reminders at this time");
          return null;
        }

        const tokensSnapshot = await admin.firestore()
            .collection("fcmTokens")
            .get();

        const tokenDocs = [];
        tokensSnapshot.forEach((doc) => {
          const data = doc.data();
          const token = data && data.token;
          // Only send to tokens that have a registered user to avoid ghost devices
          // and ensure we are reaching actual family members/carers
          if (token && data.userId) {
            tokenDocs.push({token, ref: doc.ref, userId: data.userId});
          }
        });

        // We continue even if no FCM tokens, to support Pushover
        if (tokenDocs.length === 0) {
          console.log("No active FCM tokens registered (continuing for Pushover)");
        }

        for (const reminderDoc of remindersSnapshot.docs) {
          const reminder = reminderDoc.data();

          // Idempotency check: Skip if sent less than 2 minutes ago
          // (Handles potential Cloud Function retries)
          if (reminder.lastSent) {
            const lastSentDate = reminder.lastSent.toDate();
            const timeDiff = Date.now() - lastSentDate.getTime();
            if (timeDiff < 2 * 60 * 1000) { // Less than 2 minutes
              console.log(`Skipping reminder ${reminder.name} (already sent recently)`);
              continue;
            }
          }

          const title = "Påminnelse - Dosevakt";
          const body = `⏰ ${reminder.name} (kl. ${currentTime})`;

          let fcmSuccess = false;

          if (tokenDocs.length > 0) {
            const response = await admin.messaging().sendEachForMulticast({
              tokens: tokenDocs.map((d) => d.token),
              notification: {title, body},
              data: {
                type: "reminder",
                name: String(reminder.name || ""),
                time: String(reminder.time || currentTime),
              },
              webpush: {
                headers: {
                  "Urgency": "high",
                  "TTL": "86400",
                },
                notification: {
                  title,
                  body,
                  icon: "/icon.png",
                  badge: "/icon.png",
                  tag: `dosevakt-reminder-${reminderDoc.id}`,
                  requireInteraction: true,
                },
                fcmOptions: {
                  link: "https://jensapp-14069.web.app",
                },
              },
              android: {
                notification: {
                  sound: "default",
                  priority: "high",
                },
              },
              apns: {
                payload: {
                  aps: {
                    "sound": "default",
                    "badge": 1,
                    "interruption-level": "time-sensitive",
                  },
                },
              },
            });

            console.log(
                `Reminder "${reminder.name}" sent to FCM: ` +
                `${response.successCount}/${tokenDocs.length} successes`,
            );

            if (response.successCount > 0) {
              fcmSuccess = true;
            }

            // Clean invalid tokens
            const invalidToken = "messaging/invalid-registration-token";
            const notRegistered = "messaging/registration-token-not-registered";

            const cleanup = [];
            response.responses.forEach((r, idx) => {
              if (!r.success && r.error) {
                const code = r.error.code;
                if (code === invalidToken || code === notRegistered) {
                  cleanup.push(tokenDocs[idx].ref.delete());
                }
              }
            });

            if (cleanup.length > 0) {
              await Promise.allSettled(cleanup);
              console.log(`Cleaned ${cleanup.length} invalid tokens`);
            }
          }

          // Send via Pushover
          const pushoverResult = await sendPushoverNotification(
              title,
              body,
              1, // High priority
          );
          const pushoverSuccess = pushoverResult.success;

          // Update lastSent timestamp if sent via either channel
          if (fcmSuccess || pushoverSuccess) {
            await reminderDoc.ref.update({
              lastSent: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        console.log("Reminder check completed");
        return null;
      } catch (error) {
        console.error("Error checking reminders:", error);
        return null;
      }
    },
);

exports.updateAccess = onRequest(
    {
      cors: true,
    },
    async (req, res) => {
      try {
        const db = admin.firestore();
        const patientId = "ORYrHe2nnvqFjOZtrvdw";
        const docRef = db.collection("patients").doc(patientId);

        const doc = await docRef.get();
        if (!doc.exists) {
          res.status(404).send("Patient not found");
          return;
        }

        const newEmail = "tomeriklarsen1@gmail.com";
        const variants = [
            "tomeriklarsen1@gmail.com", 
            "TomErikLarsen1@gmail.com",
            "Tomeriklarsen1@gmail.com"
        ];
        
        await docRef.update({
            allowedEmails: admin.firestore.FieldValue.arrayUnion(...variants)
        });

        res.json({success: true, message: "Added variants: " + variants.join(", "), id: patientId});
      } catch (error) {
        res.status(500).json({error: error.message});
      }
    },
);

// Restored AI Analysis function (Callable)
exports.analyzeWithGemini = onCall(
    {
      secrets: [geminiApiKey],
    },
    async (request) => {
      const prompt = request.data.prompt;
      if (!prompt) {
        throw new HttpsError("invalid-argument", "The function must be called with a \"prompt\" argument.");
      }

      // Initialize Gemini
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new HttpsError("failed-precondition", "Gemini API key not configured.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-1.5-pro",
      ];

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({model: modelName});
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return {text: response.text()};
        } catch (error) {
          console.warn(`Model ${modelName} failed in analyzeWithGemini:`, error.message);
          if (error.message.includes("404") || error.message.includes("not found")) {
            continue;
          }
          // If we tried all models and failed, or encountered a non-404 error that we shouldn't retry
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            throw new HttpsError("internal", "Failed to generate content via Gemini.", error.message);
          }
        }
      }
      throw new HttpsError("internal", "All Gemini models failed.");
    },
);

// Cloud Function to save FCM token via HTTP (public)
exports.saveFcmTokenHttp = onRequest(
    {
      cors: true,
      invoker: "public",
    },
    async (req, res) => {
      try {
        const {token, userId} = req.body || {};
        if (!token) {
          res.status(400).json({success: false, error: "Token is required"});
          return;
        }

        await admin.firestore()
            .collection("fcmTokens")
            .doc(token)
            .set({
              token: token,
              userId: userId || null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        console.log(`FCM token saved: ${token.substring(0, 20)}...`);
        res.json({success: true});
      } catch (error) {
        console.error("Error saving FCM token:", error);
        res.status(500).json({success: false, error: "Failed to save token"});
      }
    },
);

// Test push notification to all registered devices (public)
exports.testPush = onRequest(
    {
      cors: true,
      invoker: "public",
      secrets: [pushoverApiToken, pushoverUserKey],
    },
    async (req, res) => {
      try {
        const tokensSnapshot = await admin.firestore()
            .collection("fcmTokens")
            .get();

        const tokenDocs = [];
        tokensSnapshot.forEach((doc) => {
          const data = doc.data();
          const token = data && data.token;
          if (token) {
            tokenDocs.push({token, ref: doc.ref});
          }
        });

        if (tokenDocs.length === 0) {
          console.log("No FCM tokens registered (continuing for Pushover)");
        }

        const osloTime = formatTimeHHMMInOslo(new Date());
        const title = req.body.title || req.query.title || "Dosevakt test";
        const body = req.body.body || req.query.body || `Dette er en test av pushvarsler (kl. ${osloTime})`;

        let fcmResult = {successCount: 0, failureCount: 0};

        if (tokenDocs.length > 0) {
          const response = await admin.messaging().sendEachForMulticast({
            tokens: tokenDocs.map((d) => d.token),
            notification: {title, body},
            data: {
              type: "test",
              time: osloTime,
            },
            webpush: {
              headers: {
                "Urgency": "high",
                "TTL": "86400",
              },
              notification: {
                title,
                body,
                icon: "/icon.png",
                badge: "/icon.png",
                tag: "dosevakt-test",
                requireInteraction: true,
              },
              fcmOptions: {
                link: "https://jensapp-14069.web.app",
              },
            },
            android: {
              notification: {
                sound: "default",
                priority: "high",
              },
            },
            apns: {
              payload: {
                aps: {
                  "sound": "default",
                  "badge": 1,
                  "interruption-level": "time-sensitive",
                },
              },
            },
          });

          fcmResult = response;

          // Clean invalid tokens
          const invalidToken = "messaging/invalid-registration-token";
          const notRegistered = "messaging/registration-token-not-registered";

          const cleanup = [];
          response.responses.forEach((r, idx) => {
            if (!r.success && r.error) {
              const code = r.error.code;
              if (code === invalidToken || code === notRegistered) {
                cleanup.push(tokenDocs[idx].ref.delete());
              }
            }
          });

          if (cleanup.length > 0) {
            await Promise.allSettled(cleanup);
          }
        }

        // Send via Pushover
        const pushoverResult = await sendPushoverNotification(
            title,
            body,
            1, // High priority
        );
        const pushoverSuccess = pushoverResult.success;

        res.json({
          success: fcmResult.successCount > 0 || pushoverSuccess,
          tokenCount: tokenDocs.length,
          fcm: fcmResult,
          pushover: pushoverResult,
        });
      } catch (error) {
        console.error("Error sending test push:", error);
        res.status(500).json({success: false, error: error.message});
      }
    },
);

// Debug push status (public)
exports.debugPushStatus = onRequest(
    {
      cors: true,
      invoker: "public",
    },
    async (req, res) => {
      try {
        const snapshot = await admin.firestore().collection("fcmTokens").get();
        let latest = null;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const ts = data && data.updatedAt && data.updatedAt.toDate ?
            data.updatedAt.toDate().getTime() :
            null;
          if (ts !== null) {
            if (!latest || ts > latest.ts) {
              latest = {ts, iso: new Date(ts).toISOString()};
            }
          }
        });
        res.json({
          success: true,
          tokenCount: snapshot.size,
          latestUpdatedAt: latest ? latest.iso : null,
          pushoverConfigured: false,
        });
      } catch (error) {
        res.status(500).json({success: false, error: error.message});
      }
    },
);

// Test function to manually trigger daily report (callable)
// Note: Using onRequest instead of onCall for simpler access

exports.testDailyReport = onRequest(
    {
      secrets: [resendApiKey],
      cors: true, // Allow cross-origin requests
      invoker: "public", // Allow unauthenticated access
    },
    async (req, res) => {
      console.log("Manually triggering daily report...");
      const result = await generateAndSendReport(resendApiKey.value());
      res.json(result);
    },
);

/**
 * Main report generation function
 * @param {string} apiKey - Resend API key
 * @return {Promise<Object>} Result with success status and email ID
 */
async function generateAndSendReport(apiKey) {
  try {
    const resend = new Resend(apiKey);

    // Get today's date range (Oslo timezone)
    const now = new Date();
    const osloOffset = 1; // CET = UTC+1
    const osloNow = new Date(now.getTime() + osloOffset * 60 * 60 * 1000);

    const todayStart = new Date(osloNow);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(osloNow);
    todayEnd.setHours(23, 59, 59, 999);

    // Format date for display
    const days = ["s\u00f8ndag", "mandag", "tirsdag", "onsdag",
      "torsdag", "fredag", "l\u00f8rdag"];
    const months = ["januar", "februar", "mars", "april", "mai", "juni",
      "juli", "august", "september", "oktober", "november", "desember"];
    const dayName = days[osloNow.getDay()];
    const dateStr = `${dayName} ${osloNow.getDate()}. ` +
      `${months[osloNow.getMonth()]} ${osloNow.getFullYear()}`;

    // Fetch today's logs from Firestore
    // Using simple query to avoid composite index requirement
    const logsSnapshot = await admin.firestore()
        .collection("logs")
        .where("timestamp", ">=", todayStart.getTime())
        .where("timestamp", "<=", todayEnd.getTime())
        .get();

    const logs = [];
    logsSnapshot.forEach((doc) => {
      logs.push(doc.data());
    });

    // Sort by timestamp in memory
    logs.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`Found ${logs.length} logs for today`);

    // Categorize logs
    const medicines = logs.filter((l) => l.type === "Medisin");
    const sonde = logs.filter((l) => l.type === "Sondemat");
    const bowel = logs.filter((l) => l.type === "Avf\u00f8ring");
    const urine = logs.filter((l) => l.type === "vannlating");

    // Expected medicines
    const expectedMeds = [
      {name: "Bactrim", category: "dag", weekendOnly: true},
      {name: "Nycoplus Multi Barn", category: "dag"},
      {name: "Nexium", category: "dag"},
      {name: "Emend", category: "dag"},
      {name: "Zyprexa", category: "kveld"},
      {name: "Bactrim", category: "kveld", weekendOnly: true},
    ];

    const isWeekend = osloNow.getDay() === 0 || osloNow.getDay() === 6;
    const givenMeds = medicines.map((m) => m.name);

    // Build medicine HTML
    let medicineHtml = "";
    medicines.forEach((m) => {
      const time = new Date(m.timestamp);
      const timeStr = time.toLocaleTimeString("no-NO", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo"});
      const user = m.loggedBy || "Ukjent";
      medicineHtml += `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">\u2705 ${m.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.amount} ${m.unit}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${timeStr}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${user}</td>
      </tr>`;
    });

    // Check for missing meds
    let missingHtml = "";
    expectedMeds.forEach((exp) => {
      if (exp.weekendOnly && !isWeekend) return;
      if (!givenMeds.includes(exp.name)) {
        missingHtml += `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#d32f2f">\u274c ${exp.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${exp.category === "dag" ? "Morgen" : "Kveld"}</td>
        </tr>`;
      }
    });

    // Sondemat
    const sondeTotal = sonde.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    let sondeHtml = "";
    sonde.forEach((s) => {
      const time = new Date(s.timestamp);
      const timeStr = time.toLocaleTimeString("no-NO", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo"});
      sondeHtml += `<li>${s.name}: ${s.amount} ${s.unit} (${timeStr})</li>`;
    });

    // Bowel
    let bowelHtml = "";
    bowel.forEach((b) => {
      const time = new Date(b.timestamp);
      const timeStr = time.toLocaleTimeString("no-NO", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo"});
      bowelHtml += `<li>${timeStr} - ${b.bmAmount || "?"}, ${b.bmConsistency || ""}, ${b.bmColor || ""}</li>`;
    });

    // Build HTML
    const htmlContent = buildReportHtml(
        dateStr, medicines, medicineHtml, missingHtml,
        sonde, sondeHtml, sondeTotal, bowel, bowelHtml, urine,
    );

    // Get recipients from Firestore users collection
    const usersSnapshot = await admin.firestore()
        .collection("users")
        .where("dailyReport", "==", true)
        .get();

    const recipients = [];
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.email) {
        recipients.push(user.email);
      }
    });

    // Fallback to default if no users configured
    if (recipients.length === 0) {
      recipients.push("mari.knutsen@hotmail.com");
      recipients.push("tomerik@larsendatasupport.no");
    }

    console.log(`Sending daily report to: ${recipients.join(", ")}`);

    // Send email
    const emailResult = await resend.emails.send({
      from: "Dosevakt <noreply@larsendatasupport.no>",
      to: recipients,
      subject: `Dagsrapport for Jens - ${dateStr}`,
      html: htmlContent,
    });

    return {success: true, id: emailResult.id};
  } catch (error) {
    console.error("Error generating report:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Helper to build HTML email content
 * @param {string} dateStr
 * @param {Array} medicines
 * @param {string} medicineHtml
 * @param {string} missingHtml
 * @param {Array} sonde
 * @param {string} sondeHtml
 * @param {number} sondeTotal
 * @param {Array} bowel
 * @param {string} bowelHtml
 * @param {Array} urine
 * @return {string}
 */
function buildReportHtml(dateStr, medicines, medicineHtml, missingHtml,
    sonde, sondeHtml, sondeTotal, bowel, bowelHtml, urine) {
  return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">Dagsrapport for Jens</h1>
        <p style="color: #7f8c8d; font-size: 1.1em;">${dateStr}</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2980b9; margin-top: 0;">\uD83D\uDC8A Medisiner</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; background: #ecf0f1;">
                <th style="padding: 8px;">Navn</th>
                <th style="padding: 8px;">Dose</th>
                <th style="padding: 8px;">Tid</th>
                <th style="padding: 8px;">Sign.</th>
              </tr>
            </thead>
            <tbody>
              ${medicineHtml || "<tr><td colspan='4' style='padding:8px;text-align:center;color:#999'>Ingen medisiner registrert</td></tr>"}
            </tbody>
          </table>
          
          ${missingHtml ? `
            <h4 style="color: #d32f2f; margin-bottom: 5px;">\u26A0\uFE0F Mangler:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${missingHtml}
            </table>
          ` : ""}
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #e67e22; margin-top: 0;">\uD83E\uDD64 Sondemat</h3>
          <ul>
            ${sondeHtml || "<li style='color:#999'>Ingen sondemat registrert</li>"}
          </ul>
          <p><strong>Totalt i dag: ${sondeTotal} ml</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #8e44ad; margin-top: 0;">\uD83D\uDCA9 Avf\u00f8ring</h3>
          <ul>
            ${bowelHtml || "<li style='color:#999'>Ingen avf\u00f8ring registrert</li>"}
          </ul>
        </div>
        
        <div style="text-align: center; color: #bdc3c7; font-size: 0.8em; margin-top: 30px;">
          Sendt automatisk fra Dosevakt App
        </div>
      </div>
    `;
}

// Notification for new access requests
exports.notifyAccessRequest = onDocumentCreated(
    {
      document: "patients/{patientId}/access_requests/{requestId}",
      secrets: [resendApiKey],
      region: "us-central1",
    },
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) return;

      const requestData = snapshot.data();
      const patientId = event.params.patientId;

      // Get patient data
      const patientDoc = await admin.firestore().collection("patients").doc(patientId).get();
      if (!patientDoc.exists) return;

      const patientData = patientDoc.data();
      const recipients = patientData.allowedEmails || [];

      if (recipients.length === 0) {
        console.log("No recipients for access notification");
        return;
      }

      // Send email
      const resend = new Resend(resendApiKey.value());

      try {
        await resend.emails.send({
          from: "Dosevakt <noreply@larsendatasupport.no>",
          to: recipients,
          subject: `Ny forespørsel om tilgang: ${patientData.name}`,
          html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Ny tilgangsforespørsel</h2>
                    <p style="font-size: 1.1em;">
                        <strong>${requestData.userName}</strong> (${requestData.userEmail}) ønsker tilgang til pasientprofilen <strong>${patientData.name}</strong>.
                    </p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Pasient:</strong> ${patientData.name}</p>
                        <p><strong>Forespurt av:</strong> ${requestData.userName}</p>
                        <p><strong>E-post:</strong> ${requestData.userEmail}</p>
                    </div>
                    <p>Gå til <strong>Innstillinger</strong> i Dosevakt-appen for å godkjenne eller avslå denne forespørselen.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 0.8em;">Dette er en automatisk melding fra Dosevakt.</p>
                </div>
            `,
        });
        console.log(`Access notification sent to ${recipients.join(", ")}`);
      } catch (error) {
        console.error("Error sending access notification:", error);
      }
    },
);
// Temporary function to create superuser
exports.createSuperUser = onRequest(
    {
      cors: true,
      invoker: "public",
    },
    async (req, res) => {
      const email = "superadmin@jensapp.no";
      const password = "Intelinside8!";

      try {
        // Check if user exists
        try {
          await admin.auth().getUserByEmail(email);
          res.json({message: "User already exists"});
          return;
        } catch (e) {
          if (e.code !== "auth/user-not-found") {
            throw e;
          }
        }

        // Create user
        const userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          password: password,
          displayName: "Super Admin",
          disabled: false,
        });

        console.log("Successfully created new user:", userRecord.uid);
        res.json({message: "Successfully created user", uid: userRecord.uid});
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({error: error.message});
      }
    },
);

exports.migrateLegacyData = onRequest(
    {
      cors: true,
      timeoutSeconds: 540,
      secrets: [pushoverApiToken, pushoverUserKey],
    },
    async (req, res) => {
      const secret = req.query.secret;
      if (secret !== "Intelinside8!") {
        res.status(403).send("Unauthorized");
        return;
      }

      try {
        const db = admin.firestore();

        // 1. Create Patient "Jens"
        // Try to find owner from logs
        let ownerId = null;
        const logsSnap = await db.collection("logs").limit(1).get();
        if (!logsSnap.empty) {
          const data = logsSnap.docs[0].data();
          if (data.loggedBy && data.loggedBy.uid) {
            ownerId = data.loggedBy.uid;
          }
        }

        // If still no owner, check reminders
        if (!ownerId) {
          const remSnap = await db.collection("reminders").limit(1).get();
          if (!remSnap.empty) {
            const data = remSnap.docs[0].data();
            if (data.createdBy && data.createdBy.uid) {
              ownerId = data.createdBy.uid;
            }
          }
        }

        const patientData = {
          name: "Jens",
          birthDate: "2010-01-01", // Placeholder
          notes: "Migrert data fra tidligere versjon.",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ownerId: ownerId || "legacy_migration",
          allowedEmails: ["mari.knutsen@hotmail.com", "tomerik@larsendatasupport.no"],
        };

        const patientRef = await db.collection("patients").add(patientData);
        const patientId = patientRef.id;
        console.log("Created patient:", patientId);

        // Helper to migrate collection
        /**
         * Migrate a collection from root to patient
         * @param {string} sourceName
         * @param {string} destName
         * @return {Promise<number>}
         */
        const migrateCollection = async (sourceName, destName) => {
          const sourceRef = db.collection(sourceName);
          const destRef = patientRef.collection(destName);

          const snapshot = await sourceRef.get();
          if (snapshot.empty) return 0;

          let batch = db.batch();
          let count = 0;
          let total = 0;

          for (const doc of snapshot.docs) {
            const newDocRef = destRef.doc(doc.id); // Keep ID
            batch.set(newDocRef, doc.data());
            count++;
            total++;

            if (count >= 400) {
              await batch.commit();
              batch = db.batch();
              count = 0;
            }
          }

          if (count > 0) {
            await batch.commit();
          }
          console.log(`Migrated ${total} docs from ${sourceName} to ${destName}`);
          return total;
        }

        const results = {};
        results.logs = await migrateCollection("logs", "logs");
        results.reminders = await migrateCollection("reminders", "reminders");
        results.customMedicines = await migrateCollection("customMedicines", "customMedicines");
        results.customPlans = await migrateCollection("customPlans", "customPlans");

        // Migrate checklist/global
        const checklistGlobal = await db.collection("checklist").doc("global").get();
        if (checklistGlobal.exists) {
          await patientRef.collection("checklist").doc("global").set(checklistGlobal.data());
          results.checklist = 1;
        } else {
          results.checklist = 0;
        }

        res.json({
          success: true,
          patientId: patientId,
          ownerId: ownerId,
          results: results,
        });
      } catch (error) {
        console.error("Migration failed:", error);
        res.status(500).json({error: error.message});
      }
    },
);
