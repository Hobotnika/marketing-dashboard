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

    const prompt = `You are a world-class media planner with decades of experience developing customer personas through extensive interviews, surveys, and behavioral research.

TASK: Research the "${niche}" industry and create 12-15 ultra-realistic customer personas with exceptional depth.

CRITICAL: These must feel like REAL PEOPLE you could interview, not generic marketing descriptions.

PERSONA COUNT STRATEGY:
Analyze the diversity within "${niche}":
- Simple niche (narrow demographics/psychographics) → 12 personas
- Moderate diversity (some variation in segments) → 13-14 personas
- Complex niche (high variation across multiple dimensions) → 15 personas

DEPTH REQUIREMENTS FOR EACH PERSONA:

1. DEMOGRAPHIC PROFILE (Hyper-Specific):
   - Age: Exact number (not range)
   - Gender: Appropriate for industry
   - Location: Specific city/region
   - Education: Specific degrees, certifications
   - Income: Exact range (e.g., "$65,000 - $85,000 annually")
   - Marital Status: Include if relevant
   - Generation: Baby Boomer, Gen X, Millennial, Gen Z

2. PROFESSIONAL BACKGROUND (Tell Their Story):
   - How they got into this industry
   - Current situation with specific metrics
   - Team size, revenue, years in business
   - Day-to-day operations
   - Recent challenges or transitions

3. PSYCHOGRAPHICS (Deep & Emotional):
   Struggles (7+ specific items with details)
   Goals (9 items: 5 primary, 4 secondary with numbers)
   Fears (3+ specific fears with context)
   Frustrations (4+ emotional frustrations)

4. BUYING BEHAVIOR (1-2 sentences about purchase decisions)

5. COMMUNICATION STYLE (How they prefer to be communicated with)

6. PROMPT PERSONA (CRITICAL - 3-4 Paragraphs, 300+ Words):
   This is what will be used in AI prompts for ad rating.

   Must include:
   - Full background story (how they got here)
   - Current situation with specific struggles
   - What they're actively looking for RIGHT NOW
   - How they make decisions
   - What they're skeptical about
   - Communication preferences
   - Specific objections or concerns

   Example quality:
   "Jennifer is a 42-year-old certified life coach who launched 'Authentic Path Coaching' four years ago after her own career transition from corporate HR. She works with 15-20 clients monthly through one-on-one sessions and group programs from her Denver home office. Currently earning $75,000 annually, she's hit an income plateau and started Facebook/Instagram ads eight months ago with a $800 monthly budget. Her biggest frustration is attracting tire-kickers who can't afford her services, and her sales process takes 2-4 weeks from initial contact to enrollment, making it hard to track ROI. She's tried hiring two marketing agencies but felt they didn't understand her niche. She's tech-savvy with Zoom, Calendly, and Mailchimp but gets overwhelmed by ad platforms and funnel builders. When considering new tools, she needs clear ROI within 30 days because every dollar counts as a single mother. She prefers straightforward, data-driven communication without hype, and wants case studies from similar boutique coaches, not Fortune 500 examples."

RESEARCH SOURCES:
Base personas on real insights from:
- Reddit: r/entrepreneur, r/smallbusiness, niche-specific subreddits
- Review sites: G2, Trustpilot, Capterra (B2B), Amazon/Yelp (B2C)
- YouTube: Comments on "how-to" and "day in the life" videos
- LinkedIn: Industry group discussions
- Facebook Groups: Industry-specific communities
- Quora: Questions about challenges
- Industry blogs: Comment sections

DIVERSITY CHECKLIST:
✓ Age range: 25-65 (realistic distribution)
✓ Gender: Realistic for industry
✓ Income: $30k to $200k+ spread
✓ Experience: Beginners, intermediate, experts
✓ Geography: Urban, suburban, rural
✓ Business stage: Starting, established, scaling
✓ Risk tolerance: Conservative to aggressive
✓ Tech savviness: Luddites to early adopters
✓ Budget: Bootstrapped to well-funded
✓ Personality: Analytical, creative, relationship-driven

Return ONLY valid JSON (no markdown, no code fences):
{
  "avatars": [
    {
      "name": "Full Name",
      "demographics": {
        "age": 42,
        "gender": "Female",
        "location": "Denver, Colorado",
        "income": "$65,000 - $85,000 annually"
      },
      "psychographics": {
        "struggles": [
          "Lead Quality Issues: Attracting tire-kickers who can't afford coaching services",
          "Sales Conversion Timeline: 2-4 week sales process makes ROI tracking difficult",
          "Marketing Agency Disappointments: Two agencies didn't understand boutique coaching niche",
          "Income Plateau: Stuck at $75k annually despite working 60+ hours per week",
          "Ad Platform Overwhelm: Facebook Ads Manager complexity causes decision paralysis",
          "Inconsistent Lead Flow: Some months 5 quality leads, other months zero",
          "Limited Marketing Budget: Every dollar counts as single mother, can't afford mistakes"
        ],
        "goals": [
          "Scale Income: Increase from $75,000 to $150,000 annually within 2 years",
          "Reduce Sales Cycle: Cut enrollment timeline from 2-4 weeks to under 1 week",
          "Improve Lead Quality: Attract clients who can invest $3,000-$5,000 in coaching",
          "Build Predictable Pipeline: 10-15 qualified leads monthly instead of feast-or-famine",
          "Master Facebook Ads: Feel confident running campaigns without agency help",
          "Launch Group Program: Add scalable revenue stream beyond 1-on-1 coaching",
          "Automate Follow-Up: Implement email sequences that nurture leads automatically",
          "Increase Pricing: Raise rates from $2,500 to $5,000 per client without losing conversions",
          "Work-Life Balance: Reduce work hours from 60 to 40 per week while maintaining income"
        ],
        "fears": [
          "Wasting Limited Budget: Can't afford to lose money on ineffective advertising",
          "Making Wrong Investment: Fear of hiring another agency that doesn't deliver results",
          "Income Instability: Worried about inconsistent monthly revenue affecting daughter's needs"
        ],
        "frustrations": [
          "Comparison Trap: Seeing other coaches post about six-figure launches while she struggles",
          "Tech Tool Overload: New marketing tools announced weekly, don't know which to choose",
          "Impostor Syndrome: Great at coaching but feels like terrible marketer",
          "Time Scarcity: Spending more time on marketing than actual coaching work"
        ]
      },
      "buying_behavior": "Jennifer researches extensively before purchases, reading 5-10 reviews minimum. Prefers 30-day money-back guarantees and needs to see clear ROI within first month. Price-sensitive due to single income but will invest if convinced of value.",
      "communication_style": "Prefers straightforward, data-driven communication without hype. Appreciates case studies from similar boutique coaches, not Fortune 500 examples. Values transparency about what's realistic to expect.",
      "prompt_persona": "Jennifer is a 42-year-old certified life coach who launched 'Authentic Path Coaching' four years ago after her own career transition from corporate HR. She works with 15-20 clients monthly through one-on-one sessions and group programs from her Denver home office. Currently earning $75,000 annually, she's hit an income plateau and started Facebook/Instagram ads eight months ago with a $800 monthly budget. Her biggest frustration is attracting tire-kickers who can't afford her services, and her sales process takes 2-4 weeks from initial contact to enrollment, making it hard to track ROI. She's tried hiring two marketing agencies but felt they didn't understand her niche. She's tech-savvy with Zoom, Calendly, and Mailchimp but gets overwhelmed by ad platforms and funnel builders. When considering new tools, she needs clear ROI within 30 days because every dollar counts as a single mother. She prefers straightforward, data-driven communication without hype, and wants case studies from similar boutique coaches, not Fortune 500 examples. She's skeptical of 'get rich quick' marketing promises after being burned twice by agencies that over-promised. What she really needs is a predictable system to generate 10-15 qualified leads monthly who can actually afford her $2,500-5,000 coaching packages, with a sales process that doesn't require 2-4 weeks of back-and-forth before enrollment. She's willing to invest in the right solution but needs proof it works for solo coaches like her, not just big companies with unlimited budgets."
    }
  ]
}

Generate 12-15 ultra-realistic personas for: "${niche}"

QUALITY STANDARDS:
- Each persona must be so detailed you could roleplay as them
- Include specific quotes they actually say
- Reference real tools and platforms by name
- Use exact numbers and metrics throughout
- Prompt persona must be 300+ words of rich detail
- Make each person feel completely unique and believable`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 32000, // Increased for much more detailed personas (12-15 avatars x ~2000 tokens each)
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

    // Validate we got 12-15 avatars
    const avatarCount = result.avatars?.length || 0;
    if (!result.avatars || avatarCount < 12 || avatarCount > 15) {
      return NextResponse.json(
        {
          success: false,
          error: `Expected 12-15 avatars, got ${avatarCount}`,
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
      message: `Generated ${avatarCount} ultra-detailed avatars successfully`,
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
