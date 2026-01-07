'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScriptsPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Script form
  const [scriptForm, setScriptForm] = useState({
    title: '',
    category: '6_boxes',
    content: '',
    useCase: '',
    talkingPoints: '',
    expectedOutcomes: '',
    successTips: '',
  });

  const categories = [
    { value: 'all', label: 'All Scripts' },
    { value: '6_boxes', label: '6 Boxes Framework' },
    { value: 'dm_flow', label: 'DM Flows' },
    { value: 'upsell', label: 'Upsell Scripts' },
    { value: 'churn_prevention', label: 'Churn Prevention' },
    { value: 'pre_call', label: 'Pre-Call Ritual' },
    { value: 'post_call', label: 'Post-Call Ritual' },
    { value: 'check_in', label: 'Check-In Scripts' },
    { value: 'closing', label: 'Closing Scripts' },
  ];

  useEffect(() => {
    fetchScripts();
  }, [categoryFilter, sortBy, searchQuery]);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      params.set('sortBy', sortBy);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/business/scripts?${params}`);
      const data = await response.json();

      if (data.success) {
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      alert('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScript = async () => {
    if (!scriptForm.title || !scriptForm.content) {
      alert('Title and content are required');
      return;
    }

    try {
      const res = await fetch('/api/business/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptForm),
      });

      const data = await res.json();

      if (data.success) {
        alert('Script added successfully!');
        setShowAddModal(false);
        setScriptForm({
          title: '',
          category: '6_boxes',
          content: '',
          useCase: '',
          talkingPoints: '',
          expectedOutcomes: '',
          successTips: '',
        });
        fetchScripts();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding script:', error);
      alert('Failed to add script');
    }
  };

  const copyToClipboard = (text: string, label: string = 'Script') => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const topPerformers = scripts.filter((s) => parseFloat(s.successRate) >= 70);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Scripts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DM Scripts Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Store, practice, and perfect your sales scripts with AI
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/business/scripts/generate')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Generate Script
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Script
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                categoryFilter === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort and Search */}
        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="updated">Recently Updated</option>
            <option value="used">Most Used</option>
            <option value="success">Highest Success Rate</option>
          </select>

          <input
            type="text"
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">
              Top Performers (Success Rate ≥ 70%)
            </h2>
            <div className="space-y-3">
              {topPerformers.slice(0, 3).map((script: any) => (
                <div
                  key={script.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{script.title}</h3>
                      {script.isDefaultTemplate && <span className="text-yellow-500">⭐</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Used {script.timesUsed} times · Success rate: {script.successRate}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(script.content, 'Script')}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setSelectedScript(script)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/business/scripts/practice?scriptId=${script.id}`)}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Scripts */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Scripts</h2>

          <div className="space-y-3">
            {scripts.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                No scripts found. Add your first script to get started!
              </div>
            ) : (
              scripts.map((script: any) => (
                <div
                  key={script.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{script.title}</h3>
                        {script.isDefaultTemplate && <span className="text-yellow-500">⭐</span>}
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          {script.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Used {script.timesUsed} times</span>
                        <span>Success: {script.successRate}%</span>
                        {script.useCase && <span>• {script.useCase}</span>}
                      </div>
                      {script.content && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {script.content.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => copyToClipboard(script.content)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 whitespace-nowrap"
                      >
                        Copy All
                      </button>
                      {script.talkingPoints && (
                        <button
                          onClick={() => copyToClipboard(script.talkingPoints, 'Talking points')}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                        >
                          Copy Points
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/business/scripts/practice?scriptId=${script.id}`)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 whitespace-nowrap"
                      >
                        Practice
                      </button>
                      <button
                        onClick={() => setSelectedScript(script)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Add Script Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Script</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={scriptForm.title}
                  onChange={(e) => setScriptForm({ ...scriptForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Script title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={scriptForm.category}
                  onChange={(e) => setScriptForm({ ...scriptForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.filter((c) => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Script Content *
                </label>
                <textarea
                  value={scriptForm.content}
                  onChange={(e) => setScriptForm({ ...scriptForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the full script..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Use Case (When to use this)
                </label>
                <input
                  type="text"
                  value={scriptForm.useCase}
                  onChange={(e) => setScriptForm({ ...scriptForm, useCase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="E.g., First outreach to warm leads"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Talking Points
                </label>
                <textarea
                  value={scriptForm.talkingPoints}
                  onChange={(e) => setScriptForm({ ...scriptForm, talkingPoints: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bullet points of key topics to cover..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Outcomes
                </label>
                <textarea
                  value={scriptForm.expectedOutcomes}
                  onChange={(e) => setScriptForm({ ...scriptForm, expectedOutcomes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What should happen after using this script..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Success Tips
                </label>
                <textarea
                  value={scriptForm.successTips}
                  onChange={(e) => setScriptForm({ ...scriptForm, successTips: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tips for using this script effectively..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScript}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Detail Modal */}
      {selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedScript.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {selectedScript.category.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Success Rate: {selectedScript.successRate}% ({selectedScript.timesUsed} uses)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedScript(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedScript.useCase && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Use Case</h3>
                  <p className="text-gray-900 dark:text-white">{selectedScript.useCase}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Script Content</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white font-mono">
                    {selectedScript.content}
                  </pre>
                </div>
              </div>

              {selectedScript.talkingPoints && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Key Talking Points
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                    {selectedScript.talkingPoints}
                  </pre>
                </div>
              )}

              {selectedScript.expectedOutcomes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Expected Outcomes
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                    {selectedScript.expectedOutcomes}
                  </pre>
                </div>
              )}

              {selectedScript.successTips && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Success Tips</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                    {selectedScript.successTips}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => copyToClipboard(selectedScript.content)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Copy All
              </button>
              {selectedScript.talkingPoints && (
                <button
                  onClick={() => copyToClipboard(selectedScript.talkingPoints, 'Talking points')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Copy Points Only
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedScript(null);
                  router.push(`/dashboard/business/scripts/practice?scriptId=${selectedScript.id}`);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Practice with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
