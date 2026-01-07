import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/business/scripts/practice
 * Start or continue AI practice session (role-play conversation)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Practice Session] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      scriptId,
      scriptContent,
      personaType,
      difficultyLevel,
      clientContext,
      conversationHistory,
      userMessage,
      isFirstMessage,
    } = body;

    // Validation
    if (!scriptContent || !personaType || !difficultyLevel || !userMessage) {
      return NextResponse.json(
        { error: 'Script content, persona type, difficulty level, and user message are required' },
        { status: 400 }
      );
    }

    // Build system prompt based on persona
    const personaPrompts: Record<string, string> = {
      skeptical: "You are a skeptical prospect who questions everything and needs strong proof before believing claims.",
      budget_conscious: "You are very concerned about cost and ROI. You ask detailed questions about pricing and value.",
      decision_maker: "You are a busy decision-maker. You want quick, clear value propositions and have limited time.",
      technical: "You are a technical buyer who asks detailed product questions and cares about implementation.",
      friendly: "You are a warm, interested prospect who asks clarifying questions and shows buying signals.",
      difficult: "You are a challenging prospect with many objections and excuses. You're hard to convince.",
    };

    const difficultyInstructions: Record<string, string> = {
      easy: "Be somewhat receptive. Ask 1-2 basic questions. Show buying signals when addressed well.",
      medium: "Be moderately challenging. Ask 3-4 thoughtful questions. Raise 1-2 mild objections.",
      hard: "Be very challenging. Ask 5+ tough questions. Raise multiple strong objections. Make the rep work for it.",
    };

    const systemPrompt = `${personaPrompts[personaType] || personaPrompts.skeptical}

${difficultyInstructions[difficultyLevel] || difficultyInstructions.medium}

${clientContext ? `\nClient/Prospect Context:\n${clientContext}\n` : ''}

The sales rep is using this script as guidance:
${scriptContent}

Respond naturally as this type of prospect would. Ask questions, raise objections, and show interest/disinterest based on how well the rep handles the conversation.

Keep responses concise (2-4 sentences). Stay in character throughout.`;

    // Build conversation context
    const messages: any[] = conversationHistory || [];

    // Add user's message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    console.log('[Practice Session] Calling Claude API...');
    console.log('[Practice Session] Persona:', personaType);
    console.log('[Practice Session] Difficulty:', difficultyLevel);

    const startTime = Date.now();

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages,
    });

    const processingTime = Date.now() - startTime;
    const prospectResponse = aiResponse.content[0].type === 'text'
      ? aiResponse.content[0].text
      : '';

    // Add AI response to conversation history
    messages.push({
      role: 'assistant',
      content: prospectResponse,
    });

    console.log('[Practice Session] ✅ Response generated');

    return NextResponse.json({
      success: true,
      prospectResponse,
      conversationHistory: messages,
      tokensUsed: aiResponse.usage.input_tokens + aiResponse.usage.output_tokens,
    });
  } catch (error) {
    console.error('Error in practice session:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to process practice session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
