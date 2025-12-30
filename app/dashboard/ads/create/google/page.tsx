'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Headline {
  text: string;
  char_count: number;
  keyword_included: boolean;
}

interface Description {
  text: string;
  char_count: number;
  keyword_included: boolean;
  has_cta: boolean;
}

interface Sitelink {
  link_text: string;
  char_count: number;
  description_1: string;
  description_1_chars: number;
  description_2: string;
  description_2_chars: number;
  suggested_url: string;
}

interface Callout {
  text: string;
  char_count: number;
}

interface SnippetValue {
  text: string;
  char_count: number;
}

interface StructuredSnippet {
  header: string;
  values: SnippetValue[];
}

interface GoogleAdResponse {
  analysis: string;
  keyword_integration: {
    primary_keyword: string;
    times_in_headlines: number;
    times_in_descriptions: number;
    times_in_sitelinks: number;
    variations_used: string[];
  };
  quality_score_prediction: {
    expected_ctr: string;
    ad_relevance: string;
    landing_page_experience: string;
    predicted_score: string;
    reasoning: string;
  };
  responsive_search_ad: {
    headlines: {
      price_focused: Headline[];
      social_proof: Headline[];
      authority: Headline[];
    };
    descriptions: Description[];
  };
  sitelinks: Sitelink[];
  callouts: Callout[];
  structured_snippets: StructuredSnippet[];
  ad_preview_score: {
    total_ad_real_estate: string;
    extensions_included: number;
    estimated_ctr_boost: string;
    competitive_advantage: string;
  };
}

