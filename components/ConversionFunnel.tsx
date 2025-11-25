'use client';

interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
  title?: string;
  loading?: boolean;
}

export default function ConversionFunnel({ stages, title, loading = false }: ConversionFunnelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate max value for width percentage
  const maxValue = stages.length > 0 ? stages[0].value : 1;

  // Default colors for each stage
  const defaultColors = [
    'bg-blue-500',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-purple-600',
    'bg-purple-700',
  ];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const calculateConversionRate = (index: number) => {
    if (index === 0) return 100;
    const previousValue = stages[index - 1].value;
    if (previousValue === 0) return 0;
    return ((stages[index].value / previousValue) * 100).toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-lg">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
      )}

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.value / maxValue) * 100;
          const conversionRate = calculateConversionRate(index);
          const bgColor = stage.color || defaultColors[index % defaultColors.length];

          return (
            <div key={stage.name} className="relative">
              {/* Stage Bar */}
              <div
                className={`${bgColor} rounded-lg p-4 transition-all duration-500 hover:shadow-md cursor-pointer relative overflow-hidden`}
                style={{
                  width: `${widthPercentage}%`,
                  minWidth: '40%',
                  marginLeft: `${index * 3}%`,
                }}
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{stage.name}</span>
                    <span className="text-xs text-white/80">
                      {formatNumber(stage.value)} users
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-white">
                      {formatNumber(stage.value)}
                    </span>
                    {index > 0 && (
                      <span className="text-xs text-white/90 font-medium">
                        {conversionRate}% conversion
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connecting Arrow */}
              {index < stages.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <svg
                    className="w-4 h-4 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Conversion</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stages.length > 0 && stages[0].value > 0
                ? ((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(1)
                : '0'}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Drop-off Rate</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stages.length > 0 && stages[0].value > 0
                ? (
                    100 -
                    (stages[stages.length - 1].value / stages[0].value) * 100
                  ).toFixed(1)
                : '0'}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
