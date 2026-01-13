import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPrompts, organizations } from '@/lib/db/schema';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { eq, and, isNull, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { substitutePromptVariables } from '@/lib/utils/prompt-helpers';
import { parseBrandVoice, injectBrandVoice, getGoogleAdsBrandVoiceTemplate } from '@/lib/utils/brand-voice';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Authenticate and get tenant context
    const context = await protectTenantRoute();

    const { landing_page, primary_keyword, secondary_keywords = [], match_type = 'broad', prompt_id } = await request.json();

    if (!landing_page || !primary_keyword) {
      return NextResponse.json(
        { error: 'landing_page and primary_keyword are required' },
        { status: 400 }
      );
    }

    const secondaryKeywordsText = secondary_keywords.length > 0
      ? secondary_keywords.join(', ')
      : 'None';

    // Fetch prompt from database
    let prompt;
    if (prompt_id) {
      // User selected specific prompt
      const prompts = await db.select()
        .from(aiPrompts)
        .where(
          and(
            eq(aiPrompts.id, prompt_id),
            or(
              eq(aiPrompts.workspaceId, context.workspaceId),
              isNull(aiPrompts.workspaceId)
            ),
            eq(aiPrompts.category, 'google_ads'),
            eq(aiPrompts.isActive, true)
          )
        )
        .limit(1);

      prompt = prompts[0];
    } else {
      // Use default for this category - first try org default, then system default
      const prompts = await db.select()
        .from(aiPrompts)
        .where(
          and(
            eq(aiPrompts.category, 'google_ads'),
            or(
              eq(aiPrompts.workspaceId, context.workspaceId),
              isNull(aiPrompts.workspaceId)
            ),
            eq(aiPrompts.isDefault, true),
            eq(aiPrompts.isActive, true)
          )
        )
        .orderBy(aiPrompts.workspaceId) // Org prompts before system prompts
        .limit(1);

      prompt = prompts[0];
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'No active Google Ads prompt found. Please create a prompt or contact support.' },
        { status: 404 }
      );
    }

    // Fetch organization's brand voice profile
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(workspaces.id, context.workspaceId))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const brandVoice = parseBrandVoice(organization.brandVoiceProfile);

    if (!brandVoice) {
      return NextResponse.json(
        {
          error: 'Brand voice not set. Please set up your Brand Voice in Settings first.',
          redirect: '/dashboard/settings/brand-voice'
        },
        { status: 400 }
      );
    }

    // Substitute variables in prompt text
    const promptVariables = {
      landing_page,
      primary_keyword,
      secondary_keywords: secondaryKeywordsText,
      match_type,
    };

    let userPromptText = substitutePromptVariables(prompt.promptText, promptVariables);

    // Inject brand voice into the prompt
    const brandVoiceTemplate = getGoogleAdsBrandVoiceTemplate();
    const brandVoiceSection = injectBrandVoice(brandVoiceTemplate, brandVoice);

    // Prepend brand voice guidelines to the user prompt
    userPromptText = `${brandVoiceSection}\n\n${userPromptText}`;

    const systemPrompt = `You're an expert Google Ads specialist creating a complete ad campaign optimized for 10/10 Quality Score.

You are writing for ${brandVoice.brand_name}. Headlines should sound like ${brandVoice.brand_name}, not generic ads. Match their tone and style.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPromptText,
        },
      ],
    });

    // Track usage
    await db.update(aiPrompts)
      .set({ usageCount: sql`${aiPrompts.usageCount} + 1` })
      .where(eq(aiPrompts.id, prompt.id));

    // Extract the JSON from Claude's response
    let responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Remove markdown code fences if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');

    // Parse the JSON response
    let result;
    try {
      // Try to find JSON in the response (in case Claude adds explanation text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating Google ad:', error);
    return NextResponse.json(
      { error: 'Failed to generate ad campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
