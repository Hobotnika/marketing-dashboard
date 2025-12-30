'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Avatar {
  id: string;
  name: string;
  demographics: {
    age: number;
    gender: string;
    location: string;
    income: string;
  };
  psychographics: {
    struggles: string[];
    goals: string[];
    fears: string[];
    frustrations: string[];
  };
  buying_behavior: string;
  communication_style: string;
  prompt_persona: string;
}

interface AvatarSet {
  setName: string;
  niche: string;
  description?: string;
  count: number;
  avatars: Avatar[];
  createdAt: string;
}

export default function AvatarLibraryPage() {
  const router = useRouter();
  const [avatarSets, setAvatarSets] = useState<AvatarSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [deletingSet, setDeletingSet] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatarSets();
  }, []);

  const fetchAvatarSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/avatars');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch avatar sets');
      }

      setAvatarSets(data.avatarSets || []);
    } catch (err) {
      console.error('Error fetching avatar sets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch avatar sets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (setName: string) => {
    if (!confirm(`Are you sure you want to delete the avatar set "${setName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingSet(setName);
      const response = await fetch(`/api/avatars/${encodeURIComponent(setName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete avatar set');
      }

      // Refresh the list
      await fetchAvatarSets();
      setExpandedSet(null);
    } catch (err) {
      console.error('Error deleting avatar set:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete avatar set');
    } finally {
      setDeletingSet(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Customer Avatars</h1>
              <p className="text-gray-400">Manage your customer persona sets</p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading avatar sets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-500 font-semibold mb-2">Error</p>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchAvatarSets}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customer Avatars</h1>
            <p className="text-gray-400">
              {avatarSets.length === 0
                ? 'Create your first customer persona set'
                : `${avatarSets.length} avatar set${avatarSets.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            href="/dashboard/settings/avatars/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            + Create Avatar Set
          </Link>
        </div>

        {/* Empty State */}
        {avatarSets.length === 0 && (
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Avatar Sets Yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first customer avatar set to start rating your ads with AI personas
            </p>
            <Link
              href="/dashboard/settings/avatars/create"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              Create Your First Set
            </Link>
          </div>
        )}

        {/* Avatar Sets Grid */}
        {avatarSets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {avatarSets.map((set) => {
              const isExpanded = expandedSet === set.setName;
              const isDeleting = deletingSet === set.setName;
              const previewAvatars = set.avatars.slice(0, 4);
              const remainingCount = set.count - previewAvatars.length;

              return (
                <div
                  key={set.setName}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        📊 {set.setName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {set.niche} • {set.count} avatars
                      </p>
                      {set.description && (
                        <p className="text-sm text-gray-500 mt-1">{set.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Avatar Preview */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {previewAvatars.map((avatar) => (
                        <span
                          key={avatar.id}
                          className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                        >
                          {avatar.name}
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="px-3 py-1 bg-gray-700/30 text-gray-400 rounded-full text-sm">
                          ...+{remainingCount} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-sm text-gray-500 mb-4">
                    Created {formatDate(set.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setExpandedSet(isExpanded ? null : set.setName)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      {isExpanded ? 'Hide All' : 'View All'}
                    </button>
                    <button
                      onClick={() => handleDeleteSet(set.setName)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                        All {set.count} Avatars
                      </h4>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {set.avatars.map((avatar) => (
                          <div
                            key={avatar.id}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="text-white font-semibold">{avatar.name}</h5>
                                <p className="text-sm text-gray-400">
                                  {avatar.demographics.age} • {avatar.demographics.gender} •{' '}
                                  {avatar.demographics.location} • {avatar.demographics.income}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500 font-medium">Struggles:</span>
                                <p className="text-gray-300 mt-1">
                                  {avatar.psychographics.struggles.join(' • ')}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">Goals:</span>
                                <p className="text-gray-300 mt-1">
                                  {avatar.psychographics.goals.join(' • ')}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">Communication:</span>
                                <p className="text-gray-300 mt-1">
                                  {avatar.communication_style}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
