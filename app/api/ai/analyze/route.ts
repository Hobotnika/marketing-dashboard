import { NextResponse } from 'next/server';
import { protectTenantRoute } from '@/lib/api/tenant-security';
import { db } from '@/lib/db';
import { aiPromptTemplates, aiAnalyses, kpiSnapshots, dailyRoutines, incomeActivities, transactions, cashFlowSnapshots } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
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

  // Add more section data fetchers as needed
  // if (sectionName === 'marketing') { ... }

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
