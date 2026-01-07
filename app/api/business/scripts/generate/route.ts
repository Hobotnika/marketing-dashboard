import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/business/scripts/generate
 * Generate personalized script variations using AI
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Script Generator] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      baseScript,
      clientContext,
      toneAdjustment,
      lengthPreference,
      specificGoals,
    } = body;

    // Validation
    if (!baseScript) {
      return NextResponse.json(
        { error: 'Base script is required' },
        { status: 400 }
      );
    }

    const prompt = `You are a sales script writer creating personalized conversation scripts.

Base Script Template:
${baseScript}

Client Context:
${clientContext || 'No specific context provided'}

Customization Requirements:
- Tone: ${toneAdjustment || 'professional'}
- Length: ${lengthPreference || 'standard'}
- Goals: ${specificGoals || 'General sales conversation'}

Generate 3 personalized variations of this script that:
1. Maintain the core structure and key talking points
2. Adapt the tone to match the requirement (${toneAdjustment || 'professional'})
3. Personalize based on client context
4. Achieve the specific goals mentioned
5. Feel natural and conversational

Format each variation clearly with:
**Variation 1: [Brief descriptor]**
[Script content]

**Variation 2: [Brief descriptor]**
[Script content]

**Variation 3: [Brief descriptor]**
[Script content]

Make them distinct from each other while all being effective.`;

    console.log('[Script Generator] Calling Claude API...');

    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const processingTime = Date.now() - startTime;
    const generatedContent = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log('[Script Generator] ✅ Generation complete');
    console.log('[Script Generator] Tokens used:', message.usage.input_tokens + message.usage.output_tokens);
    console.log('[Script Generator] Processing time:', processingTime + 'ms');

    return NextResponse.json({
      success: true,
      variations: generatedContent,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      processingTime,
    });
  } catch (error) {
    console.error('Error generating script:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to generate script',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
