export interface GoogleAdsMetrics {
  impressions: number;
  ctr: number; // percentage
  clicks: number;
  spend: number; // USD
  dateRange: {
    start: string;
    end: string;
  };
}

export interface GoogleAdsApiResponse {
  success: boolean;
  data?: GoogleAdsMetrics;
  error?: string;
  cached?: boolean;
  cachedAt?: string;
}

export interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  customerId: string;
  refreshToken?: string;
}
