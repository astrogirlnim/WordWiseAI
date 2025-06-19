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
const {FieldValue} = require("firebase-admin/firestore");
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

exports.checkGrammar = onCall({secrets: ["OPENAI_API_KEY"]}, async (request) => {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
  if (!openai) {
    logger.error("OpenAI client not initialized for checkGrammar. Check API key configuration.");
    throw new HttpsError("internal", "Server configuration error.");
  }
  
  logger.log("checkGrammar onCall function called", {uid: request.auth?.uid});
  
  // Authentication is handled automatically by Firebase Functions onCall
  const userId = request.auth?.uid;
  if (!userId) {
    logger.error("User not authenticated for checkGrammar");
    throw new HttpsError("unauthenticated", "You must be logged in to check grammar.");
  }

  const {documentId, text, chunkMetadata} = request.data;
  if (!documentId || typeof text !== "string") {
    logger.error("Invalid arguments for checkGrammar", {documentId, textExists: !!text, hasChunkMetadata: !!chunkMetadata});
    throw new HttpsError("invalid-argument", "The function requires 'documentId' and 'text'.");
  }

  const startTime = Date.now();
  const isChunkedRequest = !!chunkMetadata;
  
  // Enhanced logging for chunked requests
  if (isChunkedRequest) {
    logger.log("Processing chunk for grammar check", {
      userId, 
      documentId, 
      chunkId: chunkMetadata.chunkId,
      chunkIndex: chunkMetadata.chunkIndex,
      totalChunks: chunkMetadata.totalChunks,
      textLength: text.length,
      originalStart: chunkMetadata.originalStart,
      originalEnd: chunkMetadata.originalEnd
    });
  } else {
    logger.log("Processing full document for grammar check", {userId, documentId, textLength: text.length});
  }

  // Apply rate limiting (same logic as other functions)
  const now = Date.now();
  const userEntry = userCalls.get(userId) || {count: 0, startTime: now};

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    logger.warn("Rate limit exceeded for checkGrammar", {userId, count: userEntry.count, isChunkedRequest});
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  try {
    // 2. Verify document access rights (simplified for now)
    const docRef = admin.firestore().collection("documents").doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      logger.error("Document not found for checkGrammar", {documentId});
      throw new HttpsError("not-found", "Document not found.");
    }

    // 3. Chunk-aware caching logic
    let cacheKey;
    if (isChunkedRequest) {
      // Use chunk-specific cache key for better cache hit rates
      const textHash = require('crypto').createHash('md5').update(text).digest('hex');
      cacheKey = `${userId}:${documentId}:chunk:${textHash}`;
      logger.log("Using chunk-based cache key", {cacheKey, chunkId: chunkMetadata.chunkId});
    } else {
      // Legacy full-document cache key
      cacheKey = `${userId}:${documentId}:${text}`;
      logger.log("Using full-document cache key", {cacheKey});
    }
    
    const cached = grammarCheckCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 10000)) {
      logger.log("Returning cached grammar check response", {cacheKey, isChunkedRequest});
      const latency = Date.now() - startTime;
      
      if (isChunkedRequest) {
        return {
          errors: cached.data.errors, 
          latency,
          chunkId: chunkMetadata.chunkId,
          chunkIndex: chunkMetadata.chunkIndex
        };
      } else {
        return {errors: cached.data.errors, latency};
      }
    }

    // 4. Forward text to GPT-4o with enhanced prompt for chunked processing
    let systemPrompt = "You are a helpful grammar and spelling checker. Your audience is the general public, so craft your explanations to be clear, concise, and easy to understand. Avoid overly technical jargon.\n\nAnalyze the user's text. Your response MUST be a JSON object with a single key \"errors\". The value of \"errors\" MUST be an array of error objects. Each error object must contain these keys:\n- \"id\" (a unique string for the error)\n- \"start\" (0-indexed character start position)\n- \"end\" (0-indexed character end position)\n- \"error\" (the EXACT incorrect text as it appears in the input, including any punctuation or spaces)\n- \"suggestions\" (an array of up to 3 suggested corrections)\n- \"explanation\" (why it's an error)\n- \"type\" (one of: \"grammar\", \"spelling\", \"style\", \"clarity\", or \"punctuation\")\n\nCRITICAL: The \"start\" and \"end\" values must be PRECISE. The substring from \"start\" to \"end\" MUST exactly match the \"error\" string character-for-character, including any surrounding spaces or punctuation. Count characters carefully.\n\nIf no errors are found, return an empty \"errors\" array. Do not add any extra text or formatting outside the JSON.";
    
    if (isChunkedRequest) {
      systemPrompt += ` NOTE: This is a text chunk (part ${chunkMetadata.chunkIndex + 1} of ${chunkMetadata.totalChunks}) from a larger document. Focus on errors within this chunk. Position indices should be relative to the start of this chunk text.`;
    }
    
    systemPrompt += " Text to analyze is below.";

    logger.log("Calling OpenAI API for grammar check", {
      userId, 
      documentId, 
      textLength: text.length, 
      isChunkedRequest,
      chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        },
      ],
      response_format: {type: "json_object"},
    });

    const aiResponse = completion.choices[0].message.content;
    logger.log("Raw OpenAI Response for checkGrammar:", {
      aiResponse, 
      isChunkedRequest,
      chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
    });

    // 5. Parse and handle response
    let errors = [];
    if (aiResponse) {
      try {
        const parsedResponse = JSON.parse(aiResponse);
        if (parsedResponse && Array.isArray(parsedResponse.errors)) {
          errors = parsedResponse.errors.map((e) => ({
            ...e,
            id: e.id || `${e.start}-${e.error}${isChunkedRequest ? `-${chunkMetadata.chunkId}` : ''}`, // Ensure unique IDs for chunks
            suggestions: e.suggestions || (e.correction ? [e.correction] : []) // Handle old format
          }));
          logger.log(`Found ${errors.length} grammar errors for checkGrammar.`, {
            documentId, 
            isChunkedRequest,
            chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
          });
        } else {
          logger.warn("Parsed response does not contain an 'errors' array for checkGrammar.", {
            documentId, 
            aiResponse,
            isChunkedRequest,
            chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
          });
        }
      } catch (e) {
        logger.error("Failed to parse JSON response from OpenAI in checkGrammar", {
          error: e, 
          aiResponse,
          isChunkedRequest,
          chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
        });
      }
    }

    const latency = Date.now() - startTime;
    
    // 6. Build result with chunk metadata if applicable
    let result;
    if (isChunkedRequest) {
      result = {
        errors, 
        latency,
        chunkId: chunkMetadata.chunkId,
        chunkIndex: chunkMetadata.chunkIndex
      };
    } else {
      result = {errors, latency};
    }

    // Cache the result
    grammarCheckCache.set(cacheKey, {timestamp: Date.now(), data: result});

    // 7. Performance monitoring and tracing
    logger.log("Returning grammar check response from checkGrammar", {
      latency, 
      errorCount: errors.length,
      isChunkedRequest,
      chunkId: isChunkedRequest ? chunkMetadata.chunkId : null,
      cacheKey: cacheKey.substring(0, 50) + '...' // Truncated for logging
    });
    
    // Add simple performance tracing
    if (latency > 3000) {
      logger.warn("Slow grammar check detected", {
        latency,
        textLength: text.length,
        isChunkedRequest,
        chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
      });
    }
    
    return result;

  } catch (error) {
    logger.error("Error in checkGrammar function", {
      error: error.message, 
      documentId,
      isChunkedRequest,
      chunkId: isChunkedRequest ? chunkMetadata.chunkId : null
    });
    throw new HttpsError("internal", "An unexpected error occurred while checking grammar.");
  }
});

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

