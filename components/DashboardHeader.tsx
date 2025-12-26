'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from './PDFReport';
import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics } from '@/types/meta-ads';
import UserMenu from './UserMenu';

interface DashboardHeaderProps {
  lastUpdate: string | null;
  timeSinceUpdate: string | null;
  onManualRefresh: () => Promise<void>;
  googleData?: GoogleAdsMetrics | null;
  metaData?: {
    campaigns: any[];
    totals: MetaAdsMetrics;
  } | null;
}

export default function DashboardHeader({
  lastUpdate,
  timeSinceUpdate,
  onManualRefresh,
  googleData,
  metaData,
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onManualRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const timestamp = lastUpdate || new Date().toISOString();

  return (
    <div className="mb-8">
      {/* Top Bar with User Menu */}
      <div className="flex items-center justify-end mb-6">
        <UserMenu />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Marketing Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Multi-platform advertising performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Ad Link */}
          <Link
            href="/dashboard/ads/create/meta"
            className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Create Meta Ad with AI"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            Create Ad
          </Link>

          {/* Alert Settings Link */}
          <Link
            href="/settings/alerts"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-600"
            title="Alert settings"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Alerts
          </Link>

          {/* Export PDF Button */}
          {googleData && metaData && (
            <PDFDownloadLink
              document={
                <PDFReport
                  googleData={googleData}
                  metaData={metaData}
                  timestamp={timestamp}
                />
              }
              fileName={`marketing-report-${new Date().toISOString().split('T')[0]}.pdf`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {({ loading }) => (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {loading ? 'Generating PDF...' : 'Export PDF'}
                </>
              )}
            </PDFDownloadLink>
          )}

          {/* Force Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Force data refresh"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Updating...' : 'Force Refresh'}
          </button>
        </div>
      </div>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm">
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Last Updated:
            </span>{' '}
            <span className="text-blue-600 dark:text-blue-400">
              {timeSinceUpdate || 'Just now'}
            </span>
            <span className="text-blue-500 dark:text-blue-500 text-xs ml-2">
              ({new Date(lastUpdate).toLocaleString()})
            </span>
          </div>
        </div>
      )}

      {/* Auto-refresh Schedule Info */}
      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <svg
          className="w-3 h-3 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Auto-refresh: Every 6 hours (12:01am, 6:01am, 12:01pm, 6:01pm EST)
      </div>
    </div>
  );
}
