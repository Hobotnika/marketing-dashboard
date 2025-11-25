import { MetaCampaignMetrics } from '@/types/meta-ads';

interface CampaignCardProps {
  campaign: MetaCampaignMetrics;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PAUSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {campaign.campaignName}
          </h3>
          {campaign.objective && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {campaign.objective.replace(/_/g, ' ')}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Reach</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(campaign.reach)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Impressions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(campaign.impressions)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">WhatsApp Convos</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(campaign.whatsappConversations)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Cost/Convo</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(campaign.avgCostPerConversation)}
          </p>
        </div>

        {campaign.leads !== undefined && campaign.leads > 0 && (
          <>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Leads</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(campaign.leads)}
              </p>
            </div>

            {campaign.avgCostPerLead !== undefined && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cost/Lead</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(campaign.avgCostPerLead)}
                </p>
              </div>
            )}
          </>
        )}

        <div className="col-span-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Spend</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(campaign.spend)}
          </p>
        </div>
      </div>
    </div>
  );
}
