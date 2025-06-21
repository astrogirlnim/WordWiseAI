 
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

  // Check for existing suggestions to prevent duplicates
  try {
    const existingSuggestionsSnapshot = await admin.firestore()
      .collection(`documents/${documentId}/funnelSuggestions`)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();
    
    if (!existingSuggestionsSnapshot.empty) {
      logger.log("Found existing pending funnel suggestions, skipping generation", {
        documentId,
        userId,
        existingCount: existingSuggestionsSnapshot.size
      });
      
      // Return existing suggestions instead of generating new ones
      const existingSuggestions = existingSuggestionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        suggestions: existingSuggestions,
        generatedAt: Date.now(),
        basedOnGoals: true,
        note: 'Returned existing suggestions to prevent duplicates'
      };
    }
  } catch (error) {
    logger.warn("Error checking for existing suggestions, continuing with generation", {error});
  }

  // Build comprehensive prompt for funnel copy suggestions with standardized output
  let systemPrompt = `You are a world-class marketing copywriter and funnel optimization expert. Your task is to analyze the user's writing goals and current draft, then provide EXACTLY 4 specific types of funnel copy suggestions in a standardized format.

CRITICAL: You MUST return a valid JSON object with exactly this structure. Never deviate from this format:

{
  "suggestions": [
    {
      "type": "headline",
      "title": "Attention-Grabbing Headline",
      "description": "A compelling headline that captures attention and communicates core value",
      "suggestedText": "Your primary headline text here (keep under 10 words)",
      "confidence": 85,
      "position": "document-start"
    },
    {
      "type": "subheadline", 
      "title": "Supporting Subheadline",
      "description": "A subheadline that elaborates on the main value proposition",
      "suggestedText": "Your supporting subheadline text here (1-2 sentences)",
      "confidence": 80,
      "position": "after-headline"
    },
    {
      "type": "cta",
      "title": "Call to Action",
      "description": "A clear, action-oriented CTA that drives the desired behavior",
      "suggestedText": "Your CTA button text here (2-4 words)",
      "confidence": 90,
      "position": "document-end"
    },
    {
      "type": "outline",
      "title": "Content Structure",
      "description": "A strategic content outline optimized for conversions",
      "suggestedText": "1. Hook: Opening statement\n2. Problem: Pain point identification\n3. Solution: Your offering\n4. Benefits: Key advantages\n5. Social Proof: Testimonials/stats\n6. Call to Action: Final push",
      "confidence": 75,
      "position": "content-structure"
    }
  ],
  "generatedAt": ${Date.now()},
  "basedOnGoals": true
}

STRICT REQUIREMENTS:
- Always generate EXACTLY 4 suggestions with types: headline, subheadline, cta, outline
- Never use hyphens in any text fields (use em dashes — or other punctuation)
- Keep headlines under 10 words
- Keep CTAs under 4 words
- Make outlines specific and actionable
- Tailor ALL content to the specific goals provided

Writing Goals Context:
- Target Audience: ${goals.audience || 'general audience'}
- Formality Level: ${goals.formality || 'professional'}
- Marketing Domain: ${goals.domain || 'general business'}
- Primary Intent: ${goals.intent || 'inform'}

Focus Areas Based on Goals:
1. Headlines: Match the ${goals.formality || 'professional'} tone while appealing to ${goals.audience || 'general audience'}
2. Subheadlines: Elaborate on value for ${goals.audience || 'general audience'} in ${goals.domain || 'business'} context
3. CTAs: Drive ${goals.intent || 'engagement'} behavior with appropriate urgency
4. Outlines: Structure content to achieve ${goals.intent || 'informational'} goals

${currentDraft && currentDraft.trim() ? `\nCurrent Draft Context (use this to inform suggestions):\n${currentDraft.substring(0, 1000)}${currentDraft.length > 1000 ? '...' : ''}` : '\nNo current draft provided - create suggestions from goals alone.'}`;

  try {
    logger.log("Calling OpenAI API for standardized funnel suggestions", {
      userId, 
      documentId, 
      goals,
      draftLength: currentDraft ? currentDraft.length : 0
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: `Generate funnel copy suggestions for a ${goals.domain || 'business'} piece targeting ${goals.audience || 'general audience'} with ${goals.formality || 'professional'} tone to ${goals.intent || 'inform'}.`}
      ],
      response_format: {type: "json_object"},
      temperature: 0.7 // Add some creativity while maintaining consistency
    });

    const responseContent = completion.choices[0].message.content;
    logger.log("OpenAI standardized funnel suggestions generated", {userId, documentId, responseLength: responseContent.length});

    const parsedResponse = JSON.parse(responseContent);
    const suggestions = parsedResponse.suggestions || [];

    // Validate that we have exactly 4 suggestions with correct types
    const requiredTypes = ['headline', 'subheadline', 'cta', 'outline'];
    const actualTypes = suggestions.map(s => s.type);
    
    if (suggestions.length !== 4 || !requiredTypes.every(type => actualTypes.includes(type))) {
      logger.warn("AI returned non-standard suggestions, filtering and supplementing", {
        actualTypes,
        requiredTypes,
        count: suggestions.length
      });
      
      // Ensure we have all required types, create defaults if missing
      const standardizedSuggestions = requiredTypes.map(type => {
        const existing = suggestions.find(s => s.type === type);
        if (existing) return existing;
        
        // Create default suggestion for missing type
        const defaults = {
          headline: {
            title: "Attention-Grabbing Headline",
            description: "A compelling headline that captures attention",
            suggestedText: `Transform Your ${goals.domain || 'Business'} Today`,
            confidence: 70
          },
          subheadline: {
            title: "Supporting Subheadline", 
            description: "Supporting information about your value proposition",
            suggestedText: `Discover how ${goals.audience || 'professionals'} can achieve better results with our proven approach.`,
            confidence: 65
          },
          cta: {
            title: "Call to Action",
            description: "Action-oriented button text",
            suggestedText: "Get Started",
            confidence: 80
          },
          outline: {
            title: "Content Structure",
            description: "Strategic content outline for maximum impact",
            suggestedText: "1. Hook: Opening that grabs attention\n2. Problem: Identify key challenges\n3. Solution: Present your offering\n4. Benefits: Show clear advantages\n5. Proof: Add credibility\n6. Action: Clear next steps",
            confidence: 60
          }
        };
        
        return {
          type,
          ...defaults[type],
          position: type === 'headline' ? 'document-start' : 
                   type === 'subheadline' ? 'after-headline' :
                   type === 'cta' ? 'document-end' : 'content-structure'
        };
      });
      
      suggestions.splice(0, suggestions.length, ...standardizedSuggestions);
    }

    // Enhance suggestions with consistent metadata and unique IDs
    const timestamp = Date.now();
    const enhancedSuggestions = suggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `funnel_${documentId}_${timestamp}_${suggestion.type}`, // Use type in ID for uniqueness
      documentId,
      userId,
      status: "pending",
      createdAt: timestamp,
      targetAudience: goals.audience || 'general',
      intent: goals.intent || 'inform',
      domain: goals.domain || 'business',
      originalText: '', // Funnel suggestions don't replace text
      position: suggestion.position || {
        headline: 'document-start',
        subheadline: 'after-headline', 
        cta: 'document-end',
        outline: 'content-structure'
      }[suggestion.type] || 'document-end'
    }));

    // Store suggestions in Firestore with error handling
    const batch = admin.firestore().batch();
    const suggestionsCollection = admin.firestore().collection(`documents/${documentId}/funnelSuggestions`);

    enhancedSuggestions.forEach((suggestion) => {
      const suggestionRef = suggestionsCollection.doc(suggestion.id);
      batch.set(suggestionRef, suggestion);
    });

    await batch.commit();
    logger.log(`Successfully stored ${enhancedSuggestions.length} standardized funnel suggestions`, {
      userId, 
      documentId,
      suggestionTypes: enhancedSuggestions.map(s => s.type)
    });

    return {
      suggestions: enhancedSuggestions,
      generatedAt: timestamp,
      basedOnGoals: true,
      standardized: true
    };

  } catch (error) {
    logger.error("Error in generateFunnelSuggestions function:", error, {userId, documentId});
    throw new HttpsError("internal", "Failed to generate funnel suggestions.");
  }
});
