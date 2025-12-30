import { useState } from 'react';

interface MetaAdPreviewProps {
  businessName?: string;
  adCopy: string;
  headline?: string;
  cta?: string;
  landingPageUrl?: string;
}

export default function MetaAdPreview({
  businessName = 'Your Business',
  adCopy,
  headline,
  cta = 'Learn More',
  landingPageUrl = 'example.com',
}: MetaAdPreviewProps) {
  const [showFullCopy, setShowFullCopy] = useState(false);

  // Truncate ad copy to 200 characters
  const shouldTruncate = adCopy.length > 200;
  const displayCopy = shouldTruncate && !showFullCopy
    ? adCopy.substring(0, 200) + '...'
    : adCopy;

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="max-w-[500px] bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-gray-900">{businessName}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Sponsored</span>
            <span>•</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button className="text-gray-500 hover:bg-gray-100 rounded-full p-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Ad Copy */}
      <div className="px-3 pb-3">
        <p className="text-sm text-gray-900 whitespace-pre-wrap">
          {displayCopy}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullCopy(!showFullCopy)}
            className="text-sm text-gray-600 hover:underline mt-1 font-medium"
          >
            {showFullCopy ? 'See Less' : 'See More'}
          </button>
        )}
      </div>

      {/* Image Placeholder */}
      <div className="bg-gray-200 h-[240px] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">Ad Image (320x240)</p>
        </div>
      </div>

      {/* Link Preview Card */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="text-xs text-gray-500 uppercase mb-1">
          {getDomain(landingPageUrl || '')}
        </div>
        {headline && (
          <div className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
            {headline}
          </div>
        )}
        <button className="mt-2 w-full px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold rounded transition-colors">
          {cta}
        </button>
      </div>

      {/* Engagement Bar */}
      <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between text-gray-600">
        <button className="flex items-center gap-1 hover:bg-gray-100 rounded px-2 py-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="text-xs font-medium">Like</span>
        </button>
        <button className="flex items-center gap-1 hover:bg-gray-100 rounded px-2 py-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-1 hover:bg-gray-100 rounded px-2 py-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>
    </div>
  );
}
