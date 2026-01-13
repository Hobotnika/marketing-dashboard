import { NextResponse } from 'next/server';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { incomeActivities, transactions } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * GET /api/business/financial/summary
 * Get financial summary (revenue, expenses, cash flow)
 *
 * Query params:
 * - days: number (default: 30) - how many days to summarize
 *
 * Security: Protected by withTenantSecurity
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range (YYYY-MM-DD format for SQLite)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    console.log('[Financial/Summary] Calculating for org:', context.workspaceId);
    console.log('[Financial/Summary] Date range:', startDateStr, 'to', endDateStr);

    // Calculate total revenue by source
    const revenueBySource = await db
      .select({
        source: incomeActivities.source,
        total: sql<number>`CAST(SUM(COALESCE(${incomeActivities.amount}, 0)) AS INTEGER)`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(incomeActivities)
      .where(
        and(
          eq(incomeActivities.workspaceId, context.workspaceId),
          gte(incomeActivities.date, startDateStr)
        )
      )
      .groupBy(incomeActivities.source);

    // Calculate total expenses by category
    const expensesByCategory = await db
      .select({
        category: transactions.category,
        total: sql<number>`CAST(SUM(${transactions.amount}) AS INTEGER)`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, context.workspaceId),
          gte(transactions.date, startDateStr)
        )
      )
      .groupBy(transactions.category);

    // Calculate overall totals
    const totalRevenue = revenueBySource.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalExpenses = expensesByCategory.reduce((sum, item) => sum + (item.total || 0), 0);
    const netCashFlow = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netCashFlow / totalRevenue) * 100) : 0;

    // Format revenue by source as an object
    const revenueBreakdown: Record<string, number> = {
      content_ads: 0,
      messages_dms: 0,
      strategy_calls: 0,
      other: 0,
    };
    revenueBySource.forEach(item => {
      if (item.source) {
        revenueBreakdown[item.source] = item.total || 0;
      }
    });

    // Format expenses by category as an object
    const expensesBreakdown: Record<string, number> = {
      ads: 0,
      software: 0,
      contractors: 0,
      education: 0,
      office: 0,
      other: 0,
    };
    expensesByCategory.forEach(item => {
      if (item.category) {
        expensesBreakdown[item.category] = item.total || 0;
      }
    });

    // Get top expense category
    const topExpenseCategory = expensesByCategory.reduce((max, curr) => {
      return (curr.total || 0) > (max.total || 0) ? curr : max;
    }, { category: 'none', total: 0, count: 0 });

    // Get top revenue source
    const topRevenueSource = revenueBySource.reduce((max, curr) => {
      return (curr.total || 0) > (max.total || 0) ? curr : max;
    }, { source: 'none', total: 0, count: 0 });

    console.log('[Financial/Summary] Total Revenue:', totalRevenue);
    console.log('[Financial/Summary] Total Expenses:', totalExpenses);
    console.log('[Financial/Summary] Net Cash Flow:', netCashFlow);

    return NextResponse.json({
      success: true,
      summary: {
        period: {
          start: startDateStr,
          end: endDateStr,
          days,
        },
        totals: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          netCashFlow,
          profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
        },
        revenueBySource: revenueBreakdown,
        expensesByCategory: expensesBreakdown,
        topRevenueSource: {
          source: topRevenueSource.source || 'none',
          total: topRevenueSource.total || 0,
        },
        topExpenseCategory: {
          category: topExpenseCategory.category || 'none',
          total: topExpenseCategory.total || 0,
        },
        transactionCounts: {
          income: revenueBySource.reduce((sum, item) => sum + (item.count || 0), 0),
          expenses: expensesByCategory.reduce((sum, item) => sum + (item.count || 0), 0),
        },
      },
    });
  } catch (error) {
    console.error('[Financial/Summary] Error calculating:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate financial summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
