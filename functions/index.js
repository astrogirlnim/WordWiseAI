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

// PHASE 1: Grammar check cache removed - Harper.js migration
// const grammarCheckCache = new Map();

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
  // BEGIN: Deep Auth and Payload Logging
  logger.log("[generateStyleSuggestions] --- TOP OF FUNCTION ---");
  logger.log("[generateStyleSuggestions] Full request.auth:", { auth: request.auth });
  logger.log("[generateStyleSuggestions] request.auth.uid:", { uid: request.auth?.uid });
  logger.log("[generateStyleSuggestions] request.auth.token:", { token: request.auth?.token });
  logger.log("[generateStyleSuggestions] request.data:", { data: request.data });
  // END: Deep Auth and Payload Logging
  try {
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    logger.log("[generateStyleSuggestions] Function called", {uid: request.auth?.uid, data: request.data});
    if (!openai) {
      logger.error("OpenAI client not initialized for generateStyleSuggestions. Check API key configuration.");
      throw new HttpsError("internal", "Server configuration error.");
    }
    logger.log("generateStyleSuggestions called", {uid: request.auth?.uid});
    logger.log("[generateStyleSuggestions] Full auth context", {
      auth: request.auth,
      hasAuth: !!request.auth,
      uid: request.auth?.uid,
      token: request.auth?.token ? 'present' : 'missing'
    });
    const userId = request.auth?.uid;
    if (!userId) {
      logger.error("User not authenticated for generateStyleSuggestions", {
        authPresent: !!request.auth,
        authKeys: request.auth ? Object.keys(request.auth) : 'no auth object'
      });
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
    logger.log("[generateStyleSuggestions] Payload received", {documentId, textLength: text ? text.length : 0, goals});
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
      logger.log("[generateStyleSuggestions] Calling OpenAI API", {userId, documentId, textLength: text.length, goals});
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {role: "system", content: systemPrompt},
          {role: "user", content: text},
        ],
        response_format: {type: "json_object"},
      });

      const responseContent = completion.choices[0].message.content;
      logger.log("[generateStyleSuggestions] OpenAI response", {userId, documentId, responseContent});

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        logger.error("[generateStyleSuggestions] Failed to parse OpenAI response as JSON", {responseContent, parseError});
        throw new HttpsError("internal", "OpenAI did not return valid JSON.");
      }
      const suggestionsFromAI = parsedResponse.suggestions || [];
      logger.log("[generateStyleSuggestions] Parsed suggestions", {count: suggestionsFromAI.length, suggestionsFromAI});

      if (suggestionsFromAI.length === 0) {
        logger.log("No style suggestions generated by AI.", {userId, documentId});
        return {success: true, suggestionsAdded: 0};
      }

      const batch = admin.firestore().batch();
      const suggestionsCollection = admin.firestore().collection(`documents/${documentId}/styleSuggestions`);

      suggestionsFromAI.forEach((suggestion, idx) => {
        const newSuggestionRef = suggestionsCollection.doc();
        const newSuggestion = {
          ...suggestion,
          documentId,
          userId,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          position: {start: -1, end: -1},
          confidence: suggestion.confidence || 90,
        };
        logger.log(`[generateStyleSuggestions] Writing suggestion to Firestore`, {idx, newSuggestion});
        batch.set(newSuggestionRef, newSuggestion);
      });

      await batch.commit();
      logger.log(`[generateStyleSuggestions] Successfully wrote all suggestions to Firestore`, {count: suggestionsFromAI.length});

      return {success: true, suggestionsAdded: suggestionsFromAI.length};
    } catch (error) {
      logger.error("[generateStyleSuggestions] Error in function", {fullError: error, errorMessage: error.message, stack: error.stack});
      throw new HttpsError("internal", "Failed to generate and save style suggestions.");
    }
  } catch (outerError) {
    logger.error("[generateStyleSuggestions] Top-level error before function code runs", {fullError: outerError, errorMessage: outerError.message, stack: outerError.stack});
    throw new HttpsError("internal", "Top-level error in generateStyleSuggestions: " + outerError.message);
  }
});

