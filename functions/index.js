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
const {onSchedule} = require("firebase-functions/v2/scheduler");
const path = require("path");

// Environment-aware configuration
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

if (isEmulator) {
  // Load local environment variables from the root .env.local file
  require("dotenv").config({path: path.resolve(__dirname, "../.env.local")});
  console.log("Running in emulator mode, loaded .env.local");
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://wordwise-ai-mvp.web.app",
];

admin.initializeApp();

// Safely initialize OpenAI client - REMOVED

const
  rateLimit = {
    maxCalls: 30, // 30 calls
    timeframe: 60 * 1000, // 1 minute
  };
const userCalls = new Map();

const grammarCheckCache = new Map();

exports.generateSuggestions = onCall({secrets: ["OPENAI_API_KEY"]}, async (request) => {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
  if (!openai) {
    logger.error("OpenAI client not initialized. Check API key configuration.");
    throw new HttpsError("internal", "Server configuration error.");
  }
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

exports.generateStyleSuggestions = onCall({secrets: ["OPENAI_API_KEY"]}, async (request) => {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
  if (!openai) {
    logger.error("OpenAI client not initialized for generateStyleSuggestions. Check API key configuration.");
    throw new HttpsError("internal", "Server configuration error.");
  }
  logger.log("generateStyleSuggestions called", {uid: request.auth?.uid});
  const userId = request.auth?.uid;
  if (!userId) {
    logger.error("User not authenticated for generateStyleSuggestions");
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  // Rate limiting logic - copied from generateSuggestions
  const now = Date.now();
  const userEntry = userCalls.get(userId) || {count: 0, startTime: now};

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    logger.warn("Rate limit exceeded for generateStyleSuggestions", {userId, count: userEntry.count});
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  const {text, goals, documentId} = request.data;
  if (!text || !documentId) {
    logger.error("Invalid arguments for generateStyleSuggestions", {textExists: !!text, documentId});
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'text' and 'documentId'."
    );
  }

  let systemPrompt = `Act as a world-class writing assistant. Your primary task is to analyze the user's text and provide suggestions to improve its style and readability.

You MUST return a valid JSON object. This object must have a single key, "suggestions", which contains an array of 1 to 5 suggestion objects. If the text is perfect and no suggestions are applicable, return an empty array for the "suggestions" key.

Each object in the "suggestions" array MUST have the following structure: { "type": "style" | "readability", "title": string, "description": string, "originalText": string, "suggestedText": string }.

VERY IMPORTANT: NEVER use hyphens in any of your response text, including the "title" and "description" fields. You may use an em dash (—) or other punctuation where appropriate.

Your analysis should focus exclusively on the following aspects:
- Clarity and conciseness of the text.
- The overall tone and level of formality.
- Word choice, phrasing, and vocabulary.
- The structure and variety of sentences.
- Overall readability and flow.

You MUST NOT suggest any grammatical or spelling corrections. Your focus is entirely on style and readability improvements.`;

  if (goals) {
    systemPrompt += `\n\nThe user has provided the following writing goals. Please tailor your suggestions to help the user meet these specific goals:\n${JSON.stringify(goals, null, 2)}`;
  }

  try {
    logger.log("Calling OpenAI API for style suggestions", {userId, documentId, textLength: text.length, goals});
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: text},
      ],
      response_format: {type: "json_object"},
    });

    const responseContent = completion.choices[0].message.content;
    logger.log("OpenAI style suggestions generated", {userId, responseContent});

    // The model is asked for a JSON object containing a "suggestions" array.
    const parsedResponse = JSON.parse(responseContent);
    const suggestionsFromAI = parsedResponse.suggestions || []; 

    if (suggestionsFromAI.length === 0) {
      logger.log("No style suggestions generated by AI.", {userId, documentId});
      return {success: true, suggestionsAdded: 0};
    }

    const batch = admin.firestore().batch();
    const suggestionsCollection = admin.firestore().collection(`documents/${documentId}/styleSuggestions`);

    suggestionsFromAI.forEach((suggestion) => {
      const newSuggestionRef = suggestionsCollection.doc();
      const newSuggestion = {
        ...suggestion,
        id: newSuggestionRef.id,
        documentId,
        userId,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        position: {start: -1, end: -1}, // Placeholder for now
        confidence: 90, // Placeholder
      };
      batch.set(newSuggestionRef, newSuggestion);
    });

    await batch.commit();

    logger.log(`Added ${suggestionsFromAI.length} new style suggestions to document.`, {userId, documentId});

    return {success: true, suggestionsAdded: suggestionsFromAI.length};
  } catch (error) {
    logger.error("Error in generateStyleSuggestions function:", error, {userId, documentId});
    throw new HttpsError("internal", "Failed to generate and save style suggestions.");
  }
});

