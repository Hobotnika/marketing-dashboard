'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: Array<Record<string, any>>;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  xAxisKey: string;
  title?: string;
  height?: number;
  loading?: boolean;
  horizontal?: boolean;
  yAxisFormatter?: (value: any) => string;
}

export default function BarChart({
  data,
  bars,
  xAxisKey,
  title,
  height = 300,
  loading = false,
  horizontal = false,
  yAxisFormatter,
}: BarChartProps) {
  if (loading) {
    return (
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 animate-pulse"
        style={{ height: height + 80 }}
      >
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
        <div className="h-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const ChartComponent = horizontal ? (
    <RechartsBarChart
      data={data}
      layout="vertical"
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        className="stroke-gray-200 dark:stroke-gray-700"
      />
      <XAxis
        type="number"
        className="text-xs text-gray-600 dark:text-gray-400"
        tick={{ fill: 'currentColor' }}
        tickFormatter={yAxisFormatter}
      />
      <YAxis
        type="category"
        dataKey={xAxisKey}
        className="text-xs text-gray-600 dark:text-gray-400"
        tick={{ fill: 'currentColor' }}
        width={150}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '0.75rem',
        }}
        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '0.25rem' }}
        itemStyle={{ color: '#6b7280', fontSize: '0.875rem' }}
        formatter={yAxisFormatter}
        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
      />
      <Legend
        wrapperStyle={{
          paddingTop: '1rem',
          fontSize: '0.875rem',
        }}
      />
      {bars.map((bar) => (
        <Bar
          key={bar.dataKey}
          dataKey={bar.dataKey}
          name={bar.name}
          fill={bar.color}
          radius={[0, 8, 8, 0]}
          animationDuration={1000}
        />
      ))}
    </RechartsBarChart>
  ) : (
    <RechartsBarChart
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        className="stroke-gray-200 dark:stroke-gray-700"
      />
      <XAxis
        dataKey={xAxisKey}
        className="text-xs text-gray-600 dark:text-gray-400"
        tick={{ fill: 'currentColor' }}
      />
      <YAxis
        className="text-xs text-gray-600 dark:text-gray-400"
        tick={{ fill: 'currentColor' }}
        tickFormatter={yAxisFormatter}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '0.75rem',
        }}
        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '0.25rem' }}
        itemStyle={{ color: '#6b7280', fontSize: '0.875rem' }}
        formatter={yAxisFormatter}
        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
      />
      <Legend
        wrapperStyle={{
          paddingTop: '1rem',
          fontSize: '0.875rem',
        }}
      />
      {bars.map((bar) => (
        <Bar
          key={bar.dataKey}
          dataKey={bar.dataKey}
          name={bar.name}
          fill={bar.color}
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
        />
      ))}
    </RechartsBarChart>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-lg">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {ChartComponent}
      </ResponsiveContainer>
    </div>
  );
}
