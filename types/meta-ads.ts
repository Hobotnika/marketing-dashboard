export interface MetaAdsMetrics {
  reach: number;
  whatsappConversations: number;
  spend: number;
  avgCostPerConversation: number;
  leads?: number; // if available
  avgCostPerLead?: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface MetaCampaignMetrics {
  campaignId: string;
  campaignName: string;
  reach: number;
  impressions: number;
  whatsappConversations: number;
  spend: number;
  avgCostPerConversation: number;
  leads?: number;
  avgCostPerLead?: number;
  status: string;
  objective?: string;
}

export interface MetaAdsApiResponse {
  success: boolean;
  data?: {
    campaigns: MetaCampaignMetrics[];
    totals: MetaAdsMetrics;
  };
  error?: string;
  cached?: boolean;
  cachedAt?: string;
}

export interface MetaAdsConfig {
  accessToken: string;
  adAccountId: string;
}

export interface MetaInsightData {
  campaign_id: string;
  campaign_name: string;
  reach?: string;
  impressions?: string;
  spend?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start: string;
  date_stop: string;
}
