/**
 * Lazy-loaded Chart Components
 * Reduces initial bundle size and improves page load performance
 */

'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton } from './SkeletonLoader';

// Lazy load chart components with loading state
export const LineChart = dynamic(() => import('./LineChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR for charts (client-side only)
});

export const BarChart = dynamic(() => import('./BarChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

export const ConversionFunnel = dynamic(() => import('./ConversionFunnel'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
