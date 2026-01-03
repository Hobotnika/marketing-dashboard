import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { ads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Feedback {
  avatarName: string;
  feedback: string;
  sentiment: 'positive' | 'mixed' | 'negative';
}

interface OptimizedVersion {
  versionNumber: number;
  strategyFocus?: string;
  focus?: string;
  headline?: string;
  bodyCopy?: string;
  headlines?: string[];
  descriptions?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;

    console.log('[Prediction Engine] Starting for ad:', adId);

    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    // Get request body
    const { feedbacks, optimizedVersions } = await request.json();

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No avatar feedbacks provided' },
        { status: 400 }
      );
    }

    if (!optimizedVersions || optimizedVersions.length === 0) {
      return NextResponse.json(
        { error: 'No optimized versions provided' },
        { status: 400 }
      );
    }

    console.log('[Prediction Engine] Feedbacks:', feedbacks.length);
    console.log('[Prediction Engine] Versions to score:', optimizedVersions.length);

    // Check if this is a Google Ads campaign
    const ad = await db.query.ads.findFirst({
      where: eq(ads.id, adId)
    });

    const isGoogleAd = ad?.adType === 'google';
    console.log('[Prediction Engine] Ad type:', ad?.adType);

    // Build feedback sections
    const feedbackSections = feedbacks.map((f: Feedback) =>
      `**${f.avatarName}'s Feedback (${f.sentiment}):**\n${f.feedback}`
    ).join('\n\n---\n\n');

    // Build copywriter variations section based on ad type
    let variationsSections: string;

    if (isGoogleAd) {
      // Format for Google Ads (headlines + descriptions)
      variationsSections = optimizedVersions.map((v: OptimizedVersion, i: number) => {
        const headlines = v.headlines?.map((h, idx) => `  H${idx + 1}: ${h}`).join('\n') || '';
        const descriptions = v.descriptions?.map((d, idx) => `  D${idx + 1}: ${d}`).join('\n') || '';

        return `**Version ${v.versionNumber || i + 1} - ${v.strategyFocus || 'Optimized'}:**

Headlines:
${headlines}

Descriptions:
${descriptions}`;
      }).join('\n\n---\n\n');
    } else {
      // Format for Meta Ads (headline + bodyCopy)
      variationsSections = optimizedVersions.map((v: OptimizedVersion, i: number) =>
        `**Version ${v.versionNumber || i + 1} - ${v.strategyFocus || v.focus || 'Optimized'}:**\n\nHeadline: ${v.headline}\n\nBody Copy:\n${v.bodyCopy}`
      ).join('\n\n---\n\n');
    }

    // Build prediction prompt based on ad type
    let predictionPrompt: string;

    if (isGoogleAd) {
      // Google Ads prediction prompt
      predictionPrompt = `You are an expert data analyst specializing in Google Ads performance prediction. You have decades of experience using data to predict ad success.

When I submit Google Search Ad variations to you, use your entire known knowledge of Google Ads best practices, Quality Score factors, and CTR optimization to assign a score to each ad.

This score is called the Success Probability Score and it judges each ad based on customer feedback and known Google Ads best practices.

Score them 0% through 100%:
0 - 10% likely will not work
11 - 29% low chance of working
30 - 49% moderate chance of working
50 - 69% good chance of working
70%+ high chance of working

GOOGLE ADS SCORING FACTORS:
- Headline clarity and keyword relevance
- Description value proposition and CTA strength
- Character limit optimization (30 chars for headlines, 90 for descriptions)
- Search intent alignment
- Expected CTR and Quality Score impact

Here is the customers feedback from ${feedbacks.length} prospects:

${feedbackSections}

Here are the new Google Ads variations:

${variationsSections}

---

Return your response as valid JSON (no markdown, no code fences) with this structure:
{
  "scores": [
    {
      "versionNumber": 1,
      "score": 75,
      "category": "high chance of working",
      "briefReason": "One sentence why this score"
    },
    {
      "versionNumber": 2,
      "score": 65,
      "category": "good chance of working",
      "briefReason": "One sentence why this score"
    },
    {
      "versionNumber": 3,
      "score": 82,
      "category": "high chance of working",
      "briefReason": "One sentence why this score"
    }
  ],
  "winner": {
    "versionNumber": 3,
    "score": 82,
    "headlines": ["Winning headline 1", "Winning headline 2", "Winning headline 3"],
    "descriptions": ["Winning description 1", "Winning description 2"],
    "whyItWins": "Brief explanation of why this version scored highest"
  }
}`;
    } else {
      // Meta Ads prediction prompt (original)
      predictionPrompt = `You are an expert data analyst. You have decades of experience using data to create predictions.

When I submit ad creative to you I want you to use your entire known knowledge of advertising and copywriting best practices to assign a score to each ad.

This score is called the Success Probability Score and it judges each ad based on the customers feedback and known best practices to create a probability of success score.

Don't give me a long explanation, just give me the Success Probability Score for each of the ads. Score them 0% through 100%.

0 - 10% likely will not work
11 - 29% low chance of working
30 - 49% moderate chance of working
50 - 69% good chance of working
70%+ high chance of working

Display the ad variation that had the highest success probability score.

Here is the customers feedback from ${feedbacks.length} prospects:

${feedbackSections}

Here are the new ad copy variations:

${variationsSections}

Display the full winning ad variation below your scores in an easy to copy/paste format.

---

Return your response as valid JSON (no markdown, no code fences) with this structure:
{
  "scores": [
    {
      "versionNumber": 1,
      "score": 75,
      "category": "high chance of working",
      "briefReason": "One sentence why this score"
    },
    {
      "versionNumber": 2,
      "score": 65,
      "category": "good chance of working",
      "briefReason": "One sentence why this score"
    },
    {
      "versionNumber": 3,
      "score": 82,
      "category": "high chance of working",
      "briefReason": "One sentence why this score"
    }
  ],
  "winner": {
    "versionNumber": 3,
    "score": 82,
    "headline": "The winning headline",
    "bodyCopy": "Full winning ad copy here",
    "whyItWins": "Brief explanation of why this version scored highest"
  }
}`;
    }

    console.log('[Prediction Engine] Calling Claude API...');

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.3, // Lower temp for more consistent scoring
      messages: [
        {
          role: 'user',
          content: predictionPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let predictionText = content.text;

    // Strip markdown code fences if present
    predictionText = predictionText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    predictionText = predictionText.trim();

    const result = JSON.parse(predictionText);

    console.log('[Prediction Engine] ✅ Scored versions');
    console.log('[Prediction Engine] Winner: Version', result.winner?.versionNumber, 'with', result.winner?.score + '%');

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Prediction Engine] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to predict winning version',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
