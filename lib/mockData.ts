// Mock data generator for demo purposes
// This generates realistic-looking trend data for charts

export function generateTrendData(days: number = 30) {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate somewhat realistic data with trends
    const baseClicks = 100 + Math.random() * 50;
    const baseImpressions = baseClicks * (20 + Math.random() * 10);
    const baseCost = baseClicks * (1.5 + Math.random() * 0.5);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: Math.round(baseClicks + Math.sin(i / 5) * 20),
      impressions: Math.round(baseImpressions + Math.sin(i / 5) * 200),
      cost: parseFloat((baseCost + Math.sin(i / 5) * 10).toFixed(2)),
      conversions: Math.round((baseClicks / 10) + Math.random() * 5),
    });
  }

  return data;
}

export function generateConversionFunnelData() {
  return [
    { name: 'Ad Impressions', value: 50000, color: 'bg-blue-500' },
    { name: 'Ad Clicks', value: 2500, color: 'bg-blue-600' },
    { name: 'Landing Page Views', value: 2200, color: 'bg-indigo-600' },
    { name: 'Form Submissions', value: 450, color: 'bg-purple-600' },
    { name: 'Conversions', value: 180, color: 'bg-purple-700' },
  ];
}

export function generateCampaignComparisonData(campaigns: any[]) {
  if (!campaigns || campaigns.length === 0) {
    return [
      {
        name: 'Campaign A',
        reach: 15000,
        conversations: 85,
        spend: 450,
      },
      {
        name: 'Campaign B',
        reach: 22000,
        conversations: 120,
        spend: 680,
      },
    ];
  }

  return campaigns.map((campaign) => ({
    name: campaign.campaignName.length > 20
      ? campaign.campaignName.substring(0, 20) + '...'
      : campaign.campaignName,
    reach: campaign.reach,
    conversations: campaign.whatsappConversations,
    spend: campaign.spend,
    impressions: campaign.impressions,
  }));
}
