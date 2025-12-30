import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { injectBrandVoice, getMetaAdsBrandVoiceTemplate, type BrandVoiceProfile } from '@/lib/utils/brand-voice';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/organization/brand-voice/preview
 * Generate a sample Meta ad with and without brand voice for comparison
 */
export async function POST(request: NextRequest) {
  try {
    const brandVoice: BrandVoiceProfile = await request.json();

    // Generic prompt (before)
    const genericPrompt = `You are a professional copywriter. Write a short Meta ad (2-3 sentences) for a hypothetical product in the ${brandVoice.industry_expertise} industry.

Make it compelling and professional.`;

    // Brand voice prompt (after)
    const brandVoiceTemplate = getMetaAdsBrandVoiceTemplate();
    const brandVoiceSection = injectBrandVoice(brandVoiceTemplate, brandVoice);

    const brandedPrompt = `${brandVoiceSection}

Now write a short Meta ad (2-3 sentences) for a hypothetical product in the ${brandVoice.industry_expertise} industry.

Remember: Write exactly like ${brandVoice.brand_name}. Match the tone, style, and energy of the examples provided.`;

    // Generate both versions in parallel
    const [genericResponse, brandedResponse] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: genericPrompt,
          },
        ],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: brandedPrompt,
          },
        ],
      }),
    ]);

    const genericText = genericResponse.content[0].type === 'text'
      ? genericResponse.content[0].text
      : 'Failed to generate';

    const brandedText = brandedResponse.content[0].type === 'text'
      ? brandedResponse.content[0].text
      : 'Failed to generate';

    return NextResponse.json({
      success: true,
      data: {
        before: genericText,
        after: brandedText,
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
