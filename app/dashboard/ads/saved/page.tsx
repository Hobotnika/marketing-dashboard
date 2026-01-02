'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdGroupCard from '@/components/ads/AdGroupCard';
import AdViewModal from '@/components/ads/AdViewModal';
import RatingSetupModal from '@/components/ads/RatingSetupModal';
import DateRangePicker from '@/components/ads/DateRangePicker';
import RatingProgressModal from '@/components/ads/RatingProgressModal';
import RatingResults from '@/components/ads/RatingResults';

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

interface AdGroup {
  landingPage: string | null;
  adType: 'meta' | 'google';
  variations: Ad[];
}

interface AvatarStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed';
}

interface RatingResultsData {
  summary: {
    totalAvatars: number;
    positive: number;
    mixed: number;
    negative: number;
    processingTimeMs: number;
  };
  feedbacks: Array<{
    avatarName: string;
    feedback: string;
    sentiment: 'positive' | 'mixed' | 'negative';
    processing_time: number;
    demographics: {
      age: number;
      gender: string;
      location: string;
      income: string;
    };
  }>;
}

export default function SavedAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [formulaFilter, setFormulaFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [viewModalVariations, setViewModalVariations] = useState<Ad[] | null>(null);
  const [ratingSetupAd, setRatingSetupAd] = useState<Ad | null>(null);
  const [isRatingInProgress, setIsRatingInProgress] = useState(false);
  const [ratingProgress, setRatingProgress] = useState<{
    completed: number;
    total: number;
    avatars: AvatarStatus[];
  }>({ completed: 0, total: 0, avatars: [] });
  const [ratingResults, setRatingResults] = useState<RatingResultsData | null>(null);
  const [ratedAdId, setRatedAdId] = useState<string>('');
  const [ratedAdCopy, setRatedAdCopy] = useState<string>('');

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
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [platformFilter, formulaFilter, statusFilter, searchQuery]);

  // Grouping logic
  const groupAdsByCampaign = (ads: Ad[]): AdGroup[] => {
    const groups = new Map<string, Ad[]>();

    ads.forEach(ad => {
      const key = `${ad.landing_page || 'no-landing-page'}_${ad.ad_type}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ad);
    });

    return Array.from(groups.values()).map(variations => ({
      landingPage: variations[0].landing_page,
      adType: variations[0].ad_type,
      variations: variations.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
  };

  // Apply date filtering
  const dateFilteredAds = ads.filter(ad => {
    const adDate = new Date(ad.createdAt);
    if (dateRange.start && adDate < dateRange.start) return false;
    if (dateRange.end && adDate > dateRange.end) return false;
    return true;
  });

  // Apply sorting
  const sortedAds = [...dateFilteredAds].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'status':
        const statusOrder = { active: 0, draft: 1, paused: 2, archived: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });

  // Group ads
  const groupedCampaigns = groupAdsByCampaign(sortedAds);

  // Pagination
  const totalPages = Math.ceil(groupedCampaigns.length / itemsPerPage);
  const paginatedCampaigns = groupedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (adId: string) => {
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

  const handleDuplicate = (ad: Ad) => {
    const createUrl = ad.ad_type === 'meta'
      ? '/dashboard/ads/create/meta'
      : '/dashboard/ads/create/google';

    router.push(`${createUrl}?duplicate=${ad.id}`);
  };

  const handleStartRating = async (ad: Ad, avatarSetName: string) => {
    setIsRatingInProgress(true);
    setRatingSetupAd(null); // Close setup modal
    setRatedAdId(ad.id);
    setRatedAdCopy(ad.body_text);

    try {
      // Fetch avatars for the set
      const avatarsRes = await fetch(`/api/avatars/sets/${encodeURIComponent(avatarSetName)}`);
      const avatarsData = await avatarsRes.json();

      if (!avatarsData.success) {
        throw new Error('Failed to fetch avatars');
      }

      const avatars = avatarsData.data;

      // Initialize progress
      setRatingProgress({
        completed: 0,
        total: avatars.length,
        avatars: avatars.map((a: any) => ({ name: a.avatarName, status: 'pending' as const }))
      });

      // Call rating API
      const response = await fetch(`/api/ads/${ad.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarSetName })
      });

      if (!response.ok) {
        throw new Error('Rating failed');
      }

      const result = await response.json();
      setRatingResults(result.data);

    } catch (error) {
      console.error('Rating error:', error);
      alert('Failed to rate ad. Please try again.');
    } finally {
      setIsRatingInProgress(false);
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
                Saved Ads Library
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your AI-generated ad campaigns
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

            {/* Formula Filter */}
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

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Clear Filters */}
          {(platformFilter || formulaFilter || statusFilter || searchQuery || dateRange.start) && (
            <button
              onClick={() => {
                setPlatformFilter('');
                setFormulaFilter('');
                setStatusFilter('');
                setSearchQuery('');
                setDateRange({ start: null, end: null });
              }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Campaigns
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {groupedCampaigns.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {ads.length} total ads
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

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Page
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {currentPage} of {totalPages || 1}
            </p>
          </div>
        </div>

        {/* Ads Grid */}
        {isLoading ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg shadow">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        ) : groupedCampaigns.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No campaigns found. {(platformFilter || formulaFilter || statusFilter || searchQuery || dateRange.start) ? 'Try adjusting your filters.' : 'Create your first AI-generated ad!'}
            </p>
            {!platformFilter && !formulaFilter && !statusFilter && !searchQuery && !dateRange.start && (
              <button
                onClick={() => router.push('/dashboard/ads/create/meta')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Meta Ad
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedCampaigns.map((campaign, index) => (
                <AdGroupCard
                  key={`${campaign.landingPage}_${campaign.adType}_${index}`}
                  landingPage={campaign.landingPage}
                  adType={campaign.adType}
                  variations={campaign.variations}
                  onView={(vars) => setViewModalVariations(vars)}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onReRate={(ad) => setRatingSetupAd(ad)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages} ({groupedCampaigns.length} campaigns)
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {viewModalVariations && (
        <AdViewModal
          isOpen={!!viewModalVariations}
          onClose={() => setViewModalVariations(null)}
          variations={viewModalVariations}
          onDuplicate={handleDuplicate}
          onReRate={(ad) => {
            setViewModalVariations(null);
            setRatingSetupAd(ad);
          }}
          onDelete={async (id) => {
            await handleDelete(id);
            // Refresh the view modal if there are still variations
            const remaining = viewModalVariations.filter(v => v.id !== id);
            if (remaining.length > 0) {
              setViewModalVariations(remaining);
            } else {
              setViewModalVariations(null);
            }
            fetchAds();
          }}
        />
      )}

      {ratingSetupAd && (
        <RatingSetupModal
          isOpen={!!ratingSetupAd}
          onClose={() => setRatingSetupAd(null)}
          adId={ratingSetupAd.id}
          adCopy={ratingSetupAd.body_text}
          onRatingStart={(setName) => handleStartRating(ratingSetupAd, setName)}
        />
      )}

      {isRatingInProgress && (
        <RatingProgressModal
          isOpen={isRatingInProgress}
          completed={ratingProgress.completed}
          total={ratingProgress.total}
          avatars={ratingProgress.avatars}
        />
      )}

      {ratingResults && (
        <RatingResults
          summary={ratingResults.summary}
          feedbacks={ratingResults.feedbacks}
          adId={ratedAdId}
          originalAdCopy={ratedAdCopy}
          onClose={() => setRatingResults(null)}
        />
      )}
    </div>
  );
}
