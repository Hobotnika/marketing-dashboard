'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MetaAdPreview from '@/components/ads/MetaAdPreview';

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

export default function MetaAdCreatePage() {
  const router = useRouter();
  const [landingPage, setLandingPage] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedVariations, setSavedVariations] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      // Mark all as saved
      setSavedVariations(new Set(result.variations.map((_, i) => i)));

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
      // Mark this variation as saved
      setSavedVariations(prev => new Set(prev).add(index));

      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
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

                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex gap-3">
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
      </div>
    </div>
  );
}
