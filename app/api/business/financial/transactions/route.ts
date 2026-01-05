import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

/**
 * GET /api/business/financial/transactions
 * Fetch transactions (expenses) for the organization
 *
 * Query params:
 * - days: number (default: 30) - how many days to fetch
 * - category: string (optional) - filter by expense category
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const categoryFilter = searchParams.get('category');

    // Calculate date range (YYYY-MM-DD format for SQLite)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('[Financial/Transactions] Fetching for org:', context.organizationId);
    console.log('[Financial/Transactions] Date range:', startDateStr, 'to today');
    if (categoryFilter) {
      console.log('[Financial/Transactions] Category filter:', categoryFilter);
    }

    // Build query conditions
    const conditions = [
      eq(transactions.organizationId, context.organizationId),
      gte(transactions.date, startDateStr)
    ];

    if (categoryFilter && ['ads', 'software', 'contractors', 'education', 'office', 'other'].includes(categoryFilter)) {
      conditions.push(eq(transactions.category, categoryFilter));
    }

    // Fetch transactions
    const transactionList = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    // Calculate totals by category
    const totalByCategory = await db
      .select({
        category: transactions.category,
        total: sql<number>`CAST(SUM(${transactions.amount}) AS INTEGER)`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.category);

    console.log('[Financial/Transactions] Found', transactionList.length, 'transactions');

    return NextResponse.json({
      success: true,
      transactions: transactionList,
      totals: totalByCategory,
      count: transactionList.length,
      period: { days, start: startDateStr, end: new Date().toISOString().split('T')[0] },
    });
  } catch (error) {
    console.error('[Financial/Transactions] Error fetching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/business/financial/transactions
 * Add transaction (expense)
 *
 * Body:
 * - date: string (YYYY-MM-DD)
 * - category: string (enum: ads, software, contractors, education, office, other)
 * - description: string (required)
 * - amount: number (cents)
 * - vendor: string (optional)
 * - notes: string (optional)
 *
 * Security: Protected by withTenantSecurity
 */
export const POST = withTenantSecurity(async (request: Request, context) => {
  try {
    const body = await request.json();
    const { date, category, description, amount, vendor, notes } = body;

    // Validation
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    const validCategories = ['ads', 'software', 'contractors', 'education', 'office', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a non-negative number (in cents)' },
        { status: 400 }
      );
    }

    console.log('[Financial/Transactions] Creating for date:', date);
    console.log('[Financial/Transactions] Organization:', context.organizationId);
    console.log('[Financial/Transactions] User:', context.userId);
    console.log('[Financial/Transactions] Category:', category, 'Amount:', amount);

    // Create new transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        date,
        category,
        description,
        amount,
        vendor: vendor || null,
        notes: notes || null,
      })
      .returning();

    console.log('[Financial/Transactions] ✅ Created successfully');

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('[Financial/Transactions] Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/business/financial/transactions
 * Delete a transaction
 *
 * Query params:
 * - id: string (required) - ID of transaction to delete
 *
 * Security: Protected by withTenantSecurity
 */
export const DELETE = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    console.log('[Financial/Transactions] Deleting ID:', id);
    console.log('[Financial/Transactions] Organization:', context.organizationId);

    // Delete transaction (with organization check for security)
    const result = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.organizationId, context.organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found or access denied' },
        { status: 404 }
      );
    }

    console.log('[Financial/Transactions] ✅ Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('[Financial/Transactions] Error deleting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