exports.pruneOldVersions = onSchedule(
    {
      schedule: "every day 00:00",
      secrets: ["OPENAI_API_KEY"],
    },
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

exports.healthCheck = onRequest(
    {
        secrets: ["OPENAI_API_KEY"],
        cors: allowedOrigins,
        invoker: "public",
    },
    async (req, res) => {
        // Manually set CORS headers to be explicit.
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.set("Access-Control-Allow-Origin", origin);
        }

        // Explicitly handle preflight OPTIONS requests.
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).send("");
            return;
        }

        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        if (!openai) {
            logger.error("OpenAI client not initialized. Check API key configuration.");
            return res.status(500).send({
                status: "error",
                message: "OpenAI client is not configured.",
            });
        }
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
    },
);

exports.checkGrammar = onRequest(
    {
        secrets: ["OPENAI_API_KEY"],
        cors: allowedOrigins,
        invoker: "public",
    },
    async (req, res) => {
        // Manually set CORS headers to be explicit.
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.set("Access-Control-Allow-Origin", origin);
        }

        // Explicitly handle preflight OPTIONS requests.
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).send("");
            return;
        }

        // The `cors` option in onRequest should handle OPTIONS requests automatically.
        // This is a safety check for other methods.
        if (req.method !== "POST") {
            res.status(405).send({error: {message: "Method Not Allowed"}});
            return;
        }

        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        if (!openai) {
            logger.error("OpenAI client not initialized. Check API key configuration.");
            return res.status(500).send({error: {message: "Server configuration error."}});
        }
        logger.log("checkGrammar onRequest called", {headers: req.headers, body: req.body});

        // For `onRequest` with a JSON body, Firebase automatically parses `req.body`.
        const {documentId, text} = req.body.data;

        // 1. Verify Firebase Auth token from Authorization header
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        let userId;
        if (idToken) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                userId = decodedToken.uid;
                logger.log("Authenticated user", {userId});
            } catch (error) {
                logger.error("Error verifying auth token:", error);
                res.status(401).send({error: {message: "Unauthorized"}});
                return;
            }
        }

        if (!userId) {
            logger.error("User not authenticated for checkGrammar");
            res.status(401).send({error: {message: "Unauthorized. You must be logged in to check grammar."}});
            return;
        }

        if (!documentId || typeof text !== "string") {
            logger.error("Invalid arguments for checkGrammar", {documentId, textExists: !!text});
            res.status(400).send({error: {message: "The function requires 'documentId' and 'text'."}});
            return;
        }

        const startTime = Date.now();

        try {
            // 2. Verify document access rights (simplified for now)
            const docRef = admin.firestore().collection("documents").doc(documentId);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                logger.error("Document not found", {documentId});
                res.status(404).send({error: {message: "Document not found."}});
                return;
            }

            // 3. Caching logic
            const cacheKey = `${userId}:${documentId}:${text}`;
            const cached = grammarCheckCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < 10000)) {
                logger.log("Returning cached grammar check response", {cacheKey});
                const latency = Date.now() - startTime;
                res.status(200).send({data: {errors: cached.data.errors, latency}});
                return;
            }

            // 4. Forward text to GPT-4o
            logger.log("Calling OpenAI API for grammar check", {userId, documentId, textLength: text.length});
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful grammar and spelling checker. Your audience is the general public, so craft your explanations to be clear, concise, and easy to understand. Avoid overly technical jargon.Analyze the user's text. Your response MUST be a JSON object with a single key \"errors\". The value of \"errors\" MUST be an array of error objects. Each error object must contain these keys: \"id\" (a unique string for the error), \"start\" (0-indexed character start), \"end\" (0-indexed character end), \"error\" (the incorrect text), \"suggestions\" (an array of up to 3 suggested corrections), \"explanation\" (why it's an error), and \"type\". The \"type\" must be one of \"grammar\", \"spelling\", \"style\", \"clarity\", or \"punctuation\". It is critical that the \"start\" and \"end\" values are precise. The substring of the user's text from the \"start\" index to the \"end\" index MUST be exactly equal to the \"error\" string. If no errors are found, the \"errors\" array MUST be empty. Do not add any extra text or formatting. Do not use hyphens. Text to analyze is below."
                    },
                    {
                        role: "user",
                        content: text
                    },
                ],
                response_format: {type: "json_object"},
            });

            const aiResponse = completion.choices[0].message.content;
            logger.log("Raw OpenAI Response:", {aiResponse});

            // 5. Parse and handle response
            let errors = [];
            if (aiResponse) {
                try {
                    const parsedResponse = JSON.parse(aiResponse);
                    if (parsedResponse && Array.isArray(parsedResponse.errors)) {
                        errors = parsedResponse.errors.map((e) => ({
                            ...e,
                            id: e.id || `${e.start}-${e.error}`, // Fallback ID
                            suggestions: e.suggestions || (e.correction ? [e.correction] : []) // Handle old format
                        }));
                        logger.log(`Found ${errors.length} grammar errors.`, {documentId});
                    } else {
                        logger.warn("Parsed response does not contain an 'errors' array.", {documentId, aiResponse});
                    }
                } catch (e) {
                    logger.error("Failed to parse JSON response from OpenAI", {error: e, aiResponse});
                }
            }

            const latency = Date.now() - startTime;
            const result = {errors, latency};

            grammarCheckCache.set(cacheKey, {timestamp: Date.now(), data: result});

            // 6. Return response
            logger.log("Returning grammar check response", {latency, errorCount: errors.length});
            res.status(200).send({data: {errors, latency}});
        } catch (error) {
            logger.error("Error in checkGrammar function", {error: error.message, documentId});
            res.status(500).send({error: {message: "An unexpected error occurred while checking grammar."}});
        }
    },
);

