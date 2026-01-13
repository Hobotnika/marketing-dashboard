import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPrompts, organizations } from '@/lib/db/schema';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { eq, and, isNull, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { substitutePromptVariables } from '@/lib/utils/prompt-helpers';
import { parseBrandVoice, injectBrandVoice, getMetaAdsBrandVoiceTemplate } from '@/lib/utils/brand-voice';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Authenticate and get tenant context
    const context = await protectTenantRoute();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Meta Ad] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const { landing_page, prompt_id } = await request.json();

    if (!landing_page) {
      console.error('[Meta Ad] Missing landing page URL');
      console.error('[Meta Ad] Request body:', { landing_page, prompt_id });
      return NextResponse.json(
        { error: 'landing_page is required' },
        { status: 400 }
      );
    }

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
            eq(aiPrompts.category, 'meta_ads'),
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
            eq(aiPrompts.category, 'meta_ads'),
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
      console.error('[Meta Ad] No active Meta Ads prompt found');
      console.error('[Meta Ad] Organization ID:', context.workspaceId);
      console.error('[Meta Ad] Prompt ID requested:', prompt_id);
      return NextResponse.json(
        { error: 'No active Meta Ads prompt found. Please create a prompt or contact support.' },
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
      console.error('[Meta Ad] Organization not found in database');
      console.error('[Meta Ad] Organization ID:', context.workspaceId);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const brandVoice = parseBrandVoice(organization.brandVoiceProfile);

    if (!brandVoice) {
      console.error('[Meta Ad] Brand voice not configured');
      console.error('[Meta Ad] Organization ID:', context.workspaceId);
      console.error('[Meta Ad] Organization name:', organization.name);
      console.error('[Meta Ad] Brand voice profile value:', organization.brandVoiceProfile);
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
    };

    let userPromptText = substitutePromptVariables(prompt.promptText, promptVariables);

    // Inject brand voice into the prompt
    const brandVoiceTemplate = getMetaAdsBrandVoiceTemplate();
    const brandVoiceSection = injectBrandVoice(brandVoiceTemplate, brandVoice);

    // Prepend brand voice guidelines to the user prompt
    userPromptText = `${brandVoiceSection}\n\n${userPromptText}`;

    const systemPrompt = `You're an experienced Facebook Ads specialist writing as ${brandVoice.brand_name}.

Create 3 long-form ad variations (600-900 words each) using PASTOR, Story-Bridge, and Social Proof formulas.

CRITICAL: Write in ${brandVoice.brand_name}'s exact voice and tone. Match the style, energy, and personality shown in their examples. Sound like ${brandVoice.brand_name}, NOT a generic AI copywriter.

Return as JSON.`;

    console.log('[Meta Ad] Calling Claude API...');
    console.log('[Meta Ad] Brand name:', brandVoice.brand_name);
    console.log('[Meta Ad] Landing page:', landing_page);
    console.log('[Meta Ad] Prompt ID:', prompt.id);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
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

    console.log('[Meta Ad] ✅ Successfully generated ad variations');
    console.log('[Meta Ad] Variations count:', result.variations?.length || 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error('=== META AD GENERATION ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');

    // Log additional context
    if (error instanceof Error && error.message.includes('API')) {
      console.error('API Key configured:', !!process.env.ANTHROPIC_API_KEY);
    }

    console.error('================================');

    return NextResponse.json(
      {
        error: 'Failed to generate ad copy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
