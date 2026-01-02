'use client';

import { useState } from 'react';

interface Ad {
  id: string;
  organizationId: string;
  userId: string | null;
  ai_generated: boolean;
  ai_prompt: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  ad_type: 'meta' | 'google';
  headline: string;
  body_text: string;
  call_to_action: string;
  landing_page: string | null;
  word_count: number | null;
  platform_ad_id: string | null;
  platform_config: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdGroupCardProps {
  landingPage: string | null;
  adType: 'meta' | 'google';
  variations: Ad[];
  onView: (variations: Ad[]) => void;
  onDelete: (adId: string) => void;
  onDuplicate: (ad: Ad) => void;
  onReRate: (ad: Ad) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'draft': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  'active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  'paused': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  'archived': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  'mixed': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
};

const FORMULA_COLORS: Record<string, string> = {
  'PASTOR': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  'Story-Bridge': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'Social Proof': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
};

export default function AdGroupCard({
  landingPage,
  adType,
  variations,
  onView,
  onDelete,
  onDuplicate,
  onReRate,
}: AdGroupCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Use the first (most recent) variation for preview
  const firstVariation = variations[0];
  const isGoogle = adType === 'google';

  // Determine status badge
  const statuses = new Set(variations.map(v => v.status));
  const status = statuses.size === 1 ? firstVariation.status : 'mixed';

  // Parse Google config if needed
  const platformConfig = isGoogle && firstVariation.platform_config
    ? JSON.parse(firstVariation.platform_config)
    : null;

  // Get earliest created date
  const earliestDate = variations.reduce((earliest, ad) => {
    const adDate = new Date(ad.createdAt);
    return adDate < earliest ? adDate : earliest;
  }, new Date(variations[0].createdAt));

  const handleDeleteAll = async () => {
    if (confirm(`Are you sure you want to delete all ${variations.length} variation(s)?`)) {
      for (const variation of variations) {
        await onDelete(variation.id);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow">
      {/* Header with badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            isGoogle
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
          }`}>
            {isGoogle ? '📱 Google Ads' : '📘 Meta Ads'}
          </span>

          {/* Variation Count Badge */}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            {variations.length} variation{variations.length !== 1 ? 's' : ''}
          </span>

          {/* Formula Badge (Meta only - first variation's formula) */}
          {!isGoogle && firstVariation.ai_prompt && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${FORMULA_COLORS[firstVariation.ai_prompt] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
              {firstVariation.ai_prompt}
            </span>
          )}

          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
            {status === 'mixed' ? 'Mixed Status' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    onView(variations);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View All Variations
                </button>

                <button
                  onClick={() => {
                    onDuplicate(firstVariation);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicate
                </button>

                <button
                  onClick={() => {
                    onReRate(firstVariation);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Re-run Rating
                </button>

                <div className="border-t border-gray-200 dark:border-zinc-700" />

                <button
                  onClick={() => {
                    handleDeleteAll();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 rounded-b-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Variations
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Landing Page */}
      {landingPage && (
        <div className="mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">Landing Page: </span>
          <a
            href={landingPage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {landingPage}
          </a>
        </div>
      )}

      {/* Preview Content */}
      {isGoogle && platformConfig ? (
        /* Google Ads Summary */
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Quality: </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {platformConfig.quality_score_prediction?.predicted_score || 'N/A'} ⭐
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <span className="text-gray-600 dark:text-gray-400">Extensions: </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {[platformConfig.sitelinks?.length > 0, platformConfig.callouts?.length > 0, platformConfig.structured_snippets?.length > 0].filter(Boolean).length} types
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
              <div className="font-semibold text-purple-900 dark:text-purple-100">
                {(platformConfig.headlines?.price_focused?.length || 0) +
                 (platformConfig.headlines?.social_proof?.length || 0) +
                 (platformConfig.headlines?.authority?.length || 0)} Headlines
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {platformConfig.descriptions?.length || 0} Descriptions
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Meta Ad Preview */
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Headline
            </h4>
            <p className="text-gray-900 dark:text-white font-medium">
              {firstVariation.headline}
            </p>
          </div>

          <div>
            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
              {firstVariation.body_text}
            </p>
          </div>

          {firstVariation.word_count && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {firstVariation.word_count} words
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Created {earliestDate.toLocaleDateString()}
        </span>

        <button
          onClick={() => onView(variations)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
