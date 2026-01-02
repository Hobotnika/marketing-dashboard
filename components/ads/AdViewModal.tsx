'use client';

import GoogleAdPreview from '@/components/ads/GoogleAdPreview';

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

interface AdViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  variations: Ad[];
  onDuplicate: (ad: Ad) => void;
  onReRate: (ad: Ad) => void;
  onDelete: (adId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'draft': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  'active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  'paused': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  'archived': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const FORMULA_COLORS: Record<string, string> = {
  'PASTOR': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  'Story-Bridge': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'Social Proof': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
};

export default function AdViewModal({
  isOpen,
  onClose,
  variations,
  onDuplicate,
  onReRate,
  onDelete,
}: AdViewModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = async (adId: string) => {
    if (confirm('Are you sure you want to delete this variation?')) {
      await onDelete(adId);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal Container - Scrollable */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ad Variations
                  </h2>
                  {variations[0].landing_page && (
                    <a
                      href={variations[0].landing_page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      {variations[0].landing_page}
                    </a>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {variations.length} variation{variations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {variations.map((ad, index) => {
                  const isGoogle = ad.ad_type === 'google';
                  const platformConfig = isGoogle && ad.platform_config
                    ? JSON.parse(ad.platform_config)
                    : null;

                  return (
                    <div
                      key={ad.id}
                      className="border border-gray-200 dark:border-zinc-800 rounded-lg p-6 bg-gray-50 dark:bg-zinc-800/50"
                    >
                      {/* Variation Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Variation {index + 1}
                          </h3>

                          {/* Formula Badge (Meta only) */}
                          {!isGoogle && ad.ai_prompt && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${FORMULA_COLORS[ad.ai_prompt] || 'bg-gray-100 text-gray-800'}`}>
                              {ad.ai_prompt}
                            </span>
                          )}

                          {/* Status Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ad.status]}`}>
                            {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                          </span>

                          {/* Word Count (Meta only) */}
                          {!isGoogle && ad.word_count && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {ad.word_count} words
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(ad.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content Preview */}
                      {isGoogle && platformConfig ? (
                        <div className="mb-4">
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
                      ) : (
                        /* Meta Ad Display */
                        <div className="space-y-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Headline
                            </h4>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {ad.headline}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Body Copy
                            </h4>
                            <div className="prose dark:prose-invert max-w-none">
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                                {ad.body_text}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Call to Action
                            </h4>
                            <p className="text-gray-900 dark:text-white font-medium text-sm">
                              {ad.call_to_action}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-gray-200 dark:border-zinc-700 flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            if (isGoogle && platformConfig) {
                              const allText = [
                                ...Object.values(platformConfig.headlines || {}).flat().map((h: any) => h.text),
                                ...(platformConfig.descriptions || []).map((d: any) => d.text),
                              ].join('\n\n');
                              copyToClipboard(allText);
                            } else {
                              copyToClipboard(`${ad.headline}\n\n${ad.body_text}\n\n${ad.call_to_action}`);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>

                        <button
                          onClick={() => onDuplicate(ad)}
                          className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Duplicate
                        </button>

                        <button
                          onClick={() => onReRate(ad)}
                          className="flex-1 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Re-rate
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
