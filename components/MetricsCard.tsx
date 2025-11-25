import { InfoTooltip } from './Tooltip';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number; // e.g., "+12.5%" or "↑ 234"
  icon?: React.ReactNode;
  loading?: boolean;
  tooltip?: string; // Explanation of what this metric means
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  loading = false,
  tooltip,
}: MetricsCardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const trendBgColors = {
    up: 'bg-green-50 dark:bg-green-900/20',
    down: 'bg-red-50 dark:bg-red-900/20',
    neutral: 'bg-gray-50 dark:bg-gray-900/20',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500 transition-transform duration-300 hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-500">
              {value}
            </p>
            {trend && (
              <span
                className={`text-lg font-semibold transition-all duration-300 ${trendColors[trend]}`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>

        {trendValue && trend && (
          <div
            className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${trendBgColors[trend]} ${trendColors[trend]}`}
          >
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
