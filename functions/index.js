const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {Resend} = require("resend");

admin.initializeApp();

// Define secret for Resend API key
const resendApiKey = defineSecret("RESEND_API_KEY");

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
          if (token) {
            tokenDocs.push({token, ref: doc.ref});
          }
        });

        if (tokenDocs.length === 0) {
          console.log("No FCM tokens registered");
          return null;
        }

        for (const reminderDoc of remindersSnapshot.docs) {
          const reminder = reminderDoc.data();
          const title = "Påminnelse - Dosevakt";
          const body = `⏰ ${reminder.name} (kl. ${currentTime})`;

          const response = await admin.messaging().sendEachForMulticast({
            tokens: tokenDocs.map((d) => d.token),
            notification: {title, body},
            data: {
              type: "reminder",
              name: String(reminder.name || ""),
              time: String(reminder.time || currentTime),
            },
            webpush: {
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
                  sound: "default",
                  badge: 1,
                },
              },
            },
          });

          console.log(
              `Reminder "${reminder.name}" sent: ` +
              `${response.successCount}/${tokenDocs.length} successes`,
          );

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

        console.log("Reminder check completed");
        return null;
      } catch (error) {
        console.error("Error checking reminders:", error);
        return null;
      }
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
          res.json({success: false, error: "No FCM tokens registered"});
          return;
        }

        const osloTime = formatTimeHHMMInOslo(new Date());
        const title = "Dosevakt test";
        const body = `Dette er en test av pushvarsler (kl. ${osloTime})`;

        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokenDocs.map((d) => d.token),
          notification: {title, body},
          data: {
            type: "test",
            time: osloTime,
          },
          webpush: {
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
        });

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

        res.json({
          success: true,
          tokenCount: tokenDocs.length,
          successCount: response.successCount,
          failureCount: response.failureCount,
        });
      } catch (error) {
        console.error("Error sending test push:", error);
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
      subject: `\ud83d\udccb Dosevakt rapport - ${dateStr}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResult);
    return {success: true, emailId: emailResult.id, recipients: recipients};
  } catch (error) {
    console.error("Error sending daily report:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Helper function to build HTML email content
 * @param {string} dateStr - Formatted date string
 * @param {Array} medicines - Array of medicine logs
 * @param {string} medicineHtml - HTML for medicine table rows
 * @param {string} missingHtml - HTML for missing medicines
 * @param {Array} sonde - Array of sondemat logs
 * @param {string} sondeHtml - HTML for sondemat list
 * @param {number} sondeTotal - Total sondemat in ml
 * @param {Array} bowel - Array of bowel movement logs
 * @param {string} bowelHtml - HTML for bowel list
 * @param {Array} urine - Array of urine logs
 * @return {string} Complete HTML email content
 */
function buildReportHtml(dateStr, medicines, medicineHtml, missingHtml, sonde, sondeHtml, sondeTotal, bowel, bowelHtml, urine) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1)}
.header{background:linear-gradient(135deg,#4CAF50,#2E7D32);color:#fff;padding:24px;text-align:center}
.header h1{margin:0;font-size:24px}.header p{margin:8px 0 0;opacity:.9}
.content{padding:24px}.section{margin-bottom:24px}
.section-title{font-size:16px;font-weight:600;color:#333;margin-bottom:12px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:8px;background:#f8f9fa;border-bottom:2px solid #dee2e6;font-size:14px}
.warning{background:#FFF3E0;border-left:4px solid #FF9800;padding:12px;border-radius:4px;margin-top:12px}
.stats{display:flex;gap:16px}.stat-box{flex:1;background:#f8f9fa;padding:16px;border-radius:8px;text-align:center}
.stat-value{font-size:24px;font-weight:700;color:#4CAF50}.stat-label{font-size:12px;color:#666;margin-top:4px}
.footer{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#888}
ul{margin:0;padding-left:20px}li{margin-bottom:6px}
</style></head><body><div class="container">
<div class="header"><h1>\ud83d\udccb Dosevakt - Daglig rapport</h1><p>${dateStr}</p></div>
<div class="content">
<div class="section"><div class="section-title">\ud83d\udc8a Medisiner gitt i dag</div>
${medicines.length > 0 ? `<table><thead><tr><th>Medisin</th><th>Dose</th><th>Tid</th><th>Gitt av</th></tr></thead><tbody>${medicineHtml}</tbody></table>` : "<p style='color:#888'>Ingen medisiner registrert i dag</p>"}
${missingHtml ? `<div class="warning"><strong>\u26a0\ufe0f Ikke registrert:</strong><table style="margin-top:8px"><tbody>${missingHtml}</tbody></table></div>` : ""}</div>
<div class="section"><div class="section-title">\ud83c\udf7c Sondemat</div>
${sonde.length > 0 ? `<ul>${sondeHtml}</ul><p style="margin-top:8px"><strong>Totalt: ${sondeTotal} ml</strong> ${sondeTotal >= 1300 ? "\u2705" : "\u26a0\ufe0f (M\u00e5l: 1300 ml)"}</p>` : "<p style='color:#888'>Ingen sondemat registrert</p>"}</div>
<div class="section"><div class="section-title">\ud83d\udca9 Avf\u00f8ring</div>${bowel.length > 0 ? `<ul>${bowelHtml}</ul>` : "<p style='color:#888'>Ingen registreringer</p>"}</div>
<div class="section"><div class="section-title">\ud83d\udca7 Vannlating</div><p>${urine.length} registrering${urine.length !== 1 ? "er" : ""}</p></div>
<div class="section"><div class="section-title">\ud83d\udcca Oppsummering</div>
<div class="stats"><div class="stat-box"><div class="stat-value">${medicines.length}</div><div class="stat-label">Medisiner</div></div>
<div class="stat-box"><div class="stat-value">${sondeTotal} ml</div><div class="stat-label">Sondemat</div></div>
<div class="stat-box"><div class="stat-value">${bowel.length}</div><div class="stat-label">Avf\u00f8ringer</div></div></div></div></div>
<div class="footer">Generert av Dosevakt<br><a href="https://jensapp-14069.web.app" style="color:#4CAF50">\u00c5pne appen</a></div>
</div></body></html>`;
}