exports.pruneOldVersions = onSchedule(
    {
      schedule: "every day 00:00",
      secrets: ["OPENAI_API_KEY"],
    },
    async (_event) => {
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

// PHASE 8: checkGrammar function completely removed - Harper.js migration completed
// The checkGrammar cloud function has been permanently removed as part of the Harper.js migration.
// Grammar checking now happens entirely client-side using Harper.js WASM engine.
// This eliminates cloud function costs and improves user privacy.
// Legacy AI/Cloud Function grammar checking is no longer supported.

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

  const {documentId, goals, currentDraft, documentTitle} = request.data;
  if (!documentId || !goals) {
    logger.error("Invalid arguments for generateFunnelSuggestions", {documentId, goals});
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'documentId' and 'goals'."
    );
  }

  // Check for existing suggestions to prevent duplicates
  // Phase 1: Removed duplicate prevention logic to allow regeneration
  // The client now handles clearing existing suggestions before calling this function
  logger.log("Phase 1: Proceeding with funnel suggestions generation (duplicate prevention removed)", {
    documentId,
    userId
  });

  // Build comprehensive prompt for funnel copy suggestions with intelligent positioning
  let systemPrompt = `You are a world-class marketing copywriter and funnel optimization expert. Your task is to analyze the existing document content and provide EXACTLY 4 strategic funnel copy suggestions with INTELLIGENT POSITIONING based on the actual content.

CRITICAL: You MUST return a valid JSON object with exactly this structure:

{
  "suggestions": [
    {
      "type": "headline",
      "title": "Attention-Grabbing Headline",
      "description": "A compelling headline that captures attention and communicates core value",
      "suggestedText": "Your primary headline text here (keep under 10 words)",
      "confidence": 85,
      "positioning": {
        "strategy": "insert|replace|append",
        "location": "document-start|after-existing-headline|before-main-content|document-end",
        "targetText": "specific text to replace (if strategy is 'replace')",
        "insertionPoint": "detailed description of where to insert",
        "preserveExisting": true|false
      }
    },
    {
      "type": "subheadline", 
      "title": "Supporting Subheadline",
      "description": "A subheadline that elaborates on the main value proposition",
      "suggestedText": "Your supporting subheadline text here (1-2 sentences)",
      "confidence": 80,
      "positioning": {
        "strategy": "insert",
        "location": "after-headline",
        "targetText": "",
        "insertionPoint": "Insert after any existing headline or at document start if no headline exists",
        "preserveExisting": true
      }
    },
    {
      "type": "cta",
      "title": "Call to Action",
      "description": "A clear, action-oriented CTA that drives the desired behavior",
      "suggestedText": "Your CTA button text here (2-4 words)",
      "confidence": 90,
      "positioning": {
        "strategy": "append",
        "location": "document-end",
        "targetText": "",
        "insertionPoint": "Add at the very end of the document as a final call to action",
        "preserveExisting": true
      }
    },
    {
      "type": "outline",
      "title": "Content Structure",
      "description": "A strategic content outline optimized for conversions",
      "suggestedText": "1. Hook: Opening statement\\n2. Problem: Pain point identification\\n3. Solution: Your offering\\n4. Benefits: Key advantages\\n5. Social Proof: Testimonials/stats\\n6. Call to Action: Final push",
      "confidence": 75,
      "positioning": {
        "strategy": "insert",
        "location": "after-headlines",
        "targetText": "",
        "insertionPoint": "Insert after any existing headlines but before the main body content",
        "preserveExisting": true
      }
    }
  ],
  "generatedAt": ${Date.now()},
  "basedOnGoals": true,
  "documentAnalysis": {
    "hasExistingHeadline": false,
    "hasExistingCTA": false,
    "contentLength": 0,
    "mainContentStart": 0
  }
}

POSITIONING STRATEGIES:
- "insert": Add new content without removing existing content
- "replace": Replace specific existing text with the suggestion
- "append": Add content at the end of the document

LOCATION OPTIONS:
- "document-start": Very beginning of the document
- "after-existing-headline": After any existing headline/title
- "before-main-content": Before the main body content starts
- "after-headlines": After all headline-level content
- "document-end": At the very end of the document

INTELLIGENT POSITIONING RULES:
1. If document has existing headlines, place new headlines strategically around them
2. If document is very long (>1000 chars), prefer insertion over replacement
3. If document is short (<500 chars), consider strategic replacement
4. Always preserve existing valuable content unless explicitly replacing
5. For CTAs, check if document already has call-to-action language
6. For outlines, place them where they provide maximum structural benefit

STRICT REQUIREMENTS:
- Always generate EXACTLY 4 suggestions with types: headline, subheadline, cta, outline
- Never use hyphens in any text fields (use em dashes — or other punctuation)
- Keep headlines under 10 words
- Keep CTAs under 4 words
- Make outlines specific and actionable
- Analyze the existing content to determine the best positioning strategy
- Preserve existing content unless replacement is clearly beneficial

Document Context:
- Title: ${documentTitle || 'Untitled'}
- Target Audience: ${goals.audience || 'general audience'}
- Formality Level: ${goals.formality || 'professional'}
- Marketing Domain: ${goals.domain || 'general business'}
- Primary Intent: ${goals.intent || 'inform'}
- Document Length: ${currentDraft ? currentDraft.length : 0} characters

Focus Areas Based on Goals:
1. Headlines: Match the ${goals.formality || 'professional'} tone while appealing to ${goals.audience || 'general audience'}
2. Subheadlines: Elaborate on value for ${goals.audience || 'general audience'} in ${goals.domain || 'business'} context
3. CTAs: Drive ${goals.intent || 'engagement'} behavior with appropriate urgency
4. Outlines: Structure content to achieve ${goals.intent || 'informational'} goals

DOCUMENT CONTENT ANALYSIS:
${currentDraft && currentDraft.trim() ? 
  `Current Document Content (${currentDraft.length} chars):
${currentDraft.substring(0, 2000)}${currentDraft.length > 2000 ? '...[content truncated]' : ''}

ANALYZE THIS CONTENT TO DETERMINE:
1. Does it have existing headlines? Where?
2. Does it have existing CTAs? Where?
3. What is the main content structure?
4. Where would funnel suggestions add the most value?
5. What content should be preserved vs. enhanced?` 
  : 
  'No document body provided - create suggestions optimized for a new document with strategic positioning.'}`;

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
            confidence: 70,
            positioning: {
              strategy: 'insert',
              location: 'document-start',
              targetText: '',
              insertionPoint: 'Insert at the very beginning of the document',
              preserveExisting: true
            }
          },
          subheadline: {
            title: "Supporting Subheadline", 
            description: "Supporting information about your value proposition",
            suggestedText: `Discover how ${goals.audience || 'professionals'} can achieve better results with our proven approach.`,
            confidence: 65,
            positioning: {
              strategy: 'insert',
              location: 'after-headline',
              targetText: '',
              insertionPoint: 'Insert after any existing headline or at document start if no headline exists',
              preserveExisting: true
            }
          },
          cta: {
            title: "Call to Action",
            description: "Action-oriented button text",
            suggestedText: "Get Started",
            confidence: 80,
            positioning: {
              strategy: 'append',
              location: 'document-end',
              targetText: '',
              insertionPoint: 'Add at the very end of the document as a final call to action',
              preserveExisting: true
            }
          },
          outline: {
            title: "Content Structure",
            description: "Strategic content outline for maximum impact",
            suggestedText: "1. Hook: Opening that grabs attention\n2. Problem: Identify key challenges\n3. Solution: Present your offering\n4. Benefits: Show clear advantages\n5. Proof: Add credibility\n6. Action: Clear next steps",
            confidence: 60,
            positioning: {
              strategy: 'insert',
              location: 'after-headlines',
              targetText: '',
              insertionPoint: 'Insert after any existing headlines but before the main body content',
              preserveExisting: true
            }
          }
        };
        
        return {
          type,
          ...defaults[type]
        };
      });
      
      suggestions.splice(0, suggestions.length, ...standardizedSuggestions);
    }

    // Enhance suggestions with consistent metadata and unique IDs
    const timestamp = Date.now();
    const enhancedSuggestions = suggestions.map((suggestion) => ({
      ...suggestion,
      id: `funnel_${documentId}_${timestamp}_${suggestion.type}`, // Use type in ID for uniqueness
      documentId,
      userId,
      status: "pending",
      createdAt: timestamp,
      targetAudience: goals.audience || 'general',
      intent: goals.intent || 'inform',
      domain: goals.domain || 'business',
      originalText: '', // Funnel suggestions don't replace text initially
      // Ensure positioning structure exists, with fallback for backward compatibility
      positioning: suggestion.positioning || {
        strategy: 'insert',
        location: {
          headline: 'document-start',
          subheadline: 'after-headline', 
          cta: 'document-end',
          outline: 'after-headlines'
        }[suggestion.type] || 'document-end',
        targetText: '',
        insertionPoint: `Insert ${suggestion.type} at appropriate location`,
        preserveExisting: true
      },
      // Keep legacy position field for backward compatibility
      position: suggestion.position || suggestion.positioning?.location || {
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
