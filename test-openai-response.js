require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

// Test script to debug OpenAI response format - REAL API CALL
async function testOpenAIResponse() {
  console.log('🔍 Testing OpenAI API with REAL call...');
  console.log('API Key available:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const goals = {
    domain: 'marketing-copy',
    audience: 'consumers', 
    formality: 'professional',
    intent: 'persuade'
  };

  const currentDraft = '# Elevate Your Brand Today ## Discover proven strategies to enhance your brand\'s visibility and consumer engagement. **Start Now** 1. Hook: Elevate your brand visibility instantly 2. Problem: Common struggles with consumer engagement 3. Solution: Implement our effective marketing strategies 4. Benefits: Achieve superior brand recognition 5. Social Proof: Hear success stories from satisfied clients 6. Call to Action: Take action today';
  const documentTitle = 'Test Grammar';

  const systemPrompt = `You are a world-class marketing copywriter and funnel optimization expert. Your task is to analyze the existing document content and provide EXACTLY 4 strategic funnel copy suggestions with INTELLIGENT POSITIONING based on the actual content.

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
      "suggestedText": "1. Hook: Opening statement\\n2. Problem: Challenge identification\\n3. Solution: Your offering\\n4. Benefits: Clear advantages\\n5. Proof: Credibility markers\\n6. Action: Next steps",
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
- YOU MUST INCLUDE THE "positioning" OBJECT FOR EACH SUGGESTION

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
    console.log('📄 Document content length:', currentDraft.length);
    console.log('📄 Document content preview:', currentDraft.substring(0, 200));
    console.log('🎯 Goals:', JSON.stringify(goals, null, 2));
    console.log('\n🚀 Making REAL OpenAI API call...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: `Generate funnel copy suggestions for a ${goals.domain || 'business'} piece targeting ${goals.audience || 'general audience'} with ${goals.formality || 'professional'} tone to ${goals.intent || 'inform'}.`}
      ],
      response_format: {type: "json_object"},
      temperature: 0.7
    });

    const responseContent = completion.choices[0].message.content;
    console.log('\n📋 === RAW OPENAI RESPONSE ===');
    console.log(responseContent);
    
    console.log('\n🔍 === PARSED RESPONSE ===');
    const parsedResponse = JSON.parse(responseContent);
    console.log(JSON.stringify(parsedResponse, null, 2));
    
    console.log('\n🎯 === POSITIONING ANALYSIS ===');
    console.log(`Total suggestions: ${parsedResponse.suggestions?.length || 0}`);
    
    parsedResponse.suggestions?.forEach((suggestion, index) => {
      console.log(`\n📝 Suggestion ${index + 1} (${suggestion.type}):`);
      console.log(`  Title: ${suggestion.title}`);
      console.log(`  Text: ${suggestion.suggestedText}`);
      console.log(`  Has positioning: ${!!suggestion.positioning}`);
      
      if (suggestion.positioning) {
        console.log(`  ✅ Strategy: ${suggestion.positioning.strategy}`);
        console.log(`  ✅ Location: ${suggestion.positioning.location}`);
        console.log(`  ✅ Preserve existing: ${suggestion.positioning.preserveExisting}`);
        console.log(`  ✅ Insertion point: ${suggestion.positioning.insertionPoint}`);
        if (suggestion.positioning.targetText) {
          console.log(`  ✅ Target text: ${suggestion.positioning.targetText}`);
        }
      } else {
        console.log(`  ❌ MISSING POSITIONING FIELD!`);
      }
    });
    
    // Test what happens when we apply the fallback logic
    console.log('\n🔧 === FALLBACK LOGIC TEST ===');
    parsedResponse.suggestions?.forEach((suggestion, index) => {
      if (!suggestion.positioning) {
        console.log(`\n🚨 Suggestion ${index + 1} missing positioning, applying fallback:`);
        const fallbackPositioning = {
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
        };
        console.log(`  Fallback positioning:`, JSON.stringify(fallbackPositioning, null, 4));
      }
    });
    
    console.log('\n✅ OpenAI test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing OpenAI response:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOpenAIResponse().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test failed:', error);
}); 