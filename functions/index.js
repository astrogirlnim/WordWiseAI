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

exports.cleanupPresence = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const presenceRef = admin.database().ref('documents');
    const now = Date.now();
    const cutoff = now - 2 * 60 * 1000; // 2 minutes ago

    const snapshot = await presenceRef.once('value');
    const updates = {};

    snapshot.forEach((doc) => {
        const presence = doc.child('presence');
        presence.forEach((user) => {
            if (user.val().timestamp < cutoff) {
                updates[user.key] = null;
            }
        });
        if (Object.keys(updates).length > 0) {
            presence.ref.update(updates);
        }
    });

    return null;
});

exports.processGlossary = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath.startsWith('glossaries/')) {
        return null;
    }

    if (contentType !== 'text/csv' && contentType !== 'application/json') {
        console.log('Unsupported file type.');
        return null;
    }

    const fileBucket = object.bucket;
    const bucket = admin.storage().bucket(fileBucket);
    const file = bucket.file(filePath);

    const contents = (await file.download()).toString('utf8');
    const pathParts = filePath.split('/');
    const userId = pathParts[1];
    const fileId = pathParts[2].split('.')[0];

    let terms;
    if (contentType === 'application/json') {
        terms = JSON.parse(contents);
    } else {
        // Simple CSV parsing
        terms = contents.split('\n').map(line => {
            const [term, definition] = line.split(',');
            return { term, definition };
        });
    }

    try {
        await admin.firestore().collection('glossaries').doc(fileId).set({
            userId,
            terms,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Glossary ${fileId} processed successfully.`);
    } catch (error) {
        console.error(`Error processing glossary ${fileId}:`, error);
    }

    return null;
});

exports.pruneSnapshots = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const docsRef = db.collection('docs');
    const snapshot = await docsRef.get();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timestamp30DaysAgo = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    snapshot.forEach(async (doc) => {
        const versionsRef = doc.ref.collection('versions');
        const versionsSnapshot = await versionsRef.orderBy('createdAt', 'desc').get();

        if (versionsSnapshot.size > 100) {
            const versionsToDelete = versionsSnapshot.docs.slice(100);
            versionsToDelete.forEach(async (versionDoc) => {
                await versionDoc.ref.delete();
            });
        }

        const oldVersionsQuery = versionsRef.where('createdAt', '<', timestamp30DaysAgo);
        const oldVersionsSnapshot = await oldVersionsQuery.get();
        oldVersionsSnapshot.forEach(async (versionDoc) => {
            await versionDoc.ref.delete();
        });
    });

    return null;
});

exports.logDocumentChanges = functions.firestore
    .document('docs/{docId}')
    .onWrite(async (change, context) => {
        const docId = context.params.docId;
        const db = admin.firestore();
        const logRef = db.collection('auditLogs');

        if (!change.before.exists) {
            // Document created
            await logRef.add({
                docId,
                eventType: 'create',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: change.after.data().ownerId,
            });
        } else if (!change.after.exists) {
            // Document deleted
            await logRef.add({
                docId,
                eventType: 'delete',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: change.before.data().ownerId,
            });
        } else {
            // Document updated
            await logRef.add({
                docId,
                eventType: 'update',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: change.after.data().ownerId,
            });
        }

        return null;
    });
