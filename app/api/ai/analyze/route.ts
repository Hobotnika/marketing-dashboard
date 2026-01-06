import { NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import {
  aiPromptTemplates,
  aiAnalyses,
  kpiSnapshots,
  dailyRoutines,
  incomeActivities,
  transactions,
  cashFlowSnapshots,
  marketDefinitions,
  messageFrameworks,
  painPoints,
  usps,
  contentCalendar,
  competitors,
  customerAvatars,
  clients,
  clientStageHistory,
  clientHealthMetrics,
  onboardingTasks,
  clientMilestones,
  churnRiskInterventions
} from '@/lib/db/schema';
import { eq, and, gte, desc, asc, sql, or } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Data fetchers for each section
 */
async function fetchSectionData(
  sectionName: string,
  dataInput: string,
  organizationId: string,
  userId: string
): Promise<any> {
  // KPIS data fetchers
  if (sectionName === 'kpis') {
    if (dataInput === 'kpis_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const snapshots = await db.query.kpiSnapshots.findMany({
        where: and(
          eq(kpiSnapshots.organizationId, organizationId),
          gte(kpiSnapshots.date, startDateStr)
        ),
        orderBy: [desc(kpiSnapshots.date)],
      });

      return snapshots;
    }

    if (dataInput === 'kpis_last_7_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];

      const snapshots = await db.query.kpiSnapshots.findMany({
        where: and(
          eq(kpiSnapshots.organizationId, organizationId),
          gte(kpiSnapshots.date, startDateStr)
        ),
        orderBy: [desc(kpiSnapshots.date)],
      });

      return snapshots;
    }
  }

  // Congruence data fetchers (USER-PRIVATE)
  if (sectionName === 'congruence') {
    if (dataInput === 'routines_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      // CRITICAL: Filter by BOTH organizationId AND userId for privacy
      const routines = await db.query.dailyRoutines.findMany({
        where: and(
          eq(dailyRoutines.organizationId, organizationId),
          eq(dailyRoutines.userId, userId), // USER-PRIVATE!
          gte(dailyRoutines.date, startDateStr)
        ),
        orderBy: [desc(dailyRoutines.date)],
      });

      return routines;
    }

    if (dataInput === 'routines_last_7_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];

      const routines = await db.query.dailyRoutines.findMany({
        where: and(
          eq(dailyRoutines.organizationId, organizationId),
          eq(dailyRoutines.userId, userId), // USER-PRIVATE!
          gte(dailyRoutines.date, startDateStr)
        ),
        orderBy: [desc(dailyRoutines.date)],
      });

      return routines;
    }
  }

  // Financial data fetchers (COMPANY-LEVEL)
  if (sectionName === 'financial') {
    if (dataInput === 'income_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const income = await db.query.incomeActivities.findMany({
        where: and(
          eq(incomeActivities.organizationId, organizationId),
          gte(incomeActivities.date, startDateStr)
        ),
        orderBy: [desc(incomeActivities.date)],
      });

      return income;
    }

    if (dataInput === 'transactions_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const expenses = await db.query.transactions.findMany({
        where: and(
          eq(transactions.organizationId, organizationId),
          gte(transactions.date, startDateStr)
        ),
        orderBy: [desc(transactions.date)],
      });

      return expenses;
    }

    if (dataInput === 'cashflow_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const snapshots = await db.query.cashFlowSnapshots.findMany({
        where: and(
          eq(cashFlowSnapshots.organizationId, organizationId),
          gte(cashFlowSnapshots.date, startDateStr)
        ),
        orderBy: [desc(cashFlowSnapshots.date)],
      });

      return snapshots;
    }

    // KPIs data for Revenue Optimizer prompt
    if (dataInput === 'kpis_last_30_days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const kpis = await db.query.kpiSnapshots.findMany({
        where: and(
          eq(kpiSnapshots.organizationId, organizationId),
          gte(kpiSnapshots.date, startDateStr)
        ),
        orderBy: [desc(kpiSnapshots.date)],
      });

      return kpis;
    }
  }

  // Marketing data fetchers (COMPANY-LEVEL)
  if (sectionName === 'marketing') {
    if (dataInput === 'targetMarketDescription') {
      const market = await db.query.marketDefinitions.findFirst({
        where: eq(marketDefinitions.organizationId, organizationId),
      });
      return market?.targetMarketDescription || 'Not defined yet';
    }

    if (dataInput === 'avatarsList') {
      // Query avatar sets from Marketing Command Center
      const avatarSets = await db
        .select({
          setName: customerAvatars.setName,
          niche: customerAvatars.niche,
          avatarCount: sql<number>`COUNT(*)`,
        })
        .from(customerAvatars)
        .where(
          and(
            eq(customerAvatars.organizationId, organizationId),
            eq(customerAvatars.isActive, true)
          )
        )
        .groupBy(customerAvatars.setName, customerAvatars.niche);

      if (avatarSets.length === 0) return 'No customer avatars defined yet';

      return avatarSets
        .map((set) => `- ${set.setName} (${set.avatarCount} personas): ${set.niche}`)
        .join('\n');
    }

    if (dataInput === 'valueProposition') {
      const framework = await db.query.messageFrameworks.findFirst({
        where: eq(messageFrameworks.organizationId, organizationId),
      });
      return framework?.valueProposition || 'Not defined yet';
    }

    if (dataInput === 'painPointsList') {
      const framework = await db.query.messageFrameworks.findFirst({
        where: eq(messageFrameworks.organizationId, organizationId),
      });

      if (!framework) return 'No message framework defined yet';

      const points = await db.query.painPoints.findMany({
        where: and(
          eq(painPoints.organizationId, organizationId),
          eq(painPoints.messageFrameworkId, framework.id)
        ),
        orderBy: [asc(painPoints.displayOrder)],
      });

      if (points.length === 0) return 'No pain points defined yet';

      return points.map((p) => `- ${p.description}`).join('\n');
    }

    if (dataInput === 'uspsList') {
      const framework = await db.query.messageFrameworks.findFirst({
        where: eq(messageFrameworks.organizationId, organizationId),
      });

      if (!framework) return 'No message framework defined yet';

      const uspList = await db.query.usps.findMany({
        where: and(
          eq(usps.organizationId, organizationId),
          eq(usps.messageFrameworkId, framework.id)
        ),
        orderBy: [asc(usps.displayOrder)],
      });

      if (uspList.length === 0) return 'No USPs defined yet';

      return uspList.map((u) => `- ${u.title}: ${u.description}`).join('\n');
    }

    if (dataInput === 'recentContentList') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const content = await db.query.contentCalendar.findMany({
        where: and(
          eq(contentCalendar.organizationId, organizationId),
          gte(contentCalendar.scheduledDate, startDateStr)
        ),
        orderBy: [desc(contentCalendar.scheduledDate)],
        limit: 10,
      });

      if (content.length === 0) return 'No content created yet';

      return content
        .map(
          (c) =>
            `- ${c.scheduledDate}: [${c.platform}] ${c.title} (${c.status})`
        )
        .join('\n');
    }

    if (dataInput === 'platformFilter') {
      // This should come from request body
      return 'all platforms'; // Default, will be overridden by request
    }

    if (dataInput === 'competitorsList') {
      const comps = await db.query.competitors.findMany({
        where: eq(competitors.organizationId, organizationId),
      });

      if (comps.length === 0) return 'No competitors tracked yet';

      return comps
        .map(
          (c) => `
**${c.name}** (${c.website || 'No website'})
Description: ${c.description || 'N/A'}
Strengths: ${c.strengths || 'Not analyzed'}
Weaknesses: ${c.weaknesses || 'Not analyzed'}
    `
        )
        .join('\n');
    }
  }

  // Client Success Hub data fetchers (COMPANY-LEVEL)
  if (sectionName === 'clients') {
    if (dataInput === 'totalActiveClients') {
      const activeClients = await db.query.clients.findMany({
        where: and(
          eq(clients.organizationId, organizationId),
          eq(clients.status, 'active')
        ),
      });
      return activeClients.length;
    }

    if (dataInput === 'avgHealthScore') {
      const allClients = await db.query.clients.findMany({
        where: eq(clients.organizationId, organizationId),
      });
      if (allClients.length === 0) return 0;
      const avg = allClients.reduce((sum, c) => sum + c.healthScore, 0) / allClients.length;
      return Math.round(avg);
    }

    if (dataInput === 'clientsAtRisk') {
      const atRiskClients = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.organizationId, organizationId),
            or(eq(clients.status, 'at_risk'), sql`${clients.healthScore} < 50`)!
          )
        );
      return atRiskClients.length;
    }

    if (dataInput === 'churnRate') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const allClients = await db.query.clients.findMany({
        where: eq(clients.organizationId, organizationId),
      });

      const recentChurns = allClients.filter(
        (c) => c.status === 'churned' && c.updatedAt >= thirtyDaysAgoStr
      );

      const activeClients = allClients.filter((c) => c.status === 'active');
      const totalBase = activeClients.length + recentChurns.length;

      if (totalBase === 0) return '0';
      return ((recentChurns.length / totalBase) * 100).toFixed(1);
    }

    if (dataInput === 'clientDetailsList') {
      const allClients = await db.query.clients.findMany({
        where: eq(clients.organizationId, organizationId),
        orderBy: [desc(clients.createdAt)],
        limit: 20,
      });

      if (allClients.length === 0) return 'No clients yet';

      return allClients
        .map((c) => {
          const lastActivity = c.lastActivityDate
            ? new Date(c.lastActivityDate).toLocaleDateString()
            : 'Never';
          return `- ${c.name} (${c.company || 'No company'}): Stage=${c.currentStage}, Health=${c.healthScore}/100, MRR=$${c.mrr}, Last Activity=${lastActivity}`;
        })
        .join('\n');
    }

    if (dataInput === 'atRiskClientsList') {
      const atRiskClients = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.organizationId, organizationId),
            or(eq(clients.status, 'at_risk'), sql`${clients.healthScore} < 50`)!
          )
        )
        .orderBy(clients.healthScore)
        .limit(10);

      if (atRiskClients.length === 0) return 'No at-risk clients';

      return atRiskClients
        .map((c) => {
          const daysSinceActivity = c.lastActivityDate
            ? Math.floor((Date.now() - new Date(c.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 'Never';
          return `- ${c.name} (${c.company || 'No company'}): Health ${c.healthScore}/100, Last login ${daysSinceActivity} days ago, Stage: ${c.currentStage}`;
        })
        .join('\n');
    }

    if (dataInput === 'recentChurnList') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const churnedClients = await db.query.clients.findMany({
        where: and(
          eq(clients.organizationId, organizationId),
          eq(clients.status, 'churned')
        ),
        orderBy: [desc(clients.updatedAt)],
        limit: 5,
      });

      const recentChurns = churnedClients.filter((c) => c.updatedAt >= thirtyDaysAgoStr);

      if (recentChurns.length === 0) return 'No recent churns';

      return recentChurns
        .map(
          (c) =>
            `- ${c.name}: Churned on ${new Date(c.updatedAt).toLocaleDateString()}, Was in ${c.currentStage}, Final Health: ${c.healthScore}/100`
        )
        .join('\n');
    }

    if (dataInput === 'healthTrendData') {
      return 'Health trend analysis pending (future enhancement)';
    }

    // Individual client analysis (for Success Coach)
    if (dataInput === 'clientName' || dataInput === 'clientCompany') {
      // These should come from context passed in request body
      return 'N/A';
    }
  }

  return null;
}

