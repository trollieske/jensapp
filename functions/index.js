const {onCall} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const functions = require("firebase-functions");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// AI Proxy Function (Gemini)
// Callable function to proxy requests to Google Gemini API
exports.analyzeWithGemini = onCall({secrets: [geminiApiKey]}, async (request) => {
  const prompt = request.data.prompt;
  if (!prompt) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a \"prompt\" argument.");
  }

  // Initialize Gemini
  const apiKey = geminiApiKey.value();
  if (!apiKey) {
    throw new functions.https.HttpsError("failed-precondition", "Gemini API key not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: "gemini-1.5-pro"});

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return {text: text};
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate content via Gemini.", error.message);
  }
});
