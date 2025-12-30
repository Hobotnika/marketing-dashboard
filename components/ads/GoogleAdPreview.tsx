import { useState } from 'react';

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

interface GoogleAdPreviewProps {
  headlines: {
    price_focused: Headline[];
    social_proof: Headline[];
    authority: Headline[];
  };
  descriptions: Description[];
  sitelinks: Sitelink[];
  callouts: Callout[];
  structuredSnippets: StructuredSnippet[];
  landingPageUrl: string;
  qualityScore?: string;
}

export default function GoogleAdPreview({
  headlines,
  descriptions,
  sitelinks,
  callouts,
  structuredSnippets,
  landingPageUrl,
  qualityScore = '8/10',
}: GoogleAdPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Combine all headlines
  const allHeadlines = [
    ...headlines.price_focused,
    ...headlines.social_proof,
    ...headlines.authority,
  ];

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const domain = getDomain(landingPageUrl);

  // Get first 3 headlines for display
  const displayHeadlines = allHeadlines.slice(0, 3);

  // Get first description
  const displayDescription = descriptions[0];

  // Get first 2 sitelinks
  const displaySitelinks = sitelinks.slice(0, 2);

  // Get first 4 callouts
  const displayCallouts = callouts.slice(0, 4);

  // Get first structured snippet
  const displaySnippet = structuredSnippets[0];

  const extensionCount = [
    sitelinks.length > 0 ? 1 : 0,
    callouts.length > 0 ? 1 : 0,
    structuredSnippets.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-[650px] bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          <div className="flex bg-white border border-gray-300 rounded">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-600">
            Quality Score: <span className="font-semibold text-green-600">{qualityScore}</span> ⭐
          </div>
          <div className="text-xs text-gray-600">
            Extensions: <span className="font-semibold">{extensionCount} types active</span>
          </div>
        </div>
      </div>

      {/* Ad Content */}
      <div className={`p-6 ${viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
        {/* Ad Badge and URL */}
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 bg-white border border-gray-400 text-[10px] font-medium text-gray-700 rounded">
            Ad
          </span>
          <span className="text-sm text-gray-800">{domain}</span>
          <button className="ml-auto">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Headlines */}
        <div className="mb-2">
          <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer leading-tight">
            {displayHeadlines.map((h, i) => (
              <span key={i}>
                {h.text}
                {i < displayHeadlines.length - 1 && ' | '}
              </span>
            ))}
          </h3>
        </div>

        {/* Description */}
        {displayDescription && (
          <div className="mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {displayDescription.text}
            </p>
          </div>
        )}

        {/* Sitelinks */}
        {displaySitelinks.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-3 pt-3 border-t border-gray-200">
            {displaySitelinks.map((sitelink, i) => (
              <div key={i}>
                <div className="text-[#1a0dab] text-sm font-medium hover:underline cursor-pointer mb-0.5">
                  {sitelink.link_text}
                </div>
                <div className="text-xs text-gray-600 leading-tight">
                  {sitelink.description_1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Callouts */}
        {displayCallouts.length > 0 && (
          <div className="mb-2">
            <p className="text-sm text-gray-700">
              {displayCallouts.map((c, i) => (
                <span key={i}>
                  {c.text}
                  {i < displayCallouts.length - 1 && ' · '}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Structured Snippet */}
        {displaySnippet && (
          <div className="mb-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{displaySnippet.header}: </span>
              {displaySnippet.values.slice(0, 3).map((v, i) => (
                <span key={i}>
                  {v.text}
                  {i < Math.min(displaySnippet.values.length, 3) - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Display URL */}
        <div className="text-sm text-gray-600">
          <span className="hover:underline cursor-pointer">
            {domain} › {landingPageUrl.split('/').slice(3, 5).join(' › ')}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Google Search Ad with RSA + Extensions</span>
          <span>{allHeadlines.length} headlines · {descriptions.length} descriptions</span>
        </div>
      </div>
    </div>
  );
}
