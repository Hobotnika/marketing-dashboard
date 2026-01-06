import { NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { aiPromptTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/ai/prompts
 * Get all active prompts for a specific section
 */
export async function GET(request: Request) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const sectionName = searchParams.get('section');

    if (!sectionName) {
      return NextResponse.json(
        { error: 'Section name required' },
        { status: 400 }
      );
    }

    // Get all active prompts for this section and organization
    const prompts = await db.query.aiPromptTemplates.findMany({
      where: and(
        eq(aiPromptTemplates.organizationId, context.organizationId),
        eq(aiPromptTemplates.sectionName, sectionName),
        eq(aiPromptTemplates.isActive, true)
      ),
      orderBy: (prompts, { desc }) => [desc(prompts.createdAt)],
    });

    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/prompts
 * Create or update a prompt template
 */
export async function POST(request: Request) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      id,
      sectionName,
      promptName,
      description,
      systemPrompt,
      userPromptTemplate,
      dataInputs,
      triggers,
    } = body;

    // Validate required fields
    if (!sectionName || !promptName || !systemPrompt || !userPromptTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure dataInputs and triggers are stored as JSON strings
    const dataInputsStr = typeof dataInputs === 'string'
      ? dataInputs
      : JSON.stringify(dataInputs || []);

    const triggersStr = typeof triggers === 'string'
      ? triggers
      : JSON.stringify(triggers || ['manual']);

    if (id) {
      // Update existing prompt
      const updated = await db
        .update(aiPromptTemplates)
        .set({
          promptName,
          description,
          systemPrompt,
          userPromptTemplate,
          dataInputs: dataInputsStr,
          triggers: triggersStr,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(aiPromptTemplates.id, id),
            eq(aiPromptTemplates.organizationId, context.organizationId)
          )
        )
        .returning();

      if (!updated.length) {
        return NextResponse.json(
          { error: 'Prompt not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, prompt: updated[0] });
    } else {
      // Create new prompt
      const created = await db
        .insert(aiPromptTemplates)
        .values({
          organizationId: context.organizationId,
          sectionName,
          promptName,
          description,
          systemPrompt,
          userPromptTemplate,
          dataInputs: dataInputsStr,
          triggers: triggersStr,
          createdBy: context.userId,
        })
        .returning();

      return NextResponse.json({ success: true, prompt: created[0] });
    }
  } catch (error) {
    console.error('Error saving prompt:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}
