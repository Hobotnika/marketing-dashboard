import { NextResponse } from 'next/server';
import {
  MetaAdsApiResponse,
  MetaCampaignMetrics,
  MetaAdsMetrics,
} from '@/types/meta-ads';
import { getCachedMetrics, setCachedMetrics, getCacheTimestamp } from '@/lib/cache';
import { withTenantSecurity } from '@/lib/api/tenant-security';
import { decrypt } from '@/lib/db/encryption';

const META_GRAPH_API_VERSION = 'v18.0';
const META_GRAPH_API_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get date range (last 30 days)
function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

interface MetaApiInsight {
  campaign_id?: string;
  campaign_name?: string;
  reach?: string;
  impressions?: string;
  spend?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start?: string;
  date_stop?: string;
  objective?: string;
}

interface MetaCampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  insights?: {
    data: MetaApiInsight[];
  };
}

/**
 * GET /api/meta-ads/metrics
 * Fetch Meta Ads metrics
 *
 * Security: Protected by withTenantSecurity wrapper
 */
export const GET = withTenantSecurity(async (request: Request, context) => {
  try {
    // Use validated organization from security context
    const { organization } = context;

    const cacheKey = `meta-ads-metrics-${organization.id}`;

    // Check if organization has Meta credentials
    if (!organization.metaAccessToken || !organization.metaAdAccountId) {
      console.warn(`⚠️  Meta Ads credentials not configured for org ${organization.name}`);

      // Return cached data if available
      const cachedData = getCachedMetrics(cacheKey);
      if (cachedData) {
        const response: MetaAdsApiResponse = {
          success: true,
          data: cachedData as any,
          cached: true,
          cachedAt: getCacheTimestamp(cacheKey) || undefined,
        };
        return NextResponse.json(response);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Meta Ads credentials not configured. Please add them in the admin panel.',
        } as MetaAdsApiResponse,
        { status: 500 }
      );
    }

    // Try to fetch from Meta API
    try {
      // Decrypt organization credentials
      const accessToken = decrypt(organization.metaAccessToken);
      const adAccountId = organization.metaAdAccountId;
      const dateRange = getDateRange();

      // Fetch campaigns with insights
      const fieldsParam = encodeURIComponent(
        'id,name,status,objective,insights{campaign_id,campaign_name,reach,impressions,spend,actions,date_start,date_stop}'
      );
      const insightsParams = encodeURIComponent(
        JSON.stringify({
          time_range: {
            since: dateRange.start,
            until: dateRange.end,
          },
          level: 'campaign',
          action_attribution_windows: ['7d_click', '1d_view'],
        })
      );

      const campaignsUrl = `${META_GRAPH_API_URL}/${adAccountId}/campaigns?fields=${fieldsParam}&insights.time_range=${insightsParams}&access_token=${accessToken}`;

      console.log('Fetching Meta campaigns...');

      const campaignsResponse = await fetch(campaignsUrl);

      if (!campaignsResponse.ok) {
        const errorData = await campaignsResponse.json();
        throw new Error(
          `Meta API error: ${errorData.error?.message || campaignsResponse.statusText}`
        );
      }

      const campaignsData = await campaignsResponse.json();
      const campaigns: MetaCampaignData[] = campaignsData.data || [];

      console.log(`Found ${campaigns.length} campaigns`);

      // Process each campaign
      const processedCampaigns: MetaCampaignMetrics[] = [];
      let totalReach = 0;
      let totalImpressions = 0;
      let totalSpend = 0;
      let totalWhatsappConversations = 0;
      let totalLeads = 0;

      for (const campaign of campaigns) {
        const insights = campaign.insights?.data?.[0];

        if (!insights) {
          console.log(`No insights for campaign: ${campaign.name}`);
          continue;
        }

        const reach = parseFloat(insights.reach || '0');
        const impressions = parseFloat(insights.impressions || '0');
        const spend = parseFloat(insights.spend || '0');

        // Extract WhatsApp conversations from actions
        let whatsappConversations = 0;
        let leads = 0;

        if (insights.actions) {
          for (const action of insights.actions) {
            // WhatsApp conversations started
            if (
              action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
              action.action_type === 'messaging_conversation_started_7d'
            ) {
              whatsappConversations += parseFloat(action.value || '0');
            }

            // Leads
            if (action.action_type === 'lead' || action.action_type === 'onsite_conversion.lead') {
              leads += parseFloat(action.value || '0');
            }
          }
        }

        // Calculate cost per conversation
        const avgCostPerConversation =
          whatsappConversations > 0 ? spend / whatsappConversations : 0;

        // Calculate cost per lead
        const avgCostPerLead = leads > 0 ? spend / leads : undefined;

        const campaignMetrics: MetaCampaignMetrics = {
          campaignId: campaign.id,
          campaignName: campaign.name,
          reach,
          impressions,
          whatsappConversations,
          spend,
          avgCostPerConversation: parseFloat(avgCostPerConversation.toFixed(2)),
          leads: leads > 0 ? leads : undefined,
          avgCostPerLead: avgCostPerLead ? parseFloat(avgCostPerLead.toFixed(2)) : undefined,
          status: campaign.status,
          objective: campaign.objective,
        };

        processedCampaigns.push(campaignMetrics);

        // Aggregate totals
        totalReach += reach;
        totalImpressions += impressions;
        totalSpend += spend;
        totalWhatsappConversations += whatsappConversations;
        totalLeads += leads;
      }

      // Calculate total averages
      const totalAvgCostPerConversation =
        totalWhatsappConversations > 0 ? totalSpend / totalWhatsappConversations : 0;

      const totalAvgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : undefined;

      const totals: MetaAdsMetrics = {
        reach: totalReach,
        whatsappConversations: totalWhatsappConversations,
        spend: parseFloat(totalSpend.toFixed(2)),
        avgCostPerConversation: parseFloat(totalAvgCostPerConversation.toFixed(2)),
        leads: totalLeads > 0 ? totalLeads : undefined,
        avgCostPerLead: totalAvgCostPerLead
          ? parseFloat(totalAvgCostPerLead.toFixed(2))
          : undefined,
        dateRange,
      };

      const responseData = {
        campaigns: processedCampaigns,
        totals,
      };

      // Cache the successful result with org-specific key
      setCachedMetrics(responseData as any, cacheKey);

      const response: MetaAdsApiResponse = {
        success: true,
        data: responseData,
        cached: false,
      };

      return NextResponse.json(response);
    } catch (apiError: unknown) {
      console.error('Meta Ads API Error:', apiError);

      // If API call fails, try to return cached data
      const cachedData = getCachedMetrics(cacheKey);

      if (cachedData) {
        const response: MetaAdsApiResponse = {
          success: true,
          data: cachedData as any,
          cached: true,
          cachedAt: getCacheTimestamp(cacheKey) || undefined,
          error: 'Using cached data due to API error',
        };
        return NextResponse.json(response);
      }

      // No cached data available
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch Meta Ads metrics: ${errorMessage}`,
        } as MetaAdsApiResponse,
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);

    // Try to return cached data on error
    const cacheKey = `meta-ads-metrics-${context.organizationId}`;
    const cachedData = getCachedMetrics(cacheKey);

    if (cachedData) {
      const response: MetaAdsApiResponse = {
        success: true,
        data: cachedData as any,
        cached: true,
        cachedAt: getCacheTimestamp(cacheKey) || undefined,
        error: 'Using cached data due to unexpected error',
      };
      return NextResponse.json(response);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as MetaAdsApiResponse,
      { status: 500 }
    );
  }
});
