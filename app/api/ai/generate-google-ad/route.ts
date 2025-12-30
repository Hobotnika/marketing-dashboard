import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { landing_page, primary_keyword, secondary_keywords = [], match_type = 'broad' } = await request.json();

    if (!landing_page || !primary_keyword) {
      return NextResponse.json(
        { error: 'landing_page and primary_keyword are required' },
        { status: 400 }
      );
    }

    const secondaryKeywordsText = secondary_keywords.length > 0
      ? secondary_keywords.join(', ')
      : 'None';

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: `You're an expert Google Ads specialist creating a complete ad campaign optimized for 10/10 Quality Score.

Generate a COMPLETE Google Search Ad campaign with all components.`,
      messages: [
        {
          role: 'user',
          content: `Landing page: ${landing_page}
Primary keyword: ${primary_keyword}
Secondary keywords: ${secondaryKeywordsText}
Match type: ${match_type}

Create a COMPLETE Google Search Ad campaign optimized for maximum Quality Score and ad real estate.

## 1. RESPONSIVE SEARCH AD

### Headlines (15 total - 30 char max each)
Create across 3 themes (5 each):

**Price-Focused (5):**
- Include primary keyword + offer/discount
- Examples: "${primary_keyword} - 50% Off", "Save on ${primary_keyword} Now"

**Social Proof (5):**
- Include primary keyword + credibility
- Examples: "10K+ Love Our ${primary_keyword}", "5-Star ${primary_keyword}"

**Authority (5):**
- Include primary keyword + expertise
- Examples: "#1 ${primary_keyword} Solution", "Award-Winning ${primary_keyword}"

### Descriptions (5 total - 90 char max each)
- Start with benefit or problem solution
- Include primary keyword naturally
- Include strong CTA
- Use power words: Free, Proven, Guaranteed, Results, Instant
- Match landing page messaging

## 2. SITELINK EXTENSIONS (4-6 links)

Create 4-6 sitelinks (25 char max per title, 35 char max per description):

Requirements:
- Link text: 25 characters maximum
- Description line 1: 35 characters maximum
- Description line 2: 35 characters maximum
- Each links to different page/feature
- Include keywords where natural
- Action-oriented text

Examples:
- "Free Trial" → "Start your 14-day free trial" + "No credit card required"
- "Pricing" → "Transparent pricing plans" + "Starting at $49/month"
- "Features" → "See all powerful features" + "AI-powered automation"

## 3. CALLOUT EXTENSIONS (6-8 callouts)

Create 6-8 callouts (25 char max each):

Requirements:
- 25 characters maximum each
- Short, punchy value props
- No punctuation or complete sentences
- Focus on benefits/features/guarantees

Categories:
- Trust signals: "24/7 Support", "Money-Back Guarantee"
- Speed: "Setup in 5 Minutes", "Instant Access"
- Social proof: "10,000+ Customers", "4.9-Star Rating"
- Differentiators: "AI-Powered", "No Contracts"

## 4. STRUCTURED SNIPPET EXTENSIONS (2-3 snippets)

Create 2-3 structured snippets:

Available Headers: Amenities, Brands, Courses, Degree Programs, Destinations, Featured Hotels, Insurance Coverage, Models, Neighborhoods, Service Catalog, Shows, Styles, Types

Requirements:
- Header: Select from list above
- Values: 3-10 items per header (25 char max each)
- Must be parallel in structure

Example - Service Catalog:
Values: ["Email Marketing", "Social Media Ads", "SEO Optimization", "Content Creation", "Analytics Tracking"]

## OUTPUT FORMAT (JSON)

Return ONLY valid JSON with this exact structure:

{
  "analysis": "Brief landing page analysis and keyword strategy (2-3 sentences)",

  "keyword_integration": {
    "primary_keyword": "${primary_keyword}",
    "times_in_headlines": 8,
    "times_in_descriptions": 3,
    "times_in_sitelinks": 2,
    "variations_used": ["${primary_keyword}", "variant1", "variant2"]
  },

  "quality_score_prediction": {
    "expected_ctr": "Above average",
    "ad_relevance": "Above average",
    "landing_page_experience": "Above average",
    "predicted_score": "9-10/10",
    "reasoning": "High keyword integration, comprehensive extensions, strong CTAs"
  },

  "responsive_search_ad": {
    "headlines": {
      "price_focused": [
        {"text": "headline text", "char_count": 20, "keyword_included": true},
        {"text": "headline text", "char_count": 22, "keyword_included": true},
        {"text": "headline text", "char_count": 25, "keyword_included": true},
        {"text": "headline text", "char_count": 24, "keyword_included": true},
        {"text": "headline text", "char_count": 23, "keyword_included": true}
      ],
      "social_proof": [
        {"text": "headline text", "char_count": 21, "keyword_included": true},
        {"text": "headline text", "char_count": 24, "keyword_included": true},
        {"text": "headline text", "char_count": 26, "keyword_included": true},
        {"text": "headline text", "char_count": 22, "keyword_included": true},
        {"text": "headline text", "char_count": 25, "keyword_included": true}
      ],
      "authority": [
        {"text": "headline text", "char_count": 24, "keyword_included": true},
        {"text": "headline text", "char_count": 27, "keyword_included": true},
        {"text": "headline text", "char_count": 23, "keyword_included": true},
        {"text": "headline text", "char_count": 26, "keyword_included": true},
        {"text": "headline text", "char_count": 25, "keyword_included": true}
      ]
    },
    "descriptions": [
      {"text": "description text", "char_count": 88, "keyword_included": true, "has_cta": true},
      {"text": "description text", "char_count": 87, "keyword_included": true, "has_cta": true},
      {"text": "description text", "char_count": 89, "keyword_included": true, "has_cta": true},
      {"text": "description text", "char_count": 86, "keyword_included": false, "has_cta": true},
      {"text": "description text", "char_count": 90, "keyword_included": true, "has_cta": true}
    ]
  },

  "sitelinks": [
    {
      "link_text": "text",
      "char_count": 16,
      "description_1": "text",
      "description_1_chars": 28,
      "description_2": "text",
      "description_2_chars": 27,
      "suggested_url": "/trial"
    }
  ],

  "callouts": [
    {"text": "callout text", "char_count": 17}
  ],

  "structured_snippets": [
    {
      "header": "Service Catalog",
      "values": [
        {"text": "value", "char_count": 15}
      ]
    }
  ],

  "ad_preview_score": {
    "total_ad_real_estate": "Maximum",
    "extensions_included": 3,
    "estimated_ctr_boost": "+40-60%",
    "competitive_advantage": "High - using all available extensions"
  }
}

IMPORTANT:
- ALL headlines must be 30 characters or less
- ALL descriptions must be 90 characters or less
- ALL sitelink titles must be 25 characters or less
- ALL sitelink descriptions must be 35 characters or less
- ALL callouts must be 25 characters or less
- ALL structured snippet values must be 25 characters or less
- Return ONLY the JSON object, no markdown code fences
- Include character counts for validation`,
        },
      ],
    });

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