exports.generateFunnelSuggestions = onCall({secrets: ["OPENAI_API_KEY"]}, async (request) => {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
  if (!openai) {
    logger.error("OpenAI client not initialized for generateFunnelSuggestions. Check API key configuration.");
    throw new HttpsError("internal", "Server configuration error.");
  }
  
  logger.log("generateFunnelSuggestions called", {uid: request.auth?.uid});
  const userId = request.auth?.uid;
  if (!userId) {
    logger.error("User not authenticated for generateFunnelSuggestions");
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  // Apply rate limiting
  const now = Date.now();
  const userEntry = userCalls.get(userId) || {count: 0, startTime: now};

  if (now - userEntry.startTime > rateLimit.timeframe) {
    userEntry.startTime = now;
    userEntry.count = 0;
  }

  userEntry.count++;
  userCalls.set(userId, userEntry);

  if (userEntry.count > rateLimit.maxCalls) {
    logger.warn("Rate limit exceeded for generateFunnelSuggestions", {userId, count: userEntry.count});
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  const {documentId, goals, currentDraft} = request.data;
  if (!documentId || !goals) {
    logger.error("Invalid arguments for generateFunnelSuggestions", {documentId, goals});
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'documentId' and 'goals'."
    );
  }

  // Build comprehensive prompt for funnel copy suggestions
  let systemPrompt = `You are a world-class marketing copywriter and funnel optimization expert. Your task is to analyze the user's writing goals and current draft, then provide 4 specific types of funnel copy suggestions.

You MUST return a valid JSON object with the exact structure below. Never use hyphens in any text fields.

Required JSON structure:
{
  "suggestions": [
    {
      "type": "headline",
      "title": "Compelling Headline",
      "description": "Brief explanation of why this headline works",
      "suggestedText": "Your headline text here",
      "confidence": 85
    },
    {
      "type": "subheadline", 
      "title": "Supporting Subheadline",
      "description": "How this supports the main headline",
      "suggestedText": "Your subheadline text here",
      "confidence": 80
    },
    {
      "type": "cta",
      "title": "Call to Action",
      "description": "Why this CTA drives conversions",
      "suggestedText": "Your CTA text here",
      "confidence": 90
    },
    {
      "type": "outline",
      "title": "Content Structure",
      "description": "Strategic outline for funnel flow",
      "suggestedText": "Detailed outline structure here",
      "confidence": 75
    }
  ],
  "generatedAt": ${Date.now()},
  "basedOnGoals": true
}

Writing Goals Context:
- Target Audience: ${goals.audience}
- Formality Level: ${goals.formality}
- Marketing Domain: ${goals.domain}
- Primary Intent: ${goals.intent}

Focus on:
1. Headlines that grab attention and match the audience
2. Subheadlines that clarify value proposition
3. CTAs that drive the intended action
4. Outlines that structure content for maximum impact

Never use hyphens in your suggestions. Use em dashes (—) or other punctuation where appropriate.`;

  if (currentDraft && currentDraft.trim()) {
    systemPrompt += `\n\nCurrent Draft Context:\n${currentDraft.substring(0, 1000)}${currentDraft.length > 1000 ? '...' : ''}`;
  }

  try {
    logger.log("Calling OpenAI API for funnel suggestions", {
      userId, 
      documentId, 
      goals,
      draftLength: currentDraft ? currentDraft.length : 0
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: `Generate funnel copy suggestions for a ${goals.domain} piece targeting ${goals.audience} with ${goals.formality} tone to ${goals.intent}.`}
      ],
      response_format: {type: "json_object"},
    });

    const responseContent = completion.choices[0].message.content;
    logger.log("OpenAI funnel suggestions generated", {userId, documentId, responseContent});

    const parsedResponse = JSON.parse(responseContent);
    const suggestions = parsedResponse.suggestions || [];

    // Enhance suggestions with additional metadata
    const enhancedSuggestions = suggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `funnel_${documentId}_${Date.now()}_${index}`,
      documentId,
      userId,
      status: "pending",
      createdAt: Date.now(),
      targetAudience: goals.audience,
      intent: goals.intent,
      domain: goals.domain
    }));

    // Store suggestions in Firestore
    const batch = admin.firestore().batch();
    const suggestionsCollection = admin.firestore().collection(`documents/${documentId}/funnelSuggestions`);

    enhancedSuggestions.forEach((suggestion) => {
      const suggestionRef = suggestionsCollection.doc(suggestion.id);
      batch.set(suggestionRef, suggestion);
    });

    await batch.commit();
    logger.log(`Stored ${enhancedSuggestions.length} funnel suggestions in Firestore`, {userId, documentId});

    return {
      suggestions: enhancedSuggestions,
      generatedAt: Date.now(),
      basedOnGoals: true
    };

  } catch (error) {
    logger.error("Error in generateFunnelSuggestions function:", error, {userId, documentId});
    throw new HttpsError("internal", "Failed to generate funnel suggestions.");
  }
});

