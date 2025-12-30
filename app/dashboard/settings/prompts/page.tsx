'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AiPrompt {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  category: 'meta_ads' | 'google_ads';
  promptType: string;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<AiPrompt[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'meta_ads' | 'google_ads'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    filterPrompts();
  }, [prompts, categoryFilter, searchQuery]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();

      if (data.success) {
        setPrompts(data.data);
      } else {
        setError(data.error || 'Failed to load prompts');
      }
    } catch (err) {
      setError('Failed to load prompts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPrompts(filtered);
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPrompts(); // Refresh list
      } else {
        alert(data.error || 'Failed to set as default');
      }
    } catch (err) {
      alert('Failed to update prompt');
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchPrompts(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete prompt');
      }
    } catch (err) {
      alert('Failed to delete prompt');
      console.error(err);
    }
  };

  const handleDuplicate = async (prompt: AiPrompt) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${prompt.name} (Copy)`,
          description: prompt.description,
          category: prompt.category,
          promptType: prompt.promptType,
          promptText: prompt.promptText,
          isDefault: false,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPrompts(); // Refresh list
      } else {
        alert(data.error || 'Failed to duplicate prompt');
      }
    } catch (err) {
      alert('Failed to duplicate prompt');
      console.error(err);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Prompts
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your AI prompt templates for ad generation
              </p>
            </div>
            <Link
              href="/dashboard/settings/prompts/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Prompt
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="google_ads">Google Ads</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Prompts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-12 border border-gray-200 dark:border-zinc-800 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || categoryFilter !== 'all'
                ? 'No prompts found matching your filters'
                : 'No prompts yet. Create your first prompt!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {prompt.name}
                      </h3>
                      {prompt.isDefault && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                          ⭐ Default
                        </span>
                      )}
                      {prompt.organizationId === null && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                          System
                        </span>
                      )}
                      {!prompt.isActive && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {prompt.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                        {prompt.category === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}
                      </span>
                      <span>Type: {prompt.promptType}</span>
                      <span>Used: {prompt.usageCount} times</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!prompt.isDefault && prompt.organizationId !== null && (
                      <button
                        onClick={() => handleSetDefault(prompt.id)}
                        className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    {prompt.organizationId !== null ? (
                      <>
                        <Link
                          href={`/dashboard/settings/prompts/${prompt.id}/edit`}
                          className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          Edit
                        </Link>
                        {!prompt.isDefault && (
                          <button
                            onClick={() => handleDelete(prompt.id, prompt.name)}
                            className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleDuplicate(prompt)}
                        className="px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        Duplicate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
