'use client';

import { useState, useEffect } from 'react';

interface AvatarSet {
  setName: string;
  niche: string;
  count: number;
}

interface RatingSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adCopy: string;
  onRatingStart: (setName: string) => void;
}

export default function RatingSetupModal({
  isOpen,
  onClose,
  adId,
  adCopy,
  onRatingStart,
}: RatingSetupModalProps) {
  const [avatarSets, setAvatarSets] = useState<AvatarSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvatarSets();
    }
  }, [isOpen]);

  const fetchAvatarSets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/avatars/sets');
      const data = await response.json();

      if (data.success) {
        setAvatarSets(data.data);
        // Auto-select first set if available
        if (data.data.length > 0) {
          setSelectedSet(data.data[0].setName);
        }
      } else {
        setError(data.error || 'Failed to load avatar sets');
      }
    } catch (err) {
      setError('Failed to load avatar sets');
      console.error('Error fetching avatar sets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (selectedSet) {
      onRatingStart(selectedSet);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Select Avatar Set for Rating
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose which customer personas should rate this ad
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

            {/* Content */}
            <div className="px-6 py-6">
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading avatar sets...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button
                    onClick={fetchAvatarSets}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : avatarSets.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No avatar sets found. Create an avatar set first to rate your ads.
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = '/dashboard/settings/avatars/create';
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Avatar Set
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {avatarSets.map((set) => (
                    <label
                      key={set.setName}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSet === set.setName
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="avatarSet"
                        value={set.setName}
                        checked={selectedSet === set.setName}
                        onChange={(e) => setSelectedSet(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {set.setName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {set.niche} • {set.count} avatars
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && !error && avatarSets.length > 0 && (
              <div className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={!selectedSet}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Start Rating
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
