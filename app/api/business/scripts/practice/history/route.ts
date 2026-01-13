import { NextRequest, NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { practiceSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/business/scripts/practice/history
 * Get practice session history for the user
 */
export async function GET(request: NextRequest) {
  try {
    const context = await protectTenantRoute();

    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId'); // Filter by specific script (optional)
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build query conditions
    let conditions = [
      eq(practiceSessions.workspaceId, context.workspaceId),
      eq(practiceSessions.userId, context.userId), // User-private
    ];

    if (scriptId) {
      conditions.push(eq(practiceSessions.scriptId, scriptId));
    }

    // Get practice sessions
    const sessions = await db.query.practiceSessions.findMany({
      where: and(...conditions),
      orderBy: [desc(practiceSessions.practiceDate)],
      limit,
      with: {
        script: {
          columns: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    // Calculate improvement stats
    const allScores = sessions
      .filter((s) => s.aiFeedbackScore !== null)
      .map((s) => s.aiFeedbackScore!);

    const avgScore = allScores.length > 0
      ? (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1)
      : null;

    const recentScores = allScores.slice(0, 5);
    const olderScores = allScores.slice(5, 10);

    const recentAvg = recentScores.length > 0
      ? (recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length).toFixed(1)
      : null;

    const olderAvg = olderScores.length > 0
      ? (olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length).toFixed(1)
      : null;

    const improvementTrend = recentAvg && olderAvg
      ? parseFloat(recentAvg) > parseFloat(olderAvg)
        ? 'improving'
        : parseFloat(recentAvg) < parseFloat(olderAvg)
        ? 'declining'
        : 'stable'
      : null;

    return NextResponse.json({
      success: true,
      sessions,
      stats: {
        totalSessions: sessions.length,
        avgScore,
        recentAvg,
        olderAvg,
        improvementTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching practice history:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch practice history' },
      { status: 500 }
    );
  }
}
