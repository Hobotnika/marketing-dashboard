'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePromptPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'meta_ads' as 'meta_ads' | 'google_ads',
    promptType: 'custom' as string,
    promptText: '',
    isDefault: false,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.name.trim() || !formData.promptText.trim()) {
      setError('Name and Prompt Text are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/settings/prompts');
      } else {
        setError(data.error || 'Failed to create prompt');
      }
    } catch (err) {
      setError('Failed to create prompt');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Create New Prompt
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create a custom AI prompt template for ad generation
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

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="meta_ads"
                    checked={formData.category === 'meta_ads'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Meta Ads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="google_ads"
                    checked={formData.category === 'google_ads'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Google Ads</span>
                </label>
              </div>
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
                  Creating...
                </>
              ) : (
                'Create Prompt'
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
