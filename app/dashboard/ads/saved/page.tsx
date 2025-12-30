'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleAdPreview from '@/components/ads/GoogleAdPreview';
import { exportGoogleAdsToCsv, formatGoogleAdsForCopy, downloadCsv } from '@/lib/utils/google-ads-export';

interface Ad {
  id: string;
  organizationId: string;
  userId: string | null;
  ai_generated: boolean;
  ai_prompt: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  ad_type: 'meta' | 'google';
  ad_format?: string;
  headline: string;
  body_text: string;
  call_to_action: string;
  landing_page: string | null;
  word_count: number | null;
  platform_ad_id: string | null;
  platform_config: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const FORMULA_COLORS: Record<string, string> = {
  'PASTOR': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  'Story-Bridge': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'Social Proof': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  'draft': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
  'active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  'paused': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  'archived': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
};

export default function SavedAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [formulaFilter, setFormulaFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (platformFilter) params.set('platform', platformFilter);
      if (formulaFilter) params.set('formula', formulaFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/ads?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAds(data.data);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [platformFilter, formulaFilter, statusFilter, searchQuery]);

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAds(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportGoogleAd = (ad: Ad) => {
    if (!ad.platform_config) return;

    try {
      const config = JSON.parse(ad.platform_config);
      const csvContent = exportGoogleAdsToCsv(config, ad.headline);
      downloadCsv(csvContent, `google-ad-${ad.id}.csv`);
    } catch (error) {
      console.error('Error exporting Google Ad:', error);
    }
  };

  const handleCopyGoogleAd = (ad: Ad) => {
    if (!ad.platform_config) return;

    try {
      const config = JSON.parse(ad.platform_config);
      const formattedText = formatGoogleAdsForCopy(config);
      copyToClipboard(formattedText);
    } catch (error) {
      console.error('Error copying Google Ad:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Saved Ads
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your AI-generated ad variations
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/ads/create/meta')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Ad
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by content or landing page..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">All Platforms</option>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
              </select>
            </div>

            {/* Formula Filter - only show for Meta ads */}
            {platformFilter !== 'google' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formula
                </label>
                <select
                  value={formulaFilter}
                  onChange={(e) => setFormulaFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">All Formulas</option>
                  <option value="PASTOR">PASTOR</option>
                  <option value="Story-Bridge">Story-Bridge</option>
                  <option value="Social Proof">Social Proof</option>
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(platformFilter || formulaFilter || statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setPlatformFilter('');
                setFormulaFilter('');
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Saved Ads
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {ads.length}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Drafts
            </h3>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {ads.filter(ad => ad.status === 'draft').length}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Active Ads
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {ads.filter(ad => ad.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Ads List */}
        {isLoading ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg shadow">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading saved ads...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No saved ads yet. Create your first AI-generated ad!
            </p>
            <button
              onClick={() => router.push('/dashboard/ads/create/meta')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Meta Ad
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => {
              // Parse platform config for Google Ads
              const platformConfig = ad.platform_config ? JSON.parse(ad.platform_config) : null;

              return (
                <div
                  key={ad.id}
                  className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Platform Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        ad.ad_type === 'google'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                      }`}>
                        {ad.ad_type === 'google' ? '📱 Google Ads' : '📘 Meta Ads'}
                      </span>

                      {/* Formula Badge (Meta only) */}
                      {ad.ad_type === 'meta' && ad.ai_prompt && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${FORMULA_COLORS[ad.ai_prompt] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          {ad.ai_prompt}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[ad.status]}`}>
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </span>

                      {/* Word Count (Meta only) */}
                      {ad.ad_type === 'meta' && ad.word_count && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ad.word_count} words
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Landing Page */}
                  {ad.landing_page && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Landing Page: </span>
                      <a
                        href={ad.landing_page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {ad.landing_page}
                      </a>
                    </div>
                  )}

                  {/* Google Ads Campaign Summary */}
                  {ad.ad_type === 'google' && platformConfig ? (
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-4 text-sm">
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
                        {platformConfig.target_keywords && (
                          <>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Keywords: </span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {platformConfig.target_keywords.primary} 🎯
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                          <div className="font-semibold text-purple-900 dark:text-purple-100">
                            {(platformConfig.headlines?.price_focused?.length || 0) +
                             (platformConfig.headlines?.social_proof?.length || 0) +
                             (platformConfig.headlines?.authority?.length || 0)} Headlines
                          </div>
                          <div className="text-purple-700 dark:text-purple-300">3 themes</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          <div className="font-semibold text-blue-900 dark:text-blue-100">
                            {platformConfig.descriptions?.length || 0} Descriptions
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <div className="font-semibold text-green-900 dark:text-green-100">
                            {platformConfig.sitelinks?.length || 0} Sitelinks
                          </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                          <div className="font-semibold text-orange-900 dark:text-orange-100">
                            {platformConfig.callouts?.length || 0} Callouts
                          </div>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded">
                          <div className="font-semibold text-pink-900 dark:text-pink-100">
                            {platformConfig.structured_snippets?.length || 0} Snippets
                          </div>
                        </div>
                      </div>

                      {/* Preview Modal */}
                      {previewAdId === ad.id && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Ad Preview</h4>
                            <button
                              onClick={() => setPreviewAdId(null)}
                              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              ✕
                            </button>
                          </div>
                          <GoogleAdPreview
                            headlines={platformConfig.headlines}
                            descriptions={platformConfig.descriptions}
                            sitelinks={platformConfig.sitelinks || []}
                            callouts={platformConfig.callouts || []}
                            structuredSnippets={platformConfig.structured_snippets || []}
                            landingPageUrl={ad.landing_page || ''}
                            qualityScore={platformConfig.quality_score_prediction?.predicted_score}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Meta Ads Display */
                    <>
                      {/* Hook Preview */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Hook
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {ad.headline}
                        </p>
                      </div>

                      {/* Expandable Full Copy */}
                      {expandedAd === ad.id ? (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Full Copy
                          </h3>
                          <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                              {ad.body_text}
                            </p>
                          </div>
                          <button
                            onClick={() => setExpandedAd(null)}
                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                            {ad.body_text}
                          </p>
                          <button
                            onClick={() => setExpandedAd(ad.id)}
                            className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Show full copy
                          </button>
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Call to Action
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium text-sm">
                          {ad.call_to_action}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex gap-3 flex-wrap">
                    {ad.ad_type === 'google' ? (
                      /* Google Ads Actions */
                      <>
                        <button
                          onClick={() => setPreviewAdId(previewAdId === ad.id ? null : ad.id)}
                          className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {previewAdId === ad.id ? 'Hide Preview' : 'Preview'}
                        </button>
                        <button
                          onClick={() => handleCopyGoogleAd(ad)}
                          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy All
                        </button>
                        <button
                          onClick={() => handleExportGoogleAd(ad)}
                          className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    ) : (
                      /* Meta Ads Actions */
                      <>
                        <button
                          onClick={() => copyToClipboard(ad.body_text)}
                          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                        <button
                          onClick={() => copyToClipboard(`Hook: ${ad.headline}\n\n${ad.body_text}\n\nCTA: ${ad.call_to_action}`)}
                          className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy All
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