exports.analyzeTone = onCall({secrets: ["OPENAI_API_KEY"]}, async (request) => {
  if (!openai) {
    logger.error("OpenAI client not initialized. Check API key configuration.");
    throw new HttpsError("internal", "Server configuration error.");
  }
  logger.log("analyzeTone called", {uid: request.auth?.uid});
  // The logic for analyzeTone would go here.
  // Since it was incomplete, I'm returning a placeholder.
  return {status: "not implemented"};
});

// This function seems to be a remnant and is causing deployment issues.
// It references onObjectFinalized which is no longer used, and its associated
// imports have been removed to fix linting errors.
// exports.processGlossary = onObjectFinalized(async (object) => {
//   logger.log("New file uploaded to storage", {
//     bucket: object.bucket,
//     name: object.name,
//   });
//
//   if (!object.name.endsWith(".csv")) {
//     logger.log("Not a CSV file, ignoring.");
//     return;
//   }
//
//   const fileBucket = admin.storage().bucket(object.bucket);
//   const file = fileBucket.file(object.name);
//
//   try {
//     const [fileContents] = await file.download();
//     const records = parse(fileContents, {
//       columns: true,
//       skip_empty_lines: true,
//     });
//
//     const glossaryCollection = admin.firestore().collection("glossary");
//     const batch = admin.firestore().batch();
//
//     records.forEach((record) => {
//       const docRef = glossaryCollection.doc();
//       batch.set(docRef, record);
//     });
//
//     await batch.commit();
//     logger.log(`Successfully imported ${records.length} glossary terms.`);
//   } catch (error) {
//     logger.error("Error processing glossary file:", error);
//   }
// });