exports.acceptInvite = onCall(async (request) => {
  const { token } = request.data;
  const userId = request.auth?.uid;
  const userEmail = request.auth?.token.email;

  if (!userId || !userEmail) {
    throw new HttpsError("unauthenticated", "You must be logged in to accept an invitation.");
  }
  if (!token) {
    throw new HttpsError("invalid-argument", "An invitation token must be provided.");
  }

  logger.log(`[acceptInvite] Starting invitation acceptance process`, {
    userId,
    userEmail,
    token,
    authToken: request.auth?.token
  });

  const db = admin.firestore();
  const invitationsRef = db.collection("invitations");
  const q = invitationsRef.where("token", "==", token).limit(1);
  
  const snapshot = await q.get();

  if (snapshot.empty) {
    logger.error(`[acceptInvite] No invitation found for token: ${token}`);
    throw new HttpsError("not-found", "This invitation is invalid or has expired.");
  }

  const invitationDoc = snapshot.docs[0];
  const invitation = invitationDoc.data();

  logger.log(`[acceptInvite] Found invitation`, {
    invitationId: invitationDoc.id,
    invitationEmail: invitation.email,
    userEmail: userEmail,
    invitationStatus: invitation.status,
    invitationRole: invitation.role,
    documentId: invitation.documentId
  });

  // Normalize both emails for comparison
  const normalizedInvitationEmail = invitation.email.toLowerCase().trim();
  const normalizedUserEmail = userEmail.toLowerCase().trim();

  logger.log(`[acceptInvite] Email comparison details`, {
    originalInvitationEmail: invitation.email,
    normalizedInvitationEmail,
    originalUserEmail: userEmail,
    normalizedUserEmail,
    emailsMatch: normalizedInvitationEmail === normalizedUserEmail
  });

  if (normalizedInvitationEmail !== normalizedUserEmail) {
    logger.warn(`[acceptInvite] Email mismatch - User ${userEmail} tried to accept invitation for ${invitation.email}`);
    logger.warn(`[acceptInvite] Normalized comparison: ${normalizedUserEmail} !== ${normalizedInvitationEmail}`);
    throw new HttpsError("permission-denied", `This invitation is not for you. The invitation was sent to ${invitation.email}, but you are signed in as ${userEmail}.`);
  }

  if (invitation.status !== "pending") {
    logger.warn(`[acceptInvite] Invitation ${invitationDoc.id} status is ${invitation.status}, not pending`);
    throw new HttpsError("already-exists", "This invitation has already been used.");
  }

  const documentRef = db.collection("documents").doc(invitation.documentId);
  const documentSnap = await documentRef.get();
  if(!documentSnap.exists){
    logger.error(`[acceptInvite] Document ${invitation.documentId} not found for invitation ${invitationDoc.id}`);
    throw new HttpsError("not-found", "The document associated with this invitation no longer exists.");
  }

  const documentData = documentSnap.data();
  const documentOwner = documentData.ownerId;

  logger.log(`[acceptInvite] Document details`, {
    documentId: invitation.documentId,
    documentTitle: documentData.title,
    documentOwner,
    documentExists: true
  });

  const newAccess = {
    userId: userId,
    email: normalizedUserEmail, // Use normalized email for consistency
    role: invitation.role,
    addedAt: Date.now(), // Use a plain timestamp, not FieldValue.serverTimestamp()
    addedBy: invitation.invitedBy,
  };

  logger.log(`[acceptInvite] Creating access entry`, newAccess);

  const batch = db.batch();

  // Add user to the document's access list
  batch.update(documentRef, {
    sharedWith: FieldValue.arrayUnion(newAccess),
    sharedWithIds: FieldValue.arrayUnion(userId),
  });

  // Mark the invitation as accepted
  batch.update(invitationDoc.ref, {
    status: "accepted",
    acceptedAt: FieldValue.serverTimestamp(),
    acceptedBy: userId
  });

  await batch.commit();

  logger.log(`[acceptInvite] Successfully completed invitation acceptance`, {
    userId,
    userEmail: normalizedUserEmail,
    documentId: invitation.documentId,
    role: invitation.role
  });

  return { success: true, documentId: invitation.documentId };
});
