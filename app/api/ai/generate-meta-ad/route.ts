import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { landing_page } = await request.json();

    if (!landing_page) {
      return NextResponse.json(
        { error: 'landing_page is required' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20241022',
      max_tokens: 4096,
      system: "You're an experienced Facebook Ads specialist. Create 3 long-form ad variations (800-1200 words each) using PASTOR, Story-Bridge, and Social Proof formulas. Return as JSON.",
      messages: [
        {
          role: 'user',
          content: `Analyze this landing page and create 3 long-form ad copy variations: ${landing_page}

Please return a JSON object with this exact structure:
{
  "analysis": "Brief analysis of the landing page and target audience",
  "variations": [
    {
      "formula": "PASTOR",
      "hook": "Opening hook",
      "full_copy": "Complete 800-1200 word ad copy",
      "cta": "Call to action",
      "word_count": 950
    },
    {
      "formula": "Story-Bridge",
      "hook": "Opening hook",
      "full_copy": "Complete 800-1200 word ad copy",
      "cta": "Call to action",
      "word_count": 1050
    },
    {
      "formula": "Social Proof",
      "hook": "Opening hook",
      "full_copy": "Complete 800-1200 word ad copy",
      "cta": "Call to action",
      "word_count": 890
    }
  ]
}`,
        },
      ],
    });

    // Extract the JSON from Claude's response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

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
    console.error('Error generating Meta ad copy:', error);
    return NextResponse.json(
      { error: 'Failed to generate ad copy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
