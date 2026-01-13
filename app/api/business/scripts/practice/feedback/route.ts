import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { practiceSessions } from '@/lib/db/schema';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/business/scripts/practice/feedback
 * Get AI feedback on completed practice session
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Practice Feedback] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      scriptId,
      scriptTitle,
      personaType,
      difficultyLevel,
      conversationHistory,
      durationSeconds,
      clientContext,
    } = body;

    // Validation
    if (!scriptId || !conversationHistory) {
      return NextResponse.json(
        { error: 'Script ID and conversation history are required' },
        { status: 400 }
      );
    }

    // Format conversation transcript
    const transcript = conversationHistory
      .map((msg: any, index: number) => {
        const speaker = msg.role === 'user' ? 'Sales Rep' : 'Prospect';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const durationMinutes = durationSeconds ? (durationSeconds / 60).toFixed(1) : 'N/A';

    const systemPrompt = `You are an expert sales coach providing feedback on practice conversations.

Analyze this practice session and provide constructive, specific feedback.

Be honest but supportive. Focus on actionable improvements.`;

    const userPrompt = `Practice Session Details:
- Script Used: ${scriptTitle || 'Unknown'}
- Persona: ${personaType}
- Difficulty: ${difficultyLevel}
- Duration: ${durationMinutes} minutes
${clientContext ? `- Client Context: ${clientContext}` : ''}

Conversation Transcript:
${transcript}

Analyze this practice session and provide:

1. **Overall Score** (1-10)
   Rate the sales rep's performance

2. **What Went Well** (3-5 specific points)
   - Strong moments
   - Good techniques used
   - Effective responses

3. **Areas to Improve** (3-5 specific points)
   - Weak points in the conversation
   - Missed opportunities
   - Better approaches

4. **Objection Handling**
   - How well did they handle objections?
   - What could be better?

5. **Missed Opportunities**
   - Where could they have probed deeper?
   - Buying signals they missed
   - Questions they should have asked

6. **Specific Advice for Next Practice**
   - Concrete techniques to practice
   - What to focus on improving

Be constructive, specific, and actionable. Use examples from the transcript.

Format your response as:
## Overall Score: [X]/10

## What Went Well
- [point 1]
- [point 2]
...

## Areas to Improve
- [point 1]
- [point 2]
...

## Objection Handling
[feedback]

## Missed Opportunities
- [point 1]
- [point 2]
...

## Specific Advice
[concrete advice]`;

    console.log('[Practice Feedback] Calling Claude API...');

    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const processingTime = Date.now() - startTime;
    const feedbackText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract score from feedback (look for "Overall Score: X/10")
    const scoreMatch = feedbackText.match(/Overall Score:\s*(\d+)\/10/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    // Extract sections
    const whatWentWellMatch = feedbackText.match(/## What Went Well\n([\s\S]*?)(?=\n## |$)/);
    const areasToImproveMatch = feedbackText.match(/## Areas to Improve\n([\s\S]*?)(?=\n## |$)/);
    const missedOpportunitiesMatch = feedbackText.match(/## Missed Opportunities\n([\s\S]*?)(?=\n## |$)/);

    const whatWentWell = whatWentWellMatch ? whatWentWellMatch[1].trim() : null;
    const areasToImprove = areasToImproveMatch ? areasToImproveMatch[1].trim() : null;
    const missedOpportunities = missedOpportunitiesMatch ? missedOpportunitiesMatch[1].trim() : null;

    console.log('[Practice Feedback] ✅ Feedback generated');
    console.log('[Practice Feedback] Score:', score);

    // Save practice session to database
    const session = await db
      .insert(practiceSessions)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        scriptId,
        personaType,
        difficultyLevel,
        clientContext: clientContext || null,
        conversationHistory: JSON.stringify(conversationHistory),
        durationSeconds: durationSeconds || null,
        aiFeedbackScore: score,
        aiFeedbackText: feedbackText,
        whatWentWell,
        areasToImprove,
        missedOpportunities,
        practiceDate: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      feedback: {
        score,
        fullText: feedbackText,
        whatWentWell,
        areasToImprove,
        missedOpportunities,
      },
      sessionId: session[0].id,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (error) {
    console.error('Error generating feedback:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to generate feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
