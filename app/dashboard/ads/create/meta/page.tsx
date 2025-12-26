'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function MetaAdCreatePage() {
  const router = useRouter();
  const [landingPage, setLandingPage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ landing_page: landingPage }),
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

                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(variation.full_copy);
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                      >
                        Copy to Clipboard
                      </button>
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