/**
 * POST /api/ai/analyze
 * Run AI analysis using a prompt template
 */
export async function POST(request: Request) {
  try {
    const context = await protectTenantRoute();

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[AI Analyze] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { promptTemplateId, sectionName } = body;

    if (!promptTemplateId || !sectionName) {
      return NextResponse.json(
        { error: 'promptTemplateId and sectionName are required' },
        { status: 400 }
      );
    }

    // Get the prompt template
    const promptTemplate = await db.query.aiPromptTemplates.findFirst({
      where: and(
        eq(aiPromptTemplates.id, promptTemplateId),
        eq(aiPromptTemplates.organizationId, context.organizationId)
      ),
    });

    if (!promptTemplate) {
      return NextResponse.json(
        { error: 'Prompt template not found' },
        { status: 404 }
      );
    }

    // Parse dataInputs and triggers (stored as JSON strings)
    const dataInputsArray = JSON.parse(promptTemplate.dataInputs);

    // Fetch all required data inputs
    const inputData: Record<string, any> = {};

    for (const dataInput of dataInputsArray) {
      const data = await fetchSectionData(
        sectionName,
        dataInput,
        context.organizationId,
        context.userId
      );
      inputData[dataInput] = data;
    }

    // Replace variables in user prompt template
    let userPrompt = promptTemplate.userPromptTemplate;

    for (const [key, value] of Object.entries(inputData)) {
      const placeholder = `{{${key}}}`;
      userPrompt = userPrompt.replace(
        placeholder,
        JSON.stringify(value, null, 2)
      );
    }

    console.log('[AI Analyze] Calling Claude API...');
    console.log('[AI Analyze] Section:', sectionName);
    console.log('[AI Analyze] Prompt:', promptTemplate.promptName);
    console.log('[AI Analyze] Organization:', context.organizationId);

    // Call Claude API
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: promptTemplate.systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const processingTime = Date.now() - startTime;
    const output = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log('[AI Analyze] ✅ Analysis complete');
    console.log('[AI Analyze] Tokens used:', message.usage.input_tokens + message.usage.output_tokens);
    console.log('[AI Analyze] Processing time:', processingTime + 'ms');

    // Save analysis to database
    const analysis = await db
      .insert(aiAnalyses)
      .values({
        organizationId: context.organizationId,
        userId: context.userId,
        sectionName,
        promptTemplateId,
        promptName: promptTemplate.promptName,
        inputData: JSON.stringify(inputData),
        output,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        processingTime,
      })
      .returning();

    return NextResponse.json({ analysis: analysis[0] });
  } catch (error) {
    console.error('=== AI ANALYZE ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('========================');

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to run AI analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
