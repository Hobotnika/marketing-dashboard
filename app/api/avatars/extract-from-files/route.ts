import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const setName = formData.get('setName') as string;
    const niche = formData.get('niche') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`[Avatar Extract] Processing ${files.length} files for niche: ${niche}`);

    // Convert files to base64 for Claude
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');

        const mediaType = file.type === 'application/pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType as 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: base64
          }
        };
      })
    );

    // Extract personas using Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            ...fileContents,
            {
              type: 'text',
              text: `Extract all customer personas from these documents.

For each persona found, extract:
1. Name (full name of the persona)
2. Demographics:
   - Age (number)
   - Gender
   - Location (city, state)
   - Income (range as string)

3. Psychographics:
   - Struggles (array of detailed struggles)
   - Goals (array of specific goals)
   - Fears (array of fears)
   - Frustrations (array of frustrations)

4. Buying Behavior (paragraph)
5. Communication Style (paragraph)
6. Prompt Persona (the full detailed background paragraph - most important! This should be 300+ words combining all the persona details into a narrative form)

If a field is not mentioned in the document, use reasonable defaults or omit it.

Return ONLY valid JSON (no markdown, no code fences):
{
  "avatars": [
    {
      "name": "Jennifer Walsh",
      "demographics": {
        "age": 42,
        "gender": "Female",
        "location": "Denver, Colorado",
        "income": "$65,000 - $85,000 annually"
      },
      "psychographics": {
        "struggles": ["Detailed struggle 1", "Detailed struggle 2"],
        "goals": ["Specific goal 1", "Specific goal 2"],
        "fears": ["Fear 1", "Fear 2", "Fear 3"],
        "frustrations": ["Frustration 1", "Frustration 2"]
      },
      "buying_behavior": "Full paragraph about how they make purchasing decisions...",
      "communication_style": "Full paragraph about their preferred communication style...",
      "prompt_persona": "Full detailed background paragraph (300+ words) that combines all the information about this persona into a narrative form. This should include their background story, current situation, specific struggles they face, tools and platforms they use, buying behavior, skepticism points, and what they're actively looking for. Make it rich and detailed enough to be used for AI roleplay when rating ads."
    }
  ]
}

CRITICAL: Extract ALL personas found in the documents. Each document might contain multiple personas.`
            }
          ]
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let extractedText = content.text;

    // Strip markdown code fences if present
    extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    extractedText = extractedText.trim();

    const parsed = JSON.parse(extractedText);

    console.log(`[Avatar Extract] Successfully extracted ${parsed.avatars.length} personas`);

    return NextResponse.json({
      success: true,
      avatars: parsed.avatars,
      count: parsed.avatars.length
    });

  } catch (error) {
    console.error('[Avatar Extract] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to extract personas from files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