export default function GoogleAdCreatePage() {
  const router = useRouter();
  const [landingPage, setLandingPage] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [matchType, setMatchType] = useState<'broad' | 'phrase' | 'exact'>('broad');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GoogleAdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    const keyword = secondaryKeywordInput.trim();
    if (keyword && !secondaryKeywords.includes(keyword) && secondaryKeywords.length < 5) {
      setSecondaryKeywords([...secondaryKeywords, keyword]);
      setSecondaryKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setSecondaryKeywords(secondaryKeywords.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!landingPage.trim() || !primaryKeyword.trim()) {
      setError('Please enter both landing page URL and primary keyword');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/generate-google-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing_page: landingPage,
          primary_keyword: primaryKeyword,
          secondary_keywords: secondaryKeywords,
          match_type: matchType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ad campaign');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getCharCountColor = (count: number, max: number) => {
    if (count > max) return 'text-red-600 dark:text-red-400';
    if (count > max - 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
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
            Create Google Search Ad with AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate complete RSA campaign with all extensions (Sitelinks, Callouts, Structured Snippets)
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 mb-8">
          <div className="space-y-4">
            {/* Landing Page URL */}
            <div>
              <label
                htmlFor="landing-page"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Landing Page URL *
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

            {/* Primary Keyword */}
            <div>
              <label
                htmlFor="primary-keyword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Primary Keyword *
              </label>
              <input
                id="primary-keyword"
                type="text"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g., AI marketing tools"
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                disabled={isLoading}
              />
            </div>

            {/* Secondary Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Keywords (Optional, max 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={secondaryKeywordInput}
                  onChange={(e) => setSecondaryKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="e.g., marketing automation"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  disabled={isLoading || secondaryKeywords.length >= 5}
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={isLoading || secondaryKeywords.length >= 5 || !secondaryKeywordInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {secondaryKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {secondaryKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="hover:text-blue-600 dark:hover:text-blue-200"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Match Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Type (Informational)
              </label>
              <div className="flex gap-4">
                {(['broad', 'phrase', 'exact'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={type}
                      checked={matchType === type}
                      onChange={(e) => setMatchType(e.target.value as typeof matchType)}
                      className="text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
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
                  Generating Complete Campaign...
                </>
              ) : (
                'Generate Complete Ad Campaign'
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
                Campaign Analysis
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {result.analysis}
              </p>

              {/* Quality Score */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.quality_score_prediction.predicted_score}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ad Real Estate</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.ad_preview_score.total_ad_real_estate}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Keyword Integration</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.keyword_integration.times_in_headlines +
                     result.keyword_integration.times_in_descriptions}/20
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Est. CTR Boost</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.ad_preview_score.estimated_ctr_boost}
                  </div>
                </div>
              </div>
            </div>

            {/* Responsive Search Ad */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Responsive Search Ad (15 Headlines + 5 Descriptions)
              </h2>

              {/* Headlines */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-purple-600 dark:text-purple-400">Price-Focused Headlines (5)</h3>
                <div className="grid gap-2">
                  {result.responsive_search_ad.headlines.price_focused.map((headline, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded">
                      <span className="text-gray-900 dark:text-white">{headline.text}</span>
                      <span className={`text-sm font-mono ${getCharCountColor(headline.char_count, 30)}`}>
                        {headline.char_count}/30
                      </span>
                    </div>
                  ))}
                </div>

                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mt-6">Social Proof Headlines (5)</h3>
                <div className="grid gap-2">
                  {result.responsive_search_ad.headlines.social_proof.map((headline, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded">
                      <span className="text-gray-900 dark:text-white">{headline.text}</span>
                      <span className={`text-sm font-mono ${getCharCountColor(headline.char_count, 30)}`}>
                        {headline.char_count}/30
                      </span>
                    </div>
                  ))}
                </div>

                <h3 className="font-semibold text-green-600 dark:text-green-400 mt-6">Authority Headlines (5)</h3>
                <div className="grid gap-2">
                  {result.responsive_search_ad.headlines.authority.map((headline, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded">
                      <span className="text-gray-900 dark:text-white">{headline.text}</span>
                      <span className={`text-sm font-mono ${getCharCountColor(headline.char_count, 30)}`}>
                        {headline.char_count}/30
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Descriptions (5)</h3>
              <div className="grid gap-2">
                {result.responsive_search_ad.descriptions.map((desc, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-start justify-between">
                      <span className="text-gray-900 dark:text-white flex-1">{desc.text}</span>
                      <span className={`text-sm font-mono ml-4 ${getCharCountColor(desc.char_count, 90)}`}>
                        {desc.char_count}/90
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {desc.has_cta && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Has CTA
                        </span>
                      )}
                      {desc.keyword_included && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          Keyword ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sitelink Extensions */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🔗 Sitelink Extensions ({result.sitelinks.length})
              </h2>
              <div className="grid gap-4">
                {result.sitelinks.map((sitelink, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{sitelink.link_text}</span>
                      <span className={`text-sm font-mono ${getCharCountColor(sitelink.char_count, 25)}`}>
                        {sitelink.char_count}/25
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{sitelink.description_1}</span>
                        <span className={`text-xs font-mono ${getCharCountColor(sitelink.description_1_chars, 35)}`}>
                          {sitelink.description_1_chars}/35
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{sitelink.description_2}</span>
                        <span className={`text-xs font-mono ${getCharCountColor(sitelink.description_2_chars, 35)}`}>
                          {sitelink.description_2_chars}/35
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        URL: {sitelink.suggested_url}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Callout Extensions */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                💡 Callout Extensions ({result.callouts.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.callouts.map((callout, i) => (
                  <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span>{callout.text}</span>
                    <span className={`text-xs font-mono ${getCharCountColor(callout.char_count, 25)}`}>
                      {callout.char_count}/25
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Snippets */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📋 Structured Snippets ({result.structured_snippets.length})
              </h2>
              <div className="space-y-4">
                {result.structured_snippets.map((snippet, i) => (
                  <div key={i}>
                    <div className="font-semibold text-gray-900 dark:text-white mb-2">{snippet.header}:</div>
                    <div className="flex flex-wrap gap-2">
                      {snippet.values.map((value, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 rounded border border-purple-200 dark:border-purple-800"
                        >
                          {value.text}
                          <span className={`text-xs font-mono ${getCharCountColor(value.char_count, 25)}`}>
                            {value.char_count}/25
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
