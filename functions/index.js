/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Cloud Functions will be added here when AI features are implemented
// For now, this file exists to satisfy Firebase project structure

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const { onValueDeleted } = require("firebase-functions/v2/database");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { parse } = require("csv-parse/sync");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const
  rateLimit = {
    maxCalls: 30, // 30 calls
    timeframe: 60 * 1000, // 1 minute
  };
const userCalls = new Map();

exports.generateSuggestions = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  const now = Date.now();
  const userEntry = userCalls.get(userId) || { count: 0, startTime: now };

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    throw new HttpsError("resource-exhausted", "Rate limit exceeded. Please try again later.");
  }


  const { text } = request.data;
  if (!text) {
    throw new HttpsError("invalid-argument", "The function must be called with one argument 'text'.");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: text }],
    });

    const suggestion = completion.choices[0].message.content;
    return { suggestion };
  } catch (error) {
    logger.error("Error calling OpenAI API:", error);
    throw new HttpsError("internal", "Failed to generate suggestions.");
  }
});

exports.processGlossary = onObjectFinalized({ bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }, async (event) => {
  const file = event.data;
  const filePath = file.name;

  if (!filePath.startsWith("glossaries/")) {
    return;
  }

  const parts = filePath.split("/");
  const userId = parts[1];
  const bucket = admin.storage().bucket(file.bucket);
  const fileBuffer = await bucket.file(filePath).download();
  
  try {
    const records = parse(fileBuffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    });

    const glossaryRef = admin.firestore().collection("glossaries").doc();
    await glossaryRef.set({
      userId: userId,
      terms: records,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection("users").doc(userId).update({
      brandVoiceGlossaryId: glossaryRef.id,
    });

    logger.log(`Glossary processed for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to parse glossary for user ${userId}:`, error);
  }
});

exports.pruneOldVersions = onSchedule("every day 00:00", async (event) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldVersionsQuery = admin.firestore().collectionGroup("versions").where("createdAt", "<", thirtyDaysAgo);
  const snapshot = await oldVersionsQuery.get();

  const batch = admin.firestore().batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  logger.log(`Pruned ${snapshot.size} old versions.`);
});

exports.healthCheck = onRequest(async (req, res) => {
  try {
    const startTime = Date.now();
    await openai.models.list();
    const endTime = Date.now();
    res.status(200).send({
      status: "ok",
      openai_latency: `${endTime - startTime}ms`,
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).send({ status: "error", message: "OpenAI API is unreachable." });
  }
});
