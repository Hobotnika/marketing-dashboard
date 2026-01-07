'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateScriptPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [baseScriptId, setBaseScriptId] = useState('');
  const [baseScriptContent, setBaseScriptContent] = useState('');
  const [clientContext, setClientContext] = useState('');
  const [toneAdjustment, setToneAdjustment] = useState('professional');
  const [lengthPreference, setLengthPreference] = useState('standard');
  const [specificGoals, setSpecificGoals] = useState('');

  // Generated variations
  const [generatedVariations, setGeneratedVariations] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchScripts();
  }, []);

  useEffect(() => {
    // Update base script content when selection changes
    if (baseScriptId) {
      const selected = scripts.find((s) => s.id === baseScriptId);
      if (selected) {
        setBaseScriptContent(selected.content);
      }
    }
  }, [baseScriptId, scripts]);

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/business/scripts');
      const data = await response.json();

      if (data.success) {
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVariations = async () => {
    if (!baseScriptContent.trim()) {
      alert('Please select a base script or enter script content');
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/business/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseScript: baseScriptContent,
          clientContext,
          toneAdjustment,
          lengthPreference,
          specificGoals,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedVariations(data.variations);
        setShowResults(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating variations:', error);
      alert('Failed to generate variations');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const saveAsNewScript = async (variationText: string) => {
    const title = prompt('Enter a title for this script:');
    if (!title) return;

    const category = prompt(
      'Enter category (6_boxes, dm_flow, upsell, churn_prevention, pre_call, post_call, check_in, closing):'
    );
    if (!category) return;

    try {
      const res = await fetch('/api/business/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          content: variationText,
          useCase: clientContext || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Script saved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Failed to save script');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/business/scripts')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Scripts
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Script Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate personalized script variations using AI
          </p>
        </div>

        {!showResults ? (
          /* Input Form */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Base Script Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Script (Select or Enter Custom)
                </label>
                <select
                  value={baseScriptId}
                  onChange={(e) => setBaseScriptId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
                >
                  <option value="">-- Select a script --</option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.title} ({script.category.replace('_', ' ')})
                    </option>
                  ))}
                </select>

                <textarea
                  value={baseScriptContent}
                  onChange={(e) => {
                    setBaseScriptContent(e.target.value);
                    setBaseScriptId(''); // Clear selection if manually editing
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Or paste your own script here..."
                />
              </div>

              {/* Client Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Context
                </label>
                <textarea
                  value={clientContext}
                  onChange={(e) => setClientContext(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="E.g., Client: John Smith, Company: Acme Corp, Pain points: Low conversion rates, Budget concerns"
                />
              </div>

              {/* Tone Adjustment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone Adjustment
                </label>
                <select
                  value={toneAdjustment}
                  onChange={(e) => setToneAdjustment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="professional">Professional</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>

              {/* Length Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Length Preference
                </label>
                <div className="flex gap-3">
                  {['brief', 'standard', 'detailed'].map((length) => (
                    <button
                      key={length}
                      onClick={() => setLengthPreference(length)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                        lengthPreference === length
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specific Goals
                </label>
                <input
                  type="text"
                  value={specificGoals}
                  onChange={(e) => setSpecificGoals(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="E.g., Overcome price objections, Book a demo call, Close the sale"
                />
              </div>

              <button
                onClick={generateVariations}
                disabled={generating}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating Variations...' : 'Generate Script Variations'}
              </button>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Variations</h2>
              <button
                onClick={() => {
                  setShowResults(false);
                  setGeneratedVariations('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Generate New
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {generatedVariations}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => copyToClipboard(generatedVariations)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy All
                </button>
                <button
                  onClick={() => saveAsNewScript(generatedVariations)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save as New Script
                </button>
              </div>
            </div>

            {/* Original Context */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Generation Parameters
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Tone:</strong> {toneAdjustment}</p>
                <p><strong>Length:</strong> {lengthPreference}</p>
                {clientContext && <p><strong>Client Context:</strong> {clientContext}</p>}
                {specificGoals && <p><strong>Goals:</strong> {specificGoals}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
