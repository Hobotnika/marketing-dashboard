'use client';

import { useState } from 'react';

interface AvatarFeedback {
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
}

interface RatingSummary {
  totalAvatars: number;
  positive: number;
  mixed: number;
  negative: number;
  processingTimeMs: number;
}

interface RatingResultsProps {
  summary: RatingSummary;
  feedbacks: AvatarFeedback[];
  onClose: () => void;
  adId: string;
  originalAdCopy: string;
}

export default function RatingResults({ summary, feedbacks, onClose, adId, originalAdCopy }: RatingResultsProps) {
  const [expandedAvatars, setExpandedAvatars] = useState<Set<string>>(new Set());
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResults, setSynthesisResults] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);

  const toggleAvatar = (avatarName: string) => {
    const newExpanded = new Set(expandedAvatars);
    if (newExpanded.has(avatarName)) {
      newExpanded.delete(avatarName);
    } else {
      newExpanded.add(avatarName);
    }
    setExpandedAvatars(newExpanded);
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const response = await fetch(`/api/ads/${adId}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbacks: feedbacks.map(f => ({
            avatarName: f.avatarName,
            feedback: f.feedback,
            sentiment: f.sentiment
          })),
          originalAdCopy: originalAdCopy
        })
      });

      if (!response.ok) {
        throw new Error('Synthesis failed');
      }

      const data = await response.json();
      setSynthesisResults(data.data);
    } catch (error) {
      console.error('[Synthesis] Error:', error);
      alert('Failed to synthesize optimized versions. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePredict = async () => {
    if (!synthesisResults) {
      alert('Please run copywriter synthesis first');
      return;
    }

    setIsPredicting(true);

    try {
      const response = await fetch(`/api/ads/${adId}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbacks: feedbacks.map(f => ({
            avatarName: f.avatarName,
            feedback: f.feedback,
            sentiment: f.sentiment
          })),
          optimizedVersions: synthesisResults.optimizedVersions
        })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();

      if (data.success) {
        setPredictionResults(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('[Prediction] Error:', error);
      alert('Failed to predict winning version. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-500',
          text: 'text-green-700 dark:text-green-400',
        };
      case 'negative':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500',
          text: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-500',
          text: 'text-yellow-700 dark:text-yellow-400',
        };
    }
  };

  // Group feedbacks by sentiment
  const positiveFeedbacks = feedbacks.filter(f => f.sentiment === 'positive');
  const mixedFeedbacks = feedbacks.filter(f => f.sentiment === 'mixed');
  const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal Container - Centered, Scrollable */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">

          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky at top */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  🎯 Avatar Rating Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Feedback from {summary.totalAvatars} customer personas
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

            {/* Scrollable Content */}
            <div className="px-6 py-6">

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {summary.positive}
          </div>
          <div className="text-sm font-medium text-green-700 dark:text-green-300">
            Loved It 😊
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {Math.round((summary.positive / summary.totalAvatars) * 100)}%
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            {summary.mixed}
          </div>
          <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Mixed Feelings 😐
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            {Math.round((summary.mixed / summary.totalAvatars) * 100)}%
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
            {summary.negative}
          </div>
          <div className="text-sm font-medium text-red-700 dark:text-red-300">
            Not Convinced 😞
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {Math.round((summary.negative / summary.totalAvatars) * 100)}%
          </div>
        </div>
      </div>

      {/* Individual Feedbacks */}
      <div className="space-y-6">
        {/* Positive Feedbacks */}
        {positiveFeedbacks.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <span className="text-xl">😊</span>
              Positive Feedback ({positiveFeedbacks.length})
            </h4>
            <div className="space-y-3">
              {positiveFeedbacks.map((fb) => {
                const colors = getSentimentColor(fb.sentiment);
                const isExpanded = expandedAvatars.has(fb.avatarName);

                return (
                  <div
                    key={fb.avatarName}
                    className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => toggleAvatar(fb.avatarName)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fb.avatarName}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-3">
                          {fb.demographics.age}yo {fb.demographics.gender},{' '}
                          {fb.demographics.income}
                        </span>
                      </div>
                      <span className="text-2xl">{getSentimentEmoji(fb.sentiment)}</span>
                    </div>

                    <p className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!isExpanded && 'line-clamp-2'}`}>
                      {fb.feedback}
                    </p>

                    {fb.feedback.length > 150 && (
                      <button className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mixed Feedbacks */}
        {mixedFeedbacks.length > 0 && (
          <div>
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
              <span className="text-xl">😐</span>
              Mixed Feedback ({mixedFeedbacks.length})
            </h4>
            <div className="space-y-3">
              {mixedFeedbacks.map((fb) => {
                const colors = getSentimentColor(fb.sentiment);
                const isExpanded = expandedAvatars.has(fb.avatarName);

                return (
                  <div
                    key={fb.avatarName}
                    className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => toggleAvatar(fb.avatarName)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fb.avatarName}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-3">
                          {fb.demographics.age}yo {fb.demographics.gender},{' '}
                          {fb.demographics.income}
                        </span>
                      </div>
                      <span className="text-2xl">{getSentimentEmoji(fb.sentiment)}</span>
                    </div>

                    <p className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!isExpanded && 'line-clamp-2'}`}>
                      {fb.feedback}
                    </p>

                    {fb.feedback.length > 150 && (
                      <button className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Negative Feedbacks */}
        {negativeFeedbacks.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <span className="text-xl">😞</span>
              Negative Feedback ({negativeFeedbacks.length})
            </h4>
            <div className="space-y-3">
              {negativeFeedbacks.map((fb) => {
                const colors = getSentimentColor(fb.sentiment);
                const isExpanded = expandedAvatars.has(fb.avatarName);

                return (
                  <div
                    key={fb.avatarName}
                    className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => toggleAvatar(fb.avatarName)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fb.avatarName}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-3">
                          {fb.demographics.age}yo {fb.demographics.gender},{' '}
                          {fb.demographics.income}
                        </span>
                      </div>
                      <span className="text-2xl">{getSentimentEmoji(fb.sentiment)}</span>
                    </div>

                    <p className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!isExpanded && 'line-clamp-2'}`}>
                      {fb.feedback}
                    </p>

                    {fb.feedback.length > 150 && (
                      <button className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Copywriter Synthesis Button */}
      {!synthesisResults && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Want to improve this ad based on avatar feedback?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Our AI copywriter will analyze all {feedbacks.length} avatar responses and create 3 optimized versions
            </p>
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSynthesizing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Synthesizing with Claude...
                </>
              ) : (
                <>🤖 Generate Optimized Versions</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Synthesis Results Display */}
      {synthesisResults && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🤖 AI Copywriter Synthesis
            </h3>

            {/* Internal Memo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                📝 Internal Team Memo
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {synthesisResults.internalMemo}
              </p>
            </div>

            {/* Key Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                💡 Key Insights from Avatar Feedback
              </h4>
              <ul className="space-y-2">
                {synthesisResults.keyInsights?.map((insight: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optimized Versions */}
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                ✨ 3 Optimized Ad Versions
              </h4>

              {synthesisResults.optimizedVersions?.map((version: any, i: number) => {
                // Detect ad type by checking if version has headlines array (Google) or headline string (Meta)
                const isGoogleAd = Array.isArray(version.headlines);

                return (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-5 border-l-4 border-purple-500">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                          Version {version.versionNumber}
                        </span>
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {isGoogleAd ? `Google Search Ad - ${version.strategyFocus}` : version.headline}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Strategy: {version.strategyFocus}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (isGoogleAd) {
                            const copyText = `Headlines:\n${version.headlines.join('\n')}\n\nDescriptions:\n${version.descriptions.join('\n')}`;
                            navigator.clipboard.writeText(copyText);
                          } else {
                            navigator.clipboard.writeText(`${version.headline}\n\n${version.bodyCopy}`);
                          }
                          alert('✅ Copied to clipboard!');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex-shrink-0"
                      >
                        📋 Copy
                      </button>
                    </div>

                    {isGoogleAd ? (
                      // Google Ads Display
                      <div className="space-y-4">
                        {/* Headlines */}
                        <div>
                          <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                            Headlines (3)
                          </h6>
                          <div className="space-y-1">
                            {version.headlines.map((headline: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">H{idx + 1}:</span>
                                <span className="flex-1 text-sm text-gray-900 dark:text-white">{headline}</span>
                                <span className={`text-xs font-mono ${
                                  headline.length > 30 ? 'text-red-600 dark:text-red-400' :
                                  headline.length > 27 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {headline.length}/30
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div>
                          <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                            Descriptions (2)
                          </h6>
                          <div className="space-y-1">
                            {version.descriptions.map((desc: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">D{idx + 1}:</span>
                                <span className="flex-1 text-sm text-gray-900 dark:text-white">{desc}</span>
                                <span className={`text-xs font-mono flex-shrink-0 ${
                                  desc.length > 90 ? 'text-red-600 dark:text-red-400' :
                                  desc.length > 85 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {desc.length}/90
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Meta Ads Display (original)
                      <>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {version.bodyCopy}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          {version.bodyCopy.split(' ').length} words
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prediction Engine Button */}
            {!predictionResults && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <button
                  onClick={handlePredict}
                  disabled={isPredicting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isPredicting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>AI Analyst Scoring Versions...</span>
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      <span>Score & Pick Winner (Prediction Engine)</span>
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
                  AI will score each version 0-100% and predict the winner
                </p>
              </div>
            )}

            {/* Prediction Results */}
            {predictionResults && (
              <div className="mt-8 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Prediction Engine Results</span>
                </h3>

                {/* Version Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictionResults.scores?.map((score: any) => (
                    <div
                      key={score.versionNumber}
                      className={`border rounded-lg p-6 ${
                        score.versionNumber === predictionResults.winner?.versionNumber
                          ? 'border-green-500 bg-green-900/20 dark:bg-green-900/30'
                          : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Version {score.versionNumber}
                        </span>
                        {score.versionNumber === predictionResults.winner?.versionNumber && (
                          <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                            👑 WINNER
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                          {score.score}%
                        </div>
                        <div className={`text-sm font-medium ${
                          score.score >= 70 ? 'text-green-600 dark:text-green-400' :
                          score.score >= 50 ? 'text-blue-600 dark:text-blue-400' :
                          score.score >= 30 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {score.category}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {score.briefReason}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Winning Version */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">👑</span>
                    <h4 className="text-xl font-bold text-green-700 dark:text-green-400">
                      Winning Ad - Version {predictionResults.winner?.versionNumber} ({predictionResults.winner?.score}%)
                    </h4>
                  </div>

                  <div className="bg-white dark:bg-black/30 border border-green-400 dark:border-green-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>Why it wins:</strong> {predictionResults.winner?.whyItWins}
                    </p>
                  </div>

                  {Array.isArray(predictionResults.winner?.headlines) ? (
                    // Google Ads Winner Display
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Winning Headlines:</p>
                          <button
                            onClick={() => {
                              const copyText = `Headlines:\n${predictionResults.winner.headlines.join('\n')}\n\nDescriptions:\n${predictionResults.winner.descriptions.join('\n')}`;
                              navigator.clipboard.writeText(copyText);
                              alert('✅ Copied winning ad to clipboard!');
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                          >
                            📋 Copy to Clipboard
                          </button>
                        </div>
                        <div className="space-y-2">
                          {predictionResults.winner.headlines.map((headline: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">H{idx + 1}:</span>
                              <span className="flex-1 font-medium text-gray-900 dark:text-white">{headline}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {headline.length}/30
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-2">Winning Descriptions:</p>
                        <div className="space-y-2">
                          {predictionResults.winner.descriptions.map((desc: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">D{idx + 1}:</span>
                              <span className="flex-1 text-sm text-gray-900 dark:text-white">{desc}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                                {desc.length}/90
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Meta Ads Winner Display (original)
                    <>
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-2">Winning Headline:</p>
                        <p className="font-bold text-xl text-gray-900 dark:text-white mb-4">
                          {predictionResults.winner?.headline}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Winning Ad Copy:</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${predictionResults.winner?.headline}\n\n${predictionResults.winner?.bodyCopy}`
                              );
                              alert('✅ Copied winning ad to clipboard!');
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                          >
                            📋 Copy to Clipboard
                          </button>
                        </div>
                        <div className="bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded p-4 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-300 leading-relaxed max-h-96 overflow-y-auto">
                          {predictionResults.winner?.bodyCopy}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ⚡ Processing time: {(summary.processingTimeMs / 1000).toFixed(1)}s
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Powered by Gemini 2.0 Flash
        </p>
      </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
