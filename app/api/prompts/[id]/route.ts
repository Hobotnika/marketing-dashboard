import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPrompts } from '@/lib/db/schema';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { eq, and, isNull, or } from 'drizzle-orm';

// GET /api/prompts/[id] - Get single prompt
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = await params;

    const prompt = await db.query.aiPrompts.findFirst({
      where: and(
        eq(aiPrompts.id, id),
        or(
          eq(aiPrompts.workspaceId, context.workspaceId),
          isNull(aiPrompts.workspaceId) // System prompts
        )
      ),
    });

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prompt,
    });
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prompt',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts/[id] - Update prompt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = await params;
    const body = await request.json();

    // Check if prompt exists and belongs to this organization
    const existingPrompt = await db.query.aiPrompts.findFirst({
      where: and(
        eq(aiPrompts.id, id),
        eq(aiPrompts.workspaceId, context.workspaceId)
      ),
    });

    if (!existingPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt not found or you do not have permission to edit it',
        },
        { status: 404 }
      );
    }

    // Cannot edit system prompts (organizationId = NULL)
    if (existingPrompt.workspaceId === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot edit system prompts',
        },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      promptType,
      promptText,
      isDefault,
      isActive,
    } = body;

    // If setting as default, unset previous default for this category
    if (isDefault && !existingPrompt.isDefault) {
      await db
        .update(aiPrompts)
        .set({ isDefault: false })
        .where(
          and(
            eq(aiPrompts.workspaceId, context.workspaceId),
            eq(aiPrompts.category, existingPrompt.category),
            eq(aiPrompts.isDefault, true)
          )
        );
    }

    // Build update object (only include provided fields)
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (promptType !== undefined) updates.promptType = promptType;
    if (promptText !== undefined) updates.promptText = promptText;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    if (isActive !== undefined) updates.isActive = isActive;

    // Update the prompt
    const [updatedPrompt] = await db
      .update(aiPrompts)
      .set(updates)
      .where(eq(aiPrompts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedPrompt,
      message: 'Prompt updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update prompt',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Delete prompt
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await protectTenantRoute();
    const { id } = await params;

    // Check if prompt exists and belongs to this organization
    const existingPrompt = await db.query.aiPrompts.findFirst({
      where: and(
        eq(aiPrompts.id, id),
        eq(aiPrompts.workspaceId, context.workspaceId)
      ),
    });

    if (!existingPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt not found or you do not have permission to delete it',
        },
        { status: 404 }
      );
    }

    // Cannot delete system prompts
    if (existingPrompt.workspaceId === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete system prompts',
        },
        { status: 403 }
      );
    }

    // Cannot delete default prompts
    if (existingPrompt.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete a default prompt. Set another prompt as default first.',
        },
        { status: 400 }
      );
    }

    // Delete the prompt
    await db.delete(aiPrompts).where(eq(aiPrompts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete prompt',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
