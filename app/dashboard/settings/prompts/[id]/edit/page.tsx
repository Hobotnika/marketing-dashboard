'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditPromptPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPromptPage({ params }: EditPromptPageProps) {
  const router = useRouter();
  const [promptId, setPromptId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'meta_ads' as 'meta_ads' | 'google_ads',
    promptType: 'custom' as string,
    promptText: '',
    isDefault: false,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setPromptId(id);
      fetchPrompt(id);
    });
  }, [params]);

  const fetchPrompt = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/${id}`);
      const data = await response.json();

      if (data.success) {
        const prompt = data.data;
        setFormData({
          name: prompt.name,
          description: prompt.description || '',
          category: prompt.category,
          promptType: prompt.promptType,
          promptText: prompt.promptText,
          isDefault: prompt.isDefault,
          isActive: prompt.isActive,
        });
      } else {
        setError(data.error || 'Failed to load prompt');
      }
    } catch (err) {
      setError('Failed to load prompt');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptId) return;

    setIsSubmitting(true);
    setError(null);

    if (!formData.name.trim() || !formData.promptText.trim()) {
      setError('Name and Prompt Text are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/settings/prompts');
      } else {
        setError(data.error || 'Failed to update prompt');
      }
    } catch (err) {
      setError('Failed to update prompt');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/prompts')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Prompts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/settings/prompts')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-2"
          >
            ← Back to Prompts
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Prompt
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update your AI prompt template
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            {/* Name */}
            <div className="mb-6">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Google Ads - Local Business"
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this prompt template..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                disabled={isSubmitting}
              />
            </div>

            {/* Category (read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300">
                {formData.category === 'meta_ads' ? 'Meta Ads' : 'Google Ads'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Category cannot be changed after creation
              </p>
            </div>

            {/* Prompt Type */}
            <div className="mb-6">
              <label
                htmlFor="promptType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Prompt Type
              </label>
              <select
                id="promptType"
                value={formData.promptType}
                onChange={(e) => setFormData({ ...formData, promptType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                disabled={isSubmitting}
              >
                <option value="custom">Custom</option>
                <option value="default">Default</option>
                <option value="local_business">Local Business</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
              </select>
            </div>

            {/* Prompt Text */}
            <div className="mb-6">
              <label
                htmlFor="promptText"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Prompt Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="promptText"
                value={formData.promptText}
                onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                placeholder="Enter your AI prompt template here. Use {{variable_name}} for dynamic variables like {{landing_page}}, {{primary_keyword}}, etc."
                rows={20}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Character count: {formData.promptText.length}
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Set as default prompt for this category
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active (available for use)
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings/prompts')}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
