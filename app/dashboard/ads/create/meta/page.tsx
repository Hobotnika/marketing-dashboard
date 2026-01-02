'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MetaAdPreview from '@/components/ads/MetaAdPreview';
import RatingProgressModal from '@/components/ads/RatingProgressModal';
import RatingResults from '@/components/ads/RatingResults';

interface AdVariation {
  formula: string;
  hook: string;
  full_copy: string;
  cta: string;
  word_count: number;
}

interface GenerateResponse {
  analysis: string;
  variations: AdVariation[];
}

interface AiPrompt {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface AvatarSet {
  setName: string;
  niche: string;
  count: number;
}

interface AvatarStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed';
  time?: number;
}

interface RatingResults {
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

export default function MetaAdCreatePage() {
  const router = useRouter();
  const [landingPage, setLandingPage] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Map: variationIndex -> actual database ID
  const [savedVariations, setSavedVariations] = useState<Map<number, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Avatar Rating State
  const [avatarSets, setAvatarSets] = useState<AvatarSet[]>([]);
  const [selectedAvatarSet, setSelectedAvatarSet] = useState<string>('');
  const [isRating, setIsRating] = useState(false);
  const [ratingProgress, setRatingProgress] = useState<{
    completed: number;
    total: number;
    avatars: AvatarStatus[];
  }>({ completed: 0, total: 0, avatars: [] });
  const [ratingResults, setRatingResults] = useState<RatingResults | null>(null);
  const [showRatingResults, setShowRatingResults] = useState(false);
  const [ratingVariationIndex, setRatingVariationIndex] = useState<number | null>(null);
  const [ratedAdId, setRatedAdId] = useState<string>('');
  const [ratedAdCopy, setRatedAdCopy] = useState<string>('');

  useEffect(() => {
    // Fetch available prompts for Meta Ads
    fetch('/api/prompts?category=meta_ads')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPrompts(data.data);
        }
      })
      .catch(err => console.error('Failed to load prompts:', err));

