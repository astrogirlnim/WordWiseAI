const functionsTest = require('firebase-functions-test')({ projectId: 'test-project' });

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const setMock = jest.fn();
  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
      batch: () => ({
        set: setMock,
        commit: jest.fn().mockResolvedValue(null),
      }),
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          id: 'mockDocId',
        })),
      })),
      FieldValue: {
        serverTimestamp: () => Date.now(),
      },
    })),
  };
});

// Mock OpenAI SDK to return urgency and trust suggestions
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    suggestions: [
                      {
                        type: 'urgency',
                        title: 'Add urgency',
                        description: 'Create FOMO',
                        originalText: 'Limited seats',
                        suggestedText: 'Only 3 seats left — claim now',
                      },
                      {
                        type: 'trust',
                        title: 'Build trust',
                        description: 'Add social proof',
                        originalText: 'Join us',
                        suggestedText: 'Join 5,000+ happy customers',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Import cloud functions after mocks are set up
const myFunctions = require('../index');

describe('generateStyleSuggestions Cloud Function', () => {
  afterAll(() => {
    functionsTest.cleanup();
  });

  it('should accept urgency and trust suggestion types', async () => {
    const wrapped = functionsTest.wrap(myFunctions.generateStyleSuggestions);

    const result = await wrapped({
      text: 'Sample marketing copy',
      documentId: 'doc123',
    }, {
      auth: { uid: 'user_abc' },
    });

    expect(result.success).toBe(true);
    expect(result.suggestionsAdded).toBe(2);
  });
});