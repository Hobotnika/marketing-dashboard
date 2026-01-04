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

          {/* Saved Ads Link */}
          <Link
            href="/dashboard/ads/saved"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-600"
            title="View saved ad variations"
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Saved Ads
          </Link>

          {/* Brand Voice Link */}
          <Link
            href="/dashboard/settings/brand-voice"
            className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-orange-300 dark:border-orange-700"
            title="Set your brand voice for AI content"
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Brand Voice
          </Link>

          {/* Business OS - KPIS Link */}
          <Link
            href="/dashboard/business/kpis"
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-blue-300 dark:border-blue-700"
            title="Track your business KPIs"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            KPIS
          </Link>

          {/* Business OS - Congruence Link */}
          <Link
            href="/dashboard/business/congruence"
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-purple-300 dark:border-purple-700"
            title="Personal development tracker"
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Congruence
          </Link>

          {/* AI Prompts Link */}
          <Link
            href="/dashboard/settings/prompts"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-600"
            title="Manage AI prompt templates"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            AI Prompts
          </Link>

          {/* Avatars Link */}
          <Link
            href="/dashboard/settings/avatars"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-600"
            title="Manage customer personas"
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Avatars
          </Link>

          {/* Business KPIs Link */}
          <Link
            href="/dashboard/business/kpis"
            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg border border-blue-300 dark:border-blue-700"
            title="Track business KPIs and sales funnel"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Business KPIs
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
