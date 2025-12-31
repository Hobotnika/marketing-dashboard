import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { db } from '@/lib/db';
import { customerAvatars, adRatings, ads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAvatarRatingPrompt, analyzeSentiment } from '@/lib/utils/avatar-rating';
import type { AvatarPersonaData } from '@/types/avatar';

// Initialize Vertex AI
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const location = 'us-central1';

// Parse credentials from JSON string
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');
} catch (e) {
  console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON');
}

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
  googleAuthOptions: {
    credentials,
  },
});

interface AvatarFeedback {
  feedback: string;
  sentiment: 'positive' | 'mixed' | 'negative';
  processing_time: number;
}

/**
 * POST /api/ads/[id]/rate
 * Rate an ad using all avatars from a specific avatar set
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id: adId } = await params;

    console.log('=== AVATAR RATING DEBUG ===');
    console.log('Ad ID requested:', adId);
    console.log('Full request URL:', request.url);

    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');
    const subdomain = request.headers.get('x-organization-subdomain');

    console.log('Tenant context:', {
      organizationId,
      subdomain,
      userId
    });

    if (!organizationId) {
      console.error('[Avatar Rating] Organization ID not found in headers');
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { avatarSetName, adCopy } = body;

    console.log('Request body:', {
      avatarSetName,
      adCopyLength: adCopy?.length,
      hasAdCopy: !!adCopy
    });

    if (!avatarSetName || !adCopy) {
      return NextResponse.json(
        { success: false, error: 'avatarSetName and adCopy are required' },
        { status: 400 }
      );
    }

    // Verify ad exists and belongs to organization
    console.log('Querying for ad with ID:', adId);
    console.log('Organization filter:', organizationId);

    const ad = await db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.id, adId),
          eq(ads.organizationId, organizationId)
        )
      )
      .limit(1);

    console.log('Ad found in database:', ad.length > 0);

    if (ad.length === 0) {
      console.log('ERROR: Ad not found with tenant filter!');
      console.log('Trying to find ANY ad with this ID regardless of org...');

      // Try to find the ad without org filter to diagnose the issue
      const anyAd = await db
        .select()
        .from(ads)
        .where(eq(ads.id, adId))
        .limit(1);

      console.log('Ad exists in DB but wrong org?:', anyAd.length > 0);

      if (anyAd.length > 0) {
        console.log('Ad organization ID:', anyAd[0].organizationId);
        console.log('Expected organization ID:', organizationId);
        console.log('MISMATCH! This is a tenant isolation issue.');
        console.log('Ad details:', {
          id: anyAd[0].id,
          type: anyAd[0].adType,
          organizationId: anyAd[0].organizationId,
          createdAt: anyAd[0].createdAt
        });
      } else {
        console.log('Ad does not exist in database at all!');
        console.log('This might be an ID format or timing issue.');
      }

      console.log('===========================');

      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      );
    }

    console.log('✓ Ad found and belongs to organization');
    console.log('===========================');

    // Fetch all avatars for this set
    const avatarRecords = await db
      .select()
      .from(customerAvatars)
      .where(
        and(
          eq(customerAvatars.organizationId, organizationId),
          eq(customerAvatars.setName, avatarSetName),
          eq(customerAvatars.isActive, true)
        )
      );

    if (avatarRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: `No avatars found for set "${avatarSetName}"` },
        { status: 404 }
      );
    }

    console.log(`[Avatar Rating] Starting rating for ad ${adId} with ${avatarRecords.length} avatars from "${avatarSetName}"`);

    // Rate with all avatars in parallel using Vertex AI
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const ratingPromises = avatarRecords.map(async (avatarRecord) => {
      const avatarStartTime = Date.now();

      try {
        const personaData: AvatarPersonaData = JSON.parse(avatarRecord.personaData);
        const prompt = getAvatarRatingPrompt(avatarRecord.avatarName, personaData, adCopy);

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        });

        const response = result.response;
        const feedback = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No feedback generated';
        const processingTime = Date.now() - avatarStartTime;
        const sentiment = analyzeSentiment(feedback);

        console.log(`[Avatar Rating] ${avatarRecord.avatarName}: ${sentiment} (${processingTime}ms)`);

        return {
          avatarName: avatarRecord.avatarName,
          feedback,
          sentiment,
          processing_time: processingTime,
          demographics: personaData.demographics,
        };
      } catch (error) {
        console.error(`[Avatar Rating] Error rating with ${avatarRecord.avatarName}:`, error);
        // Return a fallback response if one avatar fails
        return {
          avatarName: avatarRecord.avatarName,
          feedback: 'Error: Failed to generate feedback for this avatar.',
          sentiment: 'mixed' as const,
          processing_time: Date.now() - avatarStartTime,
          demographics: JSON.parse(avatarRecord.personaData).demographics,
        };
      }
    });

    const allFeedbacks = await Promise.all(ratingPromises);

    // Calculate summary stats
    const positiveCount = allFeedbacks.filter(f => f.sentiment === 'positive').length;
    const mixedCount = allFeedbacks.filter(f => f.sentiment === 'mixed').length;
    const negativeCount = allFeedbacks.filter(f => f.sentiment === 'negative').length;
    const totalProcessingTime = Date.now() - startTime;

    // Prepare feedbacks object for database (without demographics)
    const avatarFeedbacksObj: Record<string, AvatarFeedback> = {};
    allFeedbacks.forEach(fb => {
      avatarFeedbacksObj[fb.avatarName] = {
        feedback: fb.feedback,
        sentiment: fb.sentiment,
        processing_time: fb.processing_time,
      };
    });

    // Save to database
    const ratingRecord = await db
      .insert(adRatings)
      .values({
        adId,
        organizationId,
        avatarSetName,
        niche: avatarRecords[0].niche,
        avatarFeedbacks: JSON.stringify(avatarFeedbacksObj),
        totalAvatars: allFeedbacks.length,
        positiveCount,
        mixedCount,
        negativeCount,
        processingTimeMs: totalProcessingTime,
      })
      .returning();

    console.log(`[Avatar Rating] Completed in ${totalProcessingTime}ms - ${positiveCount} positive, ${mixedCount} mixed, ${negativeCount} negative`);

    return NextResponse.json({
      success: true,
      ratingId: ratingRecord[0].id,
      summary: {
        totalAvatars: allFeedbacks.length,
        positive: positiveCount,
        mixed: mixedCount,
        negative: negativeCount,
        processingTimeMs: totalProcessingTime,
      },
      feedbacks: allFeedbacks, // Include demographics in response
    });
  } catch (error) {
    console.error('[Avatar Rating] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rate ad',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
