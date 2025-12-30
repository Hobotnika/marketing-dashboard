import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Avatar } from '@/types/avatar';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/avatars/generate
 * Generate 13 diverse customer personas for a given niche using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { niche, setName, description } = await request.json();

    if (!niche || niche.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Auto-generate setName from niche if not provided
    const finalSetName = setName && setName.trim()
      ? setName.trim()
      : niche
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

    const prompt = `You are a world-class media planner with decades of experience developing customer personas.

Research the "${niche}" industry and create 13 complete, diverse customer personas.

Requirements:
- Mix of male and female (roughly 50/50)
- Age range: 25-65 (varied)
- Different income levels ($30k-$200k+)
- Different experience levels (beginner to expert)
- Different motivations and pain points
- Realistic names (diverse backgrounds)

For each persona, provide:

1. Name (realistic, culturally diverse)
2. Demographics:
   - Age (specific number)
   - Gender
   - Location type (Urban/Suburban/Rural)
   - Income range (e.g., "$50-75k")

3. Psychographics:
   - Top 3 struggles/pain points (specific to ${niche})
   - Top 3 goals/desires (what they want to achieve)
   - Top 3 fears (what keeps them up at night)
   - Top 3 frustrations (day-to-day annoyances)

4. Buying Behavior (1-2 sentences about how they make purchases)
5. Communication Style (how they prefer to be spoken to)

6. Prompt Persona (2-3 paragraphs describing this person in detail for use in AI prompts - include their background, current situation, challenges, and what they're looking for in solutions)

Base your personas on research from:
- Online reviews (Amazon, Yelp, G2, Trustpilot)
- Reddit discussions (r/entrepreneur, r/ecommerce, etc.)
- YouTube comments on industry videos
- Social media (Twitter, LinkedIn, Facebook groups)
- Industry forums and communities

Make each persona unique, realistic, and distinct. Avoid stereotypes.

Return ONLY valid JSON (no markdown, no code fences):
{
  "avatars": [
    {
      "name": "Sarah Chen",
      "demographics": {
        "age": 35,
        "gender": "Female",
        "location": "Urban",
        "income": "$50-75k"
      },
      "psychographics": {
        "struggles": ["Cash flow management", "Scaling beyond $100k/year", "Finding reliable suppliers"],
        "goals": ["Reach $1M revenue", "Hire first employee", "Automate operations"],
        "fears": ["Going bankrupt", "Wasting ad spend", "Losing to Amazon"],
        "frustrations": ["Unreliable suppliers", "Complex tax regulations", "Time-consuming customer service"]
      },
      "buying_behavior": "Sarah is cautious with spending and researches extensively before making purchases. She reads multiple reviews and prefers solutions with free trials.",
      "communication_style": "Professional but approachable. Appreciates data-driven insights and case studies.",
      "prompt_persona": "Sarah is a 35-year-old female e-commerce store owner who started her online boutique 3 years ago. She currently makes $75k annually but is struggling to scale past $100k despite working 60+ hours per week. Her biggest challenge is cash flow management - she often has money tied up in inventory while waiting for sales. Sarah is tech-savvy enough to run her own website but feels overwhelmed by the constant need to learn new marketing strategies. She's terrified of going bankrupt like her friend did last year, which makes her extremely cautious about ad spend. What she really needs is a reliable system that can help her automate customer acquisition without breaking the bank."
    }
  ]
}

Generate exactly 13 unique personas.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 1, // Higher temperature for more diversity
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    let responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Remove markdown code fences if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');

    // Parse JSON
    let result: { avatars: Avatar[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI response',
          raw: responseText.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Validate we got 13 avatars
    if (!result.avatars || result.avatars.length !== 13) {
      return NextResponse.json(
        {
          success: false,
          error: `Expected 13 avatars, got ${result.avatars?.length || 0}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      setName: finalSetName,
      niche,
      description: description || null,
      avatars: result.avatars,
      message: 'Generated 13 avatars successfully',
    });
  } catch (error) {
    console.error('Error generating avatars:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate avatars',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
