import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { dmScripts } from '@/lib/db/schema';
import { eq, desc, or, like, sql } from 'drizzle-orm';

/**
 * GET /api/business/scripts
 * List scripts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // filter by category
    const search = searchParams.get('search'); // search by title/content
    const sortBy = searchParams.get('sortBy') || 'updated'; // 'updated', 'used', 'success'

    // Build query
    let conditions = [eq(dmScripts.workspaceId, context.workspaceId)];

    if (category && category !== 'all') {
      conditions.push(eq(dmScripts.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(dmScripts.title, `%${search}%`),
          like(dmScripts.content, `%${search}%`)
        )!
      );
    }

    let query = db
      .select()
      .from(dmScripts)
      .where(sql`${sql.join(conditions, sql` AND `)}`);

    // Apply sorting
    if (sortBy === 'used') {
      query = query.orderBy(desc(dmScripts.timesUsed));
    } else if (sortBy === 'success') {
      query = query.orderBy(desc(dmScripts.successRate));
    } else {
      query = query.orderBy(desc(dmScripts.updatedAt));
    }

    const scriptList = await query;

    return NextResponse.json({
      success: true,
      scripts: scriptList,
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/scripts
 * Create a new script
 */
export async function POST(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const body = await request.json();
    const {
      title,
      category,
      content,
      useCase,
      talkingPoints,
      expectedOutcomes,
      successTips,
      isDefaultTemplate,
    } = body;

    // Validation
    if (!title || !category || !content) {
      return NextResponse.json(
        { error: 'Title, category, and content are required' },
        { status: 400 }
      );
    }

    const newScript = await db
      .insert(dmScripts)
      .values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        title,
        category,
        content,
        useCase: useCase || null,
        talkingPoints: talkingPoints || null,
        expectedOutcomes: expectedOutcomes || null,
        successTips: successTips || null,
        isDefaultTemplate: isDefaultTemplate || false,
        order: 0,
        timesUsed: 0,
        successRate: '0.00',
      })
      .returning();

    return NextResponse.json({
      success: true,
      script: newScript[0],
    });
  } catch (error) {
    console.error('Error creating script:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create script' },
      { status: 500 }
    );
  }
}