// Daily report email - runs at 22:00 Oslo time
exports.sendDailyReport = onSchedule(
    {
      schedule: "0 22 * * *", // Every day at 22:00
      timeZone: "Europe/Oslo",
      secrets: [resendApiKey],
    },
    async (event) => {
      console.log("Scheduled daily report triggered at 22:00...");
      await generateAndSendReport(resendApiKey.value());
      return null;
    },
);

// Check for missed medicines - runs every minute
// Sends alert if medicine reminder passed 10 min ago and not logged
exports.checkMissedMedicines = onSchedule(
    {
      schedule: "every 1 minutes",
      timeZone: "Europe/Oslo",
      secrets: [resendApiKey],
    },
    async () => {
      // Check for reminders that were 10 minutes ago (Europe/Oslo)
      const checkTime = formatTimeHHMMInOslo(
          new Date(Date.now() - 10 * 60 * 1000),
      );

      console.log(`Checking missed meds for time: ${checkTime} (Europe/Oslo)`);

      try {
        // Get reminders that match the time 10 minutes ago
        const remindersSnapshot = await admin.firestore()
            .collection("reminders")
            .where("time", "==", checkTime)
            .get();

        if (remindersSnapshot.empty) {
          console.log("No reminders at this time");
          return null;
        }

        // Get today's medicine logs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const logsSnapshot = await admin.firestore()
            .collection("logs")
            .where("type", "==", "Medisin")
            .where("timestamp", ">=", todayStart.getTime())
            .where("timestamp", "<=", todayEnd.getTime())
            .get();

        const givenMeds = [];
        logsSnapshot.forEach((doc) => {
          givenMeds.push(doc.data().name);
        });

        // Check each reminder
        const missedMeds = [];
        remindersSnapshot.forEach((doc) => {
          const reminder = doc.data();
          // Check if this medicine has been logged today
          if (!givenMeds.includes(reminder.name)) {
            missedMeds.push({name: reminder.name, time: reminder.time});
          }
        });

        if (missedMeds.length === 0) {
          console.log("All medicines given on time");
          return null;
        }

        console.log(`Missed medicines: ${missedMeds.map((m) => m.name).join(", ")}`);

        // Get users who want missed med alerts
        const usersSnapshot = await admin.firestore()
            .collection("users")
            .where("missedMedAlert", "==", true)
            .get();

        const recipients = [];
        usersSnapshot.forEach((doc) => {
          const user = doc.data();
          if (user.email) {
            recipients.push(user.email);
          }
        });

        if (recipients.length === 0) {
          console.log("No users subscribed to missed med alerts");
          return null;
        }

        // Send alert email
        const resend = new Resend(resendApiKey.value());
        const medList = missedMeds.map((m) =>
          `\u2022 ${m.name} (skulle v\u00e6rt gitt kl. ${m.time})`).join("<br>");

        const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px}
.container{max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1)}
.header{background:linear-gradient(135deg,#FF9800,#F57C00);color:#fff;padding:20px;text-align:center}
.content{padding:24px}
.alert-box{background:#FFF3E0;border-left:4px solid #FF9800;padding:16px;border-radius:4px;margin:16px 0}
.footer{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#888}
</style></head><body><div class="container">
<div class="header"><h2 style="margin:0">\u26a0\ufe0f Medisin ikke registrert</h2></div>
<div class="content">
<p>F\u00f8lgende medisin(er) er ikke registrert som gitt:</p>
<div class="alert-box">${medList}</div>
<p style="color:#666;font-size:14px">Det har g\u00e5tt 10 minutter siden p\u00e5minnelsen. Hvis medisinen er gitt, vennligst registrer den i appen.</p>
<p style="text-align:center;margin-top:24px">
<a href="https://jensapp-14069.web.app" style="display:inline-block;background:#4CAF50;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">\u00c5pne Dosevakt</a>
</p>
</div>
<div class="footer">Automatisk varsel fra Dosevakt</div>
</div></body></html>`;

        const emailResult = await resend.emails.send({
          from: "Dosevakt <noreply@larsendatasupport.no>",
          to: recipients,
          subject: `\u26a0\ufe0f Glemt medisin: ${missedMeds.map((m) => m.name).join(", ")}`,
          html: htmlContent,
        });

        console.log("Missed med alert sent:", emailResult);
        return null;
      } catch (error) {
        console.error("Error checking missed medicines:", error);
        return null;
      }
    },
);
