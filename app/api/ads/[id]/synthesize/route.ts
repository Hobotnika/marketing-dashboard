import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { workspaces, ads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Feedback {
  avatarName: string;
  feedback: string;
  sentiment: 'positive' | 'mixed' | 'negative';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;

    console.log('[Copywriter Synthesis] Starting for ad:', adId);

    const workspaceId = request.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    // Get request body
    const { feedbacks, originalAdCopy } = await request.json();

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No avatar feedbacks provided' },
        { status: 400 }
      );
    }

    console.log('[Copywriter Synthesis] Feedbacks count:', feedbacks.length);

    // Check if this is a Google Ads campaign
    const ad = await db.query.ads.findFirst({
      where: eq(ads.id, adId)
    });

    const isGoogleAd = ad?.adType === 'google';
    console.log('[Copywriter Synthesis] Ad type:', ad?.adType);

    // Get organization and brand voice
    const organization = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId)
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const brandVoiceRaw = organization.brandVoiceProfile;

    if (!brandVoiceRaw) {
      return NextResponse.json(
        { error: 'Brand voice not configured' },
        { status: 400 }
      );
    }

    // Parse brand voice if it's a string
    const brandVoice = typeof brandVoiceRaw === 'string'
      ? JSON.parse(brandVoiceRaw)
      : brandVoiceRaw;

    console.log('[Copywriter Synthesis] Brand:', brandVoice.brand_name);

    // Build feedback sections
    const feedbackSections = feedbacks.map((f: Feedback) =>
      `**${f.avatarName}'s Feedback (${f.sentiment}):**\n${f.feedback}`
    ).join('\n\n---\n\n');

    // Build synthesis prompt based on ad type
    let synthesisPrompt: string;

    if (isGoogleAd) {
      // Google Ads synthesis prompt
      synthesisPrompt = `You are a world-class Google Ads copywriter with 40 years of experience writing high-converting search ads.

Your assignment:
1. I will give you a Google Search Ad campaign we created
2. I will give you feedback from a panel of prospects about the ad
3. Consider all feedback and the original ad, then use your vast experience to write 3 NEW optimized Google Search Ad variations
4. Make sure when you write the ads you use ${brandVoice.brand_name}'s voice, style, and tone but do not overdo it. Tone: ${brandVoice.overall_tone}. Voice traits: ${brandVoice.personality_traits?.join(', ') || 'professional'}. Target audience: ${brandVoice.target_audience || 'general audience'}

CRITICAL GOOGLE ADS REQUIREMENTS:
- Each headline must be ≤30 characters (HARD LIMIT)
- Each description must be ≤90 characters (HARD LIMIT)
- Headlines should be clear, benefit-driven, and include keywords when possible
- Descriptions should have strong CTAs and value propositions

Format your response like an internal team email quoting key feedback, giving insights, plus 3 re-written ad variations.

Here is the original Google Ads campaign:
${originalAdCopy}

Here is the customer feedback from ${feedbacks.length} prospects:

${feedbackSections}

---

Return your response as valid JSON (no markdown, no code fences) with this structure:
{
  "internalMemo": "Your internal team email with insights and quoted feedback (2-3 paragraphs)",
  "keyInsights": [
    "Key insight 1 from the feedback",
    "Key insight 2 from the feedback",
    "Key insight 3 from the feedback"
  ],
  "optimizedVersions": [
    {
      "versionNumber": 1,
      "strategyFocus": "Credibility & Proof",
      "headlines": [
        "Headline 1 (≤30 chars)",
        "Headline 2 (≤30 chars)",
        "Headline 3 (≤30 chars)"
      ],
      "descriptions": [
        "Description 1 with CTA (≤90 chars)",
        "Description 2 with value prop (≤90 chars)"
      ]
    },
    {
      "versionNumber": 2,
      "strategyFocus": "Value & ROI",
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."]
    },
    {
      "versionNumber": 3,
      "strategyFocus": "Simplicity & Ease",
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."]
    }
  ]
}

REMEMBER: Enforce character limits strictly. Headlines ≤30 chars. Descriptions ≤90 chars.`;
    } else {
      // Meta Ads synthesis prompt (original)
      synthesisPrompt = `You are a world class copywriter. You have 40 years of experience writing direct response copy from direct mail to emails and everything in between.

Your assignment:
1. I will give you an ad we ran
2. I will give you the feedback from a panel of prospects about the ad
3. Consider all of the feedback and the original ad, then use your vast experience with copywriting to write 3 new optimized versions of the ad
4. Make sure when you write the ad copy you use ${brandVoice.brand_name}'s voice, style, and tone but do not overdo it. The tone should be: ${brandVoice.overall_tone}. Voice traits: ${brandVoice.personality_traits?.join(', ') || 'professional'}. Target audience: ${brandVoice.target_audience || 'general audience'}

Format your response like an internal team email quoting key pieces of feedback, giving your brief insights, plus the re-written versions.

Here is the original ad copy:
${originalAdCopy}

Here is the customer feedback from ${feedbacks.length} prospects:

${feedbackSections}

---

Return your response as valid JSON (no markdown, no code fences) with this structure:
{
  "internalMemo": "Your internal team email with insights and quoted feedback (2-3 paragraphs)",
  "keyInsights": [
    "Key insight 1 from the feedback",
    "Key insight 2 from the feedback",
    "Key insight 3 from the feedback"
  ],
  "optimizedVersions": [
    {
      "versionNumber": 1,
      "strategyFocus": "Brief description of this version's strategy",
      "headline": "Optimized headline",
      "bodyCopy": "Full optimized ad copy (600-900 words)"
    },
    {
      "versionNumber": 2,
      "strategyFocus": "...",
      "headline": "...",
      "bodyCopy": "..."
    },
    {
      "versionNumber": 3,
      "strategyFocus": "...",
      "headline": "...",
      "bodyCopy": "..."
    }
  ]
}`;
    }

    console.log('[Copywriter Synthesis] Calling Claude API...');

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: synthesisPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let synthesisText = content.text;

    // Strip markdown code fences if present
    synthesisText = synthesisText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    synthesisText = synthesisText.trim();

    const result = JSON.parse(synthesisText);

    console.log('[Copywriter Synthesis] ✅ Generated optimized versions');
    console.log('[Copywriter Synthesis] Versions:', result.optimizedVersions?.length);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Copywriter Synthesis] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to synthesize optimized versions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
