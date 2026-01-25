const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {Resend} = require("resend");

admin.initializeApp();

// Define secret for Resend API key
const resendApiKey = defineSecret("RESEND_API_KEY");

// Cloud Function that runs every minute to check for reminders
exports.checkReminders = onSchedule(
    {
      schedule: "every 1 minutes",
      timeZone: "Europe/Oslo",
    },
    async (event) => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${h}:${m}`;

      console.log(`Checking reminders at ${currentTime}`);

      try {
        // Get all reminders from Firestore
        const remindersSnapshot = await admin.firestore()
            .collection("reminders")
            .get();

        const promises = [];

        remindersSnapshot.forEach((doc) => {
          const reminder = doc.data();
          const reminderTime = reminder.time; // Format: "HH:MM"

          // Check if reminder time matches current time
          if (reminderTime === currentTime) {
            const msg = `Sending reminder: ${reminder.name}`;
            console.log(msg);

            // Get all FCM tokens from users collection
            const tokenPromise = admin.firestore()
                .collection("fcmTokens")
                .get()
                .then((tokensSnapshot) => {
                  const sendPromises = [];

                  tokensSnapshot.forEach((tokenDoc) => {
                    const token = tokenDoc.data().token;

                    const message = {
                      notification: {
                        title: "Påminnelse - Jensapp",
                        body: `⏰ ${reminder.name}`,
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
                      token: token,
                    };

                    sendPromises.push(
                        admin.messaging().send(message)
                            .then((response) => {
                              const t = token.substring(0, 20);
                              console.log(`Sent to ${t}...`);
                              return response;
                            })
                            .catch((error) => {
                              const t = token.substring(0, 20);
                              console.error(`Error ${t}:`, error);
                              // If token is invalid, remove it
                              const invalidToken =
                                "messaging/invalid-registration-token";
                              const notRegistered =
                                "messaging/registration-token-not-registered";
                              if (error.code === invalidToken ||
                                  error.code === notRegistered) {
                                return tokenDoc.ref.delete();
                              }
                              return null;
                            }),
                    );
                  });

                  return Promise.all(sendPromises);
                });

            promises.push(tokenPromise);
          }
        });

        await Promise.all(promises);
        console.log("Reminder check completed");
        return null;
      } catch (error) {
        console.error("Error checking reminders:", error);
        return null;
      }
    },
);

// Cloud Function to save FCM token when user registers
exports.saveFcmToken = onCall(async (request) => {
  const {token, userId} = request.data;

  if (!token) {
    throw new Error("Token is required");
  }

  try {
    // Store token with userId (or IP/device identifier)
    await admin.firestore()
        .collection("fcmTokens")
        .doc(token)
        .set({
          token: token,
          userId: userId || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    console.log(`FCM token saved: ${token.substring(0, 20)}...`);
    return {success: true};
  } catch (error) {
    console.error("Error saving FCM token:", error);
    throw new Error("Failed to save token");
  }
});

// Test function to manually trigger daily report (callable)
exports.testDailyReport = onCall(
    {
      secrets: [resendApiKey],
    },
    async (request) => {
      console.log("Manually triggering daily report...");
      return await generateAndSendReport(resendApiKey.value());
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
    const logsSnapshot = await admin.firestore()
        .collection("logs")
        .where("timestamp", ">=", todayStart.getTime())
        .where("timestamp", "<=", todayEnd.getTime())
        .orderBy("timestamp", "asc")
        .get();

    const logs = [];
    logsSnapshot.forEach((doc) => {
      logs.push(doc.data());
    });

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

    // Send email
    const emailResult = await resend.emails.send({
      from: "Dosevakt <onboarding@resend.dev>",
      to: ["mari.knutsen@hotmail.com", "tomerik@larsendatasupport.no"],
      subject: `\ud83d\udccb Dosevakt rapport - ${dateStr}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResult);
    return {success: true, emailId: emailResult.id};
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
