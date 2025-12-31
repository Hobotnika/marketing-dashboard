'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Avatar {
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

type Step = 'input' | 'generating' | 'review';

export default function CreateAvatarSetPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [expandedAvatar, setExpandedAvatar] = useState<number | null>(null);

  // Step 1: Input
  const [niche, setNiche] = useState('');
  const [setName, setSetName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Generated avatars
  const [generatedSetName, setGeneratedSetName] = useState('');
  const [generatedNiche, setGeneratedNiche] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/api/avatars/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          setName: setName.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate avatars');
      }

      setGeneratedSetName(data.setName);
      setGeneratedNiche(data.niche);
      setGeneratedDescription(data.description || '');
      setAvatars(data.avatars || []);
      setStep('review');
    } catch (err) {
      console.error('Error generating avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatars');
      setStep('input');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setName: generatedSetName,
          niche: generatedNiche,
          description: generatedDescription,
          avatars,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save avatars');
      }

      // Redirect to library
      router.push('/dashboard/settings/avatars');
    } catch (err) {
      console.error('Error saving avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to save avatars');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (step === 'review') {
      if (confirm('Are you sure? Generated avatars will be lost.')) {
        router.push('/dashboard/settings/avatars');
      }
    } else {
      router.push('/dashboard/settings/avatars');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/dashboard/settings/avatars"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Library
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Avatar Set</h1>
          <p className="text-gray-400">
            Generate 12-15 ultra-detailed customer personas for a specific niche
          </p>
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Step 1: Define Your Niche</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Niche / Industry <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., ecommerce store owner, real estate agent, fitness coach"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Be specific about your target customer type
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set Name (optional)
                </label>
                <input
                  type="text"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="Auto-generated from niche if left empty"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Friendly name for this avatar set
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context about this avatar set..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!niche.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Ultra-Detailed Avatars with AI
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-6"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Generating Customer Avatars...
            </h2>
            <p className="text-gray-400 mb-4">
              AI is researching the <span className="text-blue-400">{niche}</span> niche
            </p>
            <p className="text-sm text-gray-500">
              This typically takes 60-90 seconds. We're analyzing reviews, forums, social media,
              and industry discussions to create ultra-detailed, realistic personas with 300+ word backgrounds.
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    📊 {generatedSetName}
                  </h2>
                  <p className="text-gray-400">
                    {generatedNiche} • {avatars.length} avatars
                  </p>
                  {generatedDescription && (
                    <p className="text-sm text-gray-500 mt-2">{generatedDescription}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save All Avatars'}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Avatar List */}
            <div className="space-y-4">
              {avatars.map((avatar, index) => {
                const isExpanded = expandedAvatar === index;

                return (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
                  >
                    {/* Collapsed View */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedAvatar(isExpanded ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {avatar.demographics.gender === 'Male' ? '👨' : '👩'}
                            </span>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {index + 1}. {avatar.name}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {avatar.demographics.age} • {avatar.demographics.gender} •{' '}
                                {avatar.demographics.location} • {avatar.demographics.income}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-gray-700 pt-4">
                        {/* Psychographics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-900/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-red-400 uppercase mb-2">
                              Struggles
                            </h4>
                            <ul className="space-y-1">
                              {avatar.psychographics.struggles.map((item, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gray-900/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-400 uppercase mb-2">
                              Goals
                            </h4>
                            <ul className="space-y-1">
                              {avatar.psychographics.goals.map((item, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gray-900/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-400 uppercase mb-2">
                              Fears
                            </h4>
                            <ul className="space-y-1">
                              {avatar.psychographics.fears.map((item, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gray-900/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-orange-400 uppercase mb-2">
                              Frustrations
                            </h4>
                            <ul className="space-y-1">
                              {avatar.psychographics.frustrations.map((item, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Buying Behavior */}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-blue-400 uppercase mb-2">
                            Buying Behavior
                          </h4>
                          <p className="text-sm text-gray-300">{avatar.buying_behavior}</p>
                        </div>

                        {/* Communication Style */}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-purple-400 uppercase mb-2">
                            Communication Style
                          </h4>
                          <p className="text-sm text-gray-300">{avatar.communication_style}</p>
                        </div>

                        {/* Prompt Persona */}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-indigo-400 uppercase mb-2">
                            AI Prompt Persona
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {avatar.prompt_persona}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : `Save All ${avatars.length} Avatars`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
