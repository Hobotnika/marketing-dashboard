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
}

export default function RatingResults({ summary, feedbacks, onClose }: RatingResultsProps) {
  const [expandedAvatars, setExpandedAvatars] = useState<Set<string>>(new Set());

  const toggleAvatar = (avatarName: string) => {
    const newExpanded = new Set(expandedAvatars);
    if (newExpanded.has(avatarName)) {
      newExpanded.delete(avatarName);
    } else {
      newExpanded.add(avatarName);
    }
    setExpandedAvatars(newExpanded);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
  );
}
