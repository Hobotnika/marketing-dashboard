import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { organizations, clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/business/offers/generate
 * Generate offer content using AI
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      clientId,
      serviceDescription,
      clientPainPoints,
      budgetRange,
      pricingStrategy,
      tone,
      generationType, // 'full_offer', 'pricing_tiers', 'personalized_intro', 'enhance_existing'
      existingContent,
    } = body;

    // Fetch organization brand voice
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, context.organizationId))
      .limit(1);

    const brandVoiceProfile = org[0]?.brandVoiceProfile
      ? JSON.parse(org[0].brandVoiceProfile)
      : null;
    const brandVoice = brandVoiceProfile?.tone || 'Professional and clear';

    // Fetch client details if provided
    let clientContext = '';
    if (clientId) {
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      if (client[0]) {
        clientContext = `Client Name: ${client[0].name}\nCompany: ${client[0].company || 'N/A'}\nPlan: ${client[0].plan}\nIndustry: ${client[0].industry || 'N/A'}`;
      }
    }

    let prompt = '';

    // Build prompt based on generation type
    if (generationType === 'full_offer') {
      prompt = `You are a professional proposal writer creating a compelling business offer.

Brand Voice: ${brandVoice}
Tone: ${tone || 'professional'}

${clientContext ? `Client Context:\n${clientContext}\n` : ''}

Service/Product: ${serviceDescription || 'Not specified'}

Client Pain Points:
${clientPainPoints || 'Not specified'}

Budget Range: ${budgetRange || 'Not specified'}
Pricing Strategy: ${pricingStrategy || 'value-based'}

Create a complete, persuasive offer with these sections:

1. **Executive Summary** (2-3 sentences)
   Hook them with the transformation you'll deliver

2. **The Problem** (3-4 sentences)
   Mirror their pain points back to them

3. **The Solution** (paragraph)
   How your service solves their problem

4. **What's Included** (bullet list)
   Specific deliverables and benefits

5. **Timeline** (brief)
   Realistic implementation schedule

6. **Investment** (pricing section)
   Present pricing with value justification

7. **Why Us** (3-4 points)
   Your unique advantages

8. **Next Steps** (clear CTA)
   What happens after they accept

Make it benefit-driven, not feature-heavy. Use active voice. Be specific with outcomes.

Return the offer in plain text format with clear section headings.`;
    } else if (generationType === 'pricing_tiers') {
      prompt = `Create Good-Better-Best pricing tiers for this offer:

Service: ${serviceDescription}
Budget Range: ${budgetRange || 'Flexible'}
Brand Voice: ${brandVoice}

Create 3 tiers:

**GOOD (Basic)**
- Price point: Lower end of budget
- Core features only
- Best for: [who]
- Includes: [3-4 items]

**BETTER (Standard)** ⭐ RECOMMENDED
- Price point: Mid-range
- Core + valuable additions
- Best for: [who]
- Includes: [5-6 items]

**BEST (Premium)**
- Price point: Upper end
- Everything + VIP perks
- Best for: [who]
- Includes: [7-8 items]

Make each tier clearly differentiated. Use anchoring psychology. Format as structured text.`;
    } else if (generationType === 'personalized_intro') {
      prompt = `Write a personalized introduction for this offer:

${clientContext || 'No client information provided'}

Service: ${serviceDescription}
Client Pain Points: ${clientPainPoints}
Tone: ${tone || 'professional'}
Brand Voice: ${brandVoice}

Write a warm, personalized 3-4 sentence introduction that:
1. Acknowledges their specific situation
2. Shows you understand their pain points
3. Positions this offer as the solution they need
4. Creates excitement

Be genuine, not salesy.`;
    } else if (generationType === 'enhance_existing') {
      prompt = `Enhance this existing offer to make it more compelling:

Current Offer Content:
${existingContent || 'No content provided'}

Brand Voice: ${brandVoice}

Improve by:
1. Strengthening value propositions
2. Making benefits more specific and tangible
3. Adding social proof or credibility elements where appropriate
4. Improving call-to-action clarity
5. Ensuring benefit-driven language (not just features)

Return the enhanced version with these improvements applied.`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid generation type' },
        { status: 400 }
      );
    }

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

    const generatedContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      success: true,
      content: generatedContent,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
      },
      processingTime,
    });
  } catch (error) {
    console.error('Error generating offer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate offer' },
      { status: 500 }
    );
  }
}