    // Fetch available avatar sets
    fetch('/api/avatars')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvatarSets(data.avatarSets || []);
        }
      })
      .catch(err => console.error('Failed to load avatar sets:', err));

    // Check for duplication parameter
    const params = new URLSearchParams(window.location.search);
    const duplicateId = params.get('duplicate');

    if (duplicateId) {
      fetch(`/api/ads/${duplicateId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data.ad_type === 'meta') {
            const ad = data.data;
            setLandingPage(ad.landing_page || '');
            // Show notification
            const createdDate = new Date(ad.createdAt).toLocaleDateString();
            alert(`📋 Duplicating Meta Ad from ${createdDate}\n\nLanding page has been pre-filled. Click "Generate Variations" to create new ad copy.`);
          }
        })
        .catch(err => console.error('Failed to load ad for duplication:', err));
    }
  }, []);

  const handleGenerate = async () => {
    if (!landingPage.trim()) {
      setError('Please enter a landing page URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/generate-meta-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing_page: landingPage,
          prompt_id: selectedPromptId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ad variations');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!result) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variations: result.variations,
          landing_page: landingPage,
          ad_type: 'meta',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save ads');
      }

      setSaveSuccess(data.message);

      // Store real database IDs for each variation
      if (data.data && Array.isArray(data.data)) {
        setSavedVariations(prev => {
          const newMap = new Map(prev);
          data.data.forEach((savedAd: any, index: number) => {
            if (savedAd.id) {
              newMap.set(index, savedAd.id); // ✅ Real database ID
              console.log(`[Save] Variation ${index} saved with ID:`, savedAd.id);
            }
          });
          return newMap;
        });
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVariation = async (index: number) => {
    if (!result) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const variation = result.variations[index];
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variations: [variation],
          landing_page: landingPage,
          ad_type: 'meta',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save ad');
      }

      setSaveSuccess(`Saved "${variation.formula}" variation`);

      // Store real database ID for this variation
      if (data.data && Array.isArray(data.data) && data.data[0]?.id) {
        const realAdId = data.data[0].id;
        setSavedVariations(prev => {
          const newMap = new Map(prev);
          newMap.set(index, realAdId); // ✅ Real database ID
          return newMap;
        });
        console.log(`[Save] Variation ${index} saved with real ID:`, realAdId);
      }

      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRateAd = async (variationIndex: number) => {
    if (!selectedAvatarSet || !result) return;

    // Check if ad is saved first
    if (!savedVariations.has(variationIndex)) {
      setSaveError('Please save this ad variation before rating');
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    // Get the REAL database ID
    const realAdId = savedVariations.get(variationIndex)!;

    console.log('[Frontend] Rating ad with REAL ID:', realAdId);
    console.log('[Frontend] Variation index:', variationIndex);
    console.log('[Frontend] Avatar set:', selectedAvatarSet);

    if (!selectedAvatarSet) {
      setSaveError('Please select an avatar set first');
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    const variation = result.variations[variationIndex];
    const adCopy = `${variation.hook}\n\n${variation.full_copy}\n\n${variation.cta}`;

    setIsRating(true);
    setRatingVariationIndex(variationIndex);
    setShowRatingResults(false);
    setRatingProgress({ completed: 0, total: 13, avatars: [] });

    // Capture the ad ID and copy for synthesis
    setRatedAdId(realAdId);
    setRatedAdCopy(adCopy);

    try {
      // Note: We're not implementing real-time progress updates in this version
      // In production, you could use Server-Sent Events (SSE) or polling for real-time updates

      // Use the REAL database ID
      const response = await fetch(`/api/ads/${realAdId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarSetName: selectedAvatarSet,
          adCopy,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to rate ad');
      }

      setRatingResults(data);
      setShowRatingResults(true);
    } catch (error) {
      console.error('Rating failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to rate ad');
    } finally {
      setIsRating(false);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Meta Ad with AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate long-form ad copy variations using AI
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 mb-8">
          <div className="space-y-4">
            {/* AI Prompt Template Selector */}
            <div>
              <label
                htmlFor="prompt-selector"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                AI Prompt Template (Optional)
              </label>
              <select
                id="prompt-selector"
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                disabled={isLoading}
              >
                <option value="">Use Default</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose a specialized prompt template or use the default.{' '}
                <Link
                  href="/dashboard/settings/prompts"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage prompts
                </Link>
              </p>
            </div>

            <div>
              <label
                htmlFor="landing-page"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Landing Page URL
              </label>
              <input
                id="landing-page"
                type="url"
                value={landingPage}
                onChange={(e) => setLandingPage(e.target.value)}
                placeholder="https://example.com/landing-page"
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating Variations...
                </>
              ) : (
                'Generate Variations'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Analysis */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Analysis
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.analysis}
              </p>
            </div>

            {/* Save All Button */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Save these variations to your library
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Save all {result.variations.length} variations as drafts for later use
                </p>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={isSaving || savedVariations.size === result.variations.length}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savedVariations.size === result.variations.length ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All Saved
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {isSaving ? 'Saving...' : 'Save All Variations'}
                  </>
                )}
              </button>
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {saveSuccess}
              </div>
            )}

            {saveError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {saveError}
              </div>
            )}

            {/* Avatar Rating Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  Boost Ad Quality with Avatar Rating
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Get feedback from 13 customer personas to understand how your target audience would react to each variation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Avatar Set
                  </label>
                  <select
                    value={selectedAvatarSet}
                    onChange={(e) => setSelectedAvatarSet(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-zinc-800 dark:text-white"
                    disabled={isRating}
                  >
                    <option value="">Choose avatar set...</option>
                    {avatarSets.map(set => (
                      <option key={set.setName} value={set.setName}>
                        {set.setName} ({set.count} avatars)
                      </option>
                    ))}
                  </select>
                  {!selectedAvatarSet && avatarSets.length === 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Don't have avatars yet?{' '}
                      <Link
                        href="/dashboard/settings/avatars/create"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Create avatar set
                      </Link>
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    📊 Rate variations individually below to see how each persona responds to different copy styles.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Processing time: 30-60 seconds per variation
                  </div>
                </div>
              </div>
            </div>

            {/* Variations */}
            <div className="space-y-6">
              {result.variations.map((variation, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Variation {index + 1}: {variation.formula}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {variation.word_count} words
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Hook
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {variation.hook}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Full Copy
                      </h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {variation.full_copy}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Call to Action
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {variation.cta}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(variation.full_copy);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          onClick={() => handleSaveVariation(index)}
                          disabled={isSaving || savedVariations.has(index)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {savedVariations.has(index) ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Saved
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Save
                            </>
                          )}
                        </button>
                      </div>

                      {/* Rate This Ad Button */}
                      <button
                        onClick={() => handleRateAd(index)}
                        disabled={!savedVariations.has(index) || !selectedAvatarSet || isRating}
                        className={`w-full px-4 py-3 ${
                          savedVariations.has(index)
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        } text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        <span className="text-lg">{savedVariations.has(index) ? '⚡' : '💾'}</span>
                        {isRating && ratingVariationIndex === index
                          ? 'Rating in Progress...'
                          : savedVariations.has(index)
                          ? 'Rate This Ad with Avatars'
                          : 'Save First to Rate'}
                      </button>

                      {/* Save requirement hint */}
                      {!savedVariations.has(index) && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                          <span>💡</span>
                          <span>Save this variation first before rating</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Facebook-style Ad Preview */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-800">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                      Facebook Ad Preview
                    </h3>
                    <div className="flex justify-center">
                      <MetaAdPreview
                        adCopy={variation.full_copy}
                        headline={variation.hook}
                        cta={variation.cta}
                        landingPageUrl={landingPage}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Progress Modal */}
        <RatingProgressModal
          isOpen={isRating}
          avatarStatuses={ratingProgress.avatars}
          completedCount={ratingProgress.completed}
          totalAvatars={ratingProgress.total}
        />

        {/* Rating Results Modal */}
        {showRatingResults && ratingResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="my-8">
              <RatingResults
                summary={ratingResults.summary}
                feedbacks={ratingResults.feedbacks}
                onClose={() => setShowRatingResults(false)}
                adId={ratedAdId}
                originalAdCopy={ratedAdCopy}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
