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

// Example function (commented out):
// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
//
// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { OpenAI } = require('openai')
require('dotenv').config()

admin.initializeApp()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Per-user rate limiting
const accesses = {}

exports.generateSuggestions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.',
    )
  }

  const uid = context.auth.uid
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 30

  const userAccesses = accesses[uid] || []
  const recentAccesses = userAccesses.filter(
    (timestamp) => now - timestamp < windowMs,
  )

  if (recentAccesses.length >= maxRequests) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'You have exceeded the rate limit. Please try again in a minute.',
    )
  }

  accesses[uid] = [...recentAccesses, now]

  const { text } = data
  if (!text) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      "The function must be called with one argument 'text' containing the text to analyze.",
    )
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are a writing assistant. Analyze the following text and provide structured suggestions for improvement. Return the suggestions in a JSON array format, where each object has a 'suggestion' and a 'category' (e.g., 'grammar', 'style', 'clarity').",
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(completion.choices[0].message.content)
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    throw new functions.https.HttpsError(
      'internal',
      'There was an error processing your request.',
    )
  }
})

exports.healthCheck = functions.https.onCall(async () => {
  const startTime = Date.now()
  try {
    await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: 'Health check',
      max_tokens: 1,
    })
    const endTime = Date.now()
    return { success: true, latency: endTime - startTime }
  } catch (error) {
    console.error('Health check failed:', error)
    return { success: false, error: 'OpenAI API is not reachable' }
  }
})
