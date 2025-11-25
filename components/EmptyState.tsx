/**
 * Empty State Components
 * Beautiful placeholders for when there's no data
 */

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * No Data Icon
 */
function NoDataIcon() {
  return (
    <svg
      className="w-24 h-24"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/**
 * No Google Ads Data
 */
export function EmptyGoogleAds({ onConfigure }: { onConfigure?: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12">
      <EmptyState
        icon={<NoDataIcon />}
        title="No Google Ads Data"
        description="Configure your Google Ads API credentials to start tracking impressions, clicks, and campaign performance."
        action={
          onConfigure
            ? {
                label: 'Configure Google Ads',
                onClick: onConfigure,
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * No Meta Ads Data
 */
export function EmptyMetaAds({ onConfigure }: { onConfigure?: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12">
      <EmptyState
        icon={
          <svg
            className="w-24 h-24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
        title="No Meta Ads Data"
        description="Connect your Meta (Facebook/Instagram) Ads account to track reach, conversations, and social media performance."
        action={
          onConfigure
            ? {
                label: 'Configure Meta Ads',
                onClick: onConfigure,
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * No Campaigns
 */
export function EmptyCampaigns() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12">
      <EmptyState
        icon={
          <svg
            className="w-24 h-24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        title="No Active Campaigns"
        description="There are currently no active campaigns in your Meta Ads account. Create campaigns in Facebook Ads Manager to see them here."
      />
    </div>
  );
}

/**
 * API Error State
 */
export function ErrorState({
  title = 'Something Went Wrong',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12">
      <EmptyState
        icon={
          <svg
            className="w-24 h-24 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
        title={title}
        description={description}
        action={
          onRetry
            ? {
                label: 'Try Again',
                onClick: onRetry,
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * Loading Complete - No New Data
 */
export function NoNewData() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 text-center">
      <svg
        className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
        You're All Caught Up!
      </h3>
      <p className="text-sm text-blue-700 dark:text-blue-300">
        No new data available. Next refresh in{' '}
        <span className="font-medium">6 hours</span>.
      </p>
    </div>
  );
}
