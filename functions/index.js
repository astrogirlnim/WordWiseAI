/* eslint-disable max-len, indent, comma-dangle */
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

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {OpenAI} = require("openai");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {parse} = require("csv-parse/sync");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions");

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});
console.log("OpenAI API key loaded from functions.config().openai.key");

const
  rateLimit = {
    maxCalls: 30, // 30 calls
    timeframe: 60 * 1000, // 1 minute
  };
const userCalls = new Map();

exports.generateSuggestions = onCall(async (request) => {
  logger.log("generateSuggestions called", {uid: request.auth?.uid});
  const userId = request.auth?.uid;
  if (!userId) {
    logger.error("User not authenticated");
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  const now = Date.now();
  const userEntry = userCalls.get(userId) || {count: 0, startTime: now};

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    logger.warn("Rate limit exceeded", {userId, count: userEntry.count});
    // eslint-disable-next-line max-len
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  const {text} = request.data;
  if (!text) {
    logger.error("No text provided in request");
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'text'.",
    );
  }

  try {
    logger.log("Calling OpenAI API", {userId, textLength: text.length});
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "user", content: text},
      ],
    });

    const suggestion = completion.choices[0].message.content;
    logger.log("OpenAI suggestion generated", {userId, suggestionLength: suggestion.length});
    return {suggestion};
  } catch (error) {
    logger.error("Error calling OpenAI API:", error);
    throw new HttpsError("internal", "Failed to generate suggestions.");
  }
});

exports.processGlossary = onObjectFinalized(
    {bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},
    async (event) => {
      logger.log("processGlossary triggered", {file: event.data?.name});
      const file = event.data;
      const filePath = file.name;

      if (!filePath.startsWith("glossaries/")) {
        logger.log("File not in glossaries path, skipping", {filePath});
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
        // eslint-disable-next-line max-len
        logger.error(
          `Failed to parse glossary for user ${userId}:`,
          error,
        );
      }
    },
);

exports.pruneOldVersions = onSchedule(
    "every day 00:00",
    async (event) => {
      logger.log("pruneOldVersions scheduled function triggered");
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldVersionsQuery = admin
          .firestore()
          .collectionGroup("versions")
          .where("createdAt", "<", thirtyDaysAgo);
      const snapshot = await oldVersionsQuery.get();

      const batch = admin.firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.log(`Pruned ${snapshot.size} old versions.`);
    },
);

exports.checkGrammarAndSpelling = onCall(async (request) => {
  logger.log("checkGrammarAndSpelling called", {uid: request.auth?.uid});
  const userId = request.auth?.uid;
  if (!userId) {
    logger.error("User not authenticated");
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  const now = Date.now();
  const userEntry = userCalls.get(userId) || {count: 0, startTime: now};

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    logger.warn("Rate limit exceeded", {userId, count: userEntry.count});
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  const {text} = request.data;
  if (!text) {
    logger.error("No text provided in request");
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'text'.",
    );
  }

  try {
    const startTime = Date.now();
    logger.log("Calling OpenAI API for grammar check", {userId, textLength: text.length});

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a grammar and spelling checker. Analyze the provided text and return a JSON array of errors. Each error should have: type (grammar/spelling), message (description), start (character position), end (character position), suggestions (array of corrections). Return only valid JSON, no other text."
        },
        {role: "user", content: text},
      ],
      temperature: 0,
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    logger.log("Grammar check completed", {userId, latency});

    let errors = [];
    try {
      const content = completion.choices[0].message.content;
      errors = JSON.parse(content);
    } catch (parseError) {
      logger.warn("Failed to parse grammar check response as JSON, returning empty array", {parseError});
      errors = [];
    }

    return {errors, latency};
  } catch (error) {
    logger.error("Error calling OpenAI API for grammar check:", error);
    throw new HttpsError("internal", "Failed to check grammar and spelling.");
  }
});

exports.healthCheck = onRequest(async (req, res) => {
  logger.log("healthCheck endpoint hit");
  try {
    const startTime = Date.now();
    await openai.models.list();
    const endTime = Date.now();
    res.status(200).send({
      status: "ok",
      openai_latency: `${endTime - startTime}ms`,
    });
    logger.log("healthCheck success", {latency: endTime - startTime});
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).send({
      status: "error",
      message: "OpenAI API is unreachable.",
    });
  }
});
