const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

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
