import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local BEFORE importing db
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { db } from './index';
import { aiPrompts } from './schema';

// Default prompts - organizationId is NULL for system-wide defaults

const defaultPrompts = [
  // ===== GOOGLE ADS PROMPTS =====
  {
    name: 'Google Ads - Default RSA + Extensions',
    description: 'Complete Google Search Ad campaign with RSA (15 headlines in 3 themes) + all extensions (Sitelinks, Callouts, Structured Snippets). Optimized for Quality Score 9-10/10.',
    category: 'google_ads' as const,
    promptType: 'default' as const,
    promptText: `You're an expert Google Ads specialist creating a complete ad campaign optimized for 10/10 Quality Score.

Generate a COMPLETE Google Search Ad campaign with all components.

## User Input Variables
You will receive:
- Landing page: {{landing_page}}
- Primary keyword: {{primary_keyword}}
- Secondary keywords: {{secondary_keywords}}
- Match type: {{match_type}}

## Instructions

Create a COMPLETE Google Search Ad campaign optimized for maximum Quality Score and ad real estate.

## 1. RESPONSIVE SEARCH AD

### Headlines (15 total - 30 char max each)
Create across 3 themes (5 each):

**Price-Focused (5):**
- Include primary keyword + offer/discount
- Examples: "{{primary_keyword}} - 50% Off", "Save on {{primary_keyword}} Now"

**Social Proof (5):**
- Include primary keyword + credibility
- Examples: "10K+ Love Our {{primary_keyword}}", "5-Star {{primary_keyword}}"

**Authority (5):**
- Include primary keyword + expertise
- Examples: "#1 {{primary_keyword}} Solution", "Award-Winning {{primary_keyword}}"

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
    "primary_keyword": "{{primary_keyword}}",
    "times_in_headlines": 8,
    "times_in_descriptions": 3,
    "times_in_sitelinks": 2,
    "variations_used": ["{{primary_keyword}}", "variant1", "variant2"]
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
    isActive: true,
    isDefault: true,
    organizationId: null, // System-wide default
  },

  {
    name: 'Google Ads - Local Business',
    description: 'Google Search Ads optimized for local businesses with location-based extensions and local service focus.',
    category: 'google_ads' as const,
    promptType: 'local_business' as const,
    promptText: `You're an expert Google Ads specialist specializing in LOCAL BUSINESS campaigns.

Generate a COMPLETE Google Search Ad campaign optimized for local search and local intent.

IMPORTANT: Focus on local keywords, location-based extensions, and local service messaging.

[Use the same structure as default Google Ads prompt, but with local business focus]

Key differences:
- Headlines: Include location/area name where natural
- Callouts: Emphasize "Local", "Same-Day Service", "Serving [Area] Since [Year]"
- Sitelinks: Include "Directions", "Service Area", "Local Reviews"
- Structured Snippets: Focus on "Service Catalog" with local services
- CTAs: "Call Now", "Get Directions", "Schedule Visit"`,
    isActive: true,
    isDefault: false,
    organizationId: null,
  },

  {
    name: 'Google Ads - E-commerce',
    description: 'Google Shopping + Search Ads optimized for e-commerce with product-focused extensions and promotional messaging.',
    category: 'google_ads' as const,
    promptType: 'ecommerce' as const,
    promptText: `You're an expert Google Ads specialist specializing in E-COMMERCE campaigns.

Generate a COMPLETE Google Search Ad campaign optimized for product sales and conversions.

IMPORTANT: Focus on product benefits, pricing, shipping, and urgency.

[Use the same structure as default Google Ads prompt, but with e-commerce focus]

Key differences:
- Price-Focused Headlines: Emphasize discounts, free shipping, limited offers
- Callouts: "Free Shipping", "30-Day Returns", "Price Match Guarantee", "Fast Delivery"
- Sitelinks: "Shop Now", "Current Deals", "Shipping Info", "Returns Policy"
- Structured Snippets: Use "Brands", "Types", "Styles" headers
- CTAs: "Shop Now", "Order Today", "Browse Collection"`,
    isActive: true,
    isDefault: false,
    organizationId: null,
  },

  {
    name: 'Google Ads - SaaS',
    description: 'Google Search Ads optimized for SaaS products with trial-focused extensions and feature highlighting.',
    category: 'google_ads' as const,
    promptType: 'saas' as const,
    promptText: `You're an expert Google Ads specialist specializing in SAAS product campaigns.

Generate a COMPLETE Google Search Ad campaign optimized for trial signups and demos.

IMPORTANT: Focus on features, integrations, free trials, and business benefits.

[Use the same structure as default Google Ads prompt, but with SaaS focus]

Key differences:
- Headlines: Emphasize "Free Trial", "No Credit Card", "Setup in Minutes"
- Callouts: "14-Day Free Trial", "No Credit Card", "Cancel Anytime", "24/7 Support"
- Sitelinks: "Start Free Trial", "View Demo", "Pricing Plans", "Integrations", "Case Studies"
- Structured Snippets: Use "Features", "Integrations" headers
- CTAs: "Start Free Trial", "See Demo", "Try Free"`,
    isActive: true,
    isDefault: false,
    organizationId: null,
  },

  // ===== META ADS PROMPTS =====
  {
    name: 'Meta Ads - Default Long-Form',
    description: 'Long-form Facebook/Instagram ad copy (600-900 words) using PASTOR, Story-Bridge, and Social Proof formulas.',
    category: 'meta_ads' as const,
    promptType: 'default' as const,
    promptText: `You're an experienced Facebook Ads specialist. Create 3 long-form ad variations (600-900 words each) using PASTOR, Story-Bridge, and Social Proof formulas. Return as JSON.

## User Input
You will receive a landing page URL: {{landing_page}}

## Instructions

Analyze the landing page and create 3 long-form ad copy variations.

Please return a JSON object with this exact structure:
{
  "analysis": "Brief analysis of the landing page and target audience",
  "variations": [
    {
      "formula": "PASTOR",
      "hook": "Opening hook",
      "full_copy": "Complete 600-900 word ad copy",
      "cta": "Call to action",
      "word_count": 750
    },
    {
      "formula": "Story-Bridge",
      "hook": "Opening hook",
      "full_copy": "Complete 600-900 word ad copy",
      "cta": "Call to action",
      "word_count": 850
    },
    {
      "formula": "Social Proof",
      "hook": "Opening hook",
      "full_copy": "Complete 600-900 word ad copy",
      "cta": "Call to action",
      "word_count": 700
    }
  ]
}

IMPORTANT:
- Each variation should be 600-900 words
- Use the specified copywriting formula
- Include engaging hooks
- Strong calls to action
- Return ONLY the JSON object, no markdown code fences`,
    isActive: true,
    isDefault: true,
    organizationId: null,
  },
];

export async function seedPrompts() {
  console.log('🌱 Seeding default AI prompts...');

  try {
    for (const prompt of defaultPrompts) {
      await db.insert(aiPrompts).values(prompt);
      console.log(`✅ Created prompt: ${prompt.name}`);
    }

    console.log(`\n✨ Successfully seeded ${defaultPrompts.length} default prompts!`);
  } catch (error) {
    console.error('❌ Error seeding prompts:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedPrompts()
    .then(() => {
      console.log('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}
