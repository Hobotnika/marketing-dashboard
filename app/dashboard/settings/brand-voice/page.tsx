'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandVoiceProfile, validateBrandVoice } from '@/lib/utils/brand-voice';

export default function BrandVoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{ before: string; after: string } | null>(null);

  // Form state
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industryExpertise, setIndustryExpertise] = useState('');
  const [tone, setTone] = useState('');
  const [personalityTraitsText, setPersonalityTraitsText] = useState('');
  const [exampleShortForm, setExampleShortForm] = useState('');
  const [exampleLongForm, setExampleLongForm] = useState('');
  const [avoidText, setAvoidText] = useState('');
  const [signaturePhrasesText, setSignaturePhrasesText] = useState('');
  const [ctaStyle, setCtaStyle] = useState<'direct' | 'soft' | 'urgent'>('direct');
  const [adaptToAudience, setAdaptToAudience] = useState(true);
  const [demonstrateExpertise, setDemonstrateExpertise] = useState(true);
  const [maintainAuthenticity, setMaintainAuthenticity] = useState(true);

  useEffect(() => {
    fetchBrandVoice();
  }, []);

  const fetchBrandVoice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organization/brand-voice');
      const data = await response.json();

      if (data.success && data.data) {
        const profile: BrandVoiceProfile = data.data;
        setBrandName(profile.brand_name);
        setTagline(profile.tagline || '');
        setIndustryExpertise(profile.industry_expertise);
        setTone(profile.tone);
        setPersonalityTraitsText(profile.personality_traits.join('\n'));
        setExampleShortForm(profile.example_short_form);
        setExampleLongForm(profile.example_long_form);
        setAvoidText(profile.avoid.join(', '));
        setSignaturePhrasesText(profile.signature_phrases.join('\n'));
        setCtaStyle(profile.cta_style || 'direct');
        setAdaptToAudience(profile.adapt_to_audience);
        setDemonstrateExpertise(profile.demonstrate_expertise);
        setMaintainAuthenticity(profile.maintain_authenticity);
      }
    } catch (error) {
      console.error('Error fetching brand voice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setSaveError(null);
    setPreviewResult(null);

    try {
      const brandVoice = buildBrandVoiceProfile();
      const validation = validateBrandVoice(brandVoice);

      if (!validation.valid) {
        setSaveError(validation.errors.join(', '));
        setIsPreviewing(false);
        return;
      }

      const response = await fetch('/api/organization/brand-voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandVoice),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewResult(data.data);
      } else {
        setSaveError(data.error || 'Failed to preview');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const brandVoice = buildBrandVoiceProfile();
      const validation = validateBrandVoice(brandVoice);

      if (!validation.valid) {
        setSaveError(validation.errors.join(', '));
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/organization/brand-voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandVoice),
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess('Brand voice saved! This will be used for all AI-generated content.');
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError(data.error || 'Failed to save brand voice');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const buildBrandVoiceProfile = (): BrandVoiceProfile => {
    return {
      brand_name: brandName.trim(),
      tagline: tagline.trim() || null,
      industry_expertise: industryExpertise.trim(),
      tone: tone.trim(),
      personality_traits: personalityTraitsText
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0),
      example_short_form: exampleShortForm.trim(),
      example_long_form: exampleLongForm.trim(),
      avoid: avoidText
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0),
      signature_phrases: signaturePhrasesText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      adapt_to_audience: adaptToAudience,
      demonstrate_expertise: demonstrateExpertise,
      maintain_authenticity: maintainAuthenticity,
      cta_style: ctaStyle,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading brand voice...</p>
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
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Brand Voice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set your brand voice once, use everywhere. This defines how AI writes for all your content (ads, emails, blog posts, etc.).
          </p>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {saveSuccess}
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {saveError}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* 1. Brand Identity */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Brand Identity
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Acme Inc"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Innovation that moves you forward"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry Expertise *
                </label>
                <input
                  type="text"
                  value={industryExpertise}
                  onChange={(e) => setIndustryExpertise(e.target.value)}
                  placeholder="e.g., SaaS marketing automation for B2B companies"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Voice & Tone */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Voice & Tone
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Tone *
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g., Professional yet approachable, data-driven but conversational"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personality Traits * (one per line)
                </label>
                <textarea
                  value={personalityTraitsText}
                  onChange={(e) => setPersonalityTraitsText(e.target.value)}
                  placeholder="Energetic&#10;Direct&#10;Data-driven&#10;Authentic&#10;Results-focused"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter one trait per line
                </p>
              </div>
            </div>
          </div>

          {/* 3. Writing Examples */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              3. Writing Examples
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ⭐ MOST IMPORTANT: Paste real examples of your writing. This trains the AI on your unique style.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short-Form Example * (1-2 sentences, minimum 100 characters)
                </label>
                <textarea
                  value={exampleShortForm}
                  onChange={(e) => setExampleShortForm(e.target.value)}
                  placeholder="Example: Stop wasting time on manual tasks. Our AI-powered platform automates your entire workflow so you can focus on what matters."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {exampleShortForm.length}/100 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long-Form Example * (2-3 paragraphs, minimum 300 characters)
                </label>
                <textarea
                  value={exampleLongForm}
                  onChange={(e) => setExampleLongForm(e.target.value)}
                  placeholder="Example: Most marketing teams are drowning in repetitive tasks...&#10;&#10;That's why we built [Brand]. Our platform uses AI to handle the busy work...&#10;&#10;The result? Teams save 10+ hours per week and see 3x better results..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {exampleLongForm.length}/300 characters minimum
                </p>
              </div>
            </div>
          </div>

          {/* 4. What to Avoid */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              4. What to Avoid
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avoid (comma-separated)
              </label>
              <textarea
                value={avoidText}
                onChange={(e) => setAvoidText(e.target.value)}
                placeholder="Gen Z slang, corporate jargon, excessive emojis, passive voice"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* 5. Signature Elements */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Signature Elements (Optional)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Signature Phrases (one per line)
                </label>
                <textarea
                  value={signaturePhrasesText}
                  onChange={(e) => setSignaturePhrasesText(e.target.value)}
                  placeholder="Work smarter, not harder&#10;Results that matter&#10;Built for scale"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Call-to-Action Style
                </label>
                <div className="flex gap-4">
                  {(['direct', 'soft', 'urgent'] as const).map((style) => (
                    <label key={style} className="flex items-center gap-2">
                      <input
                        type="radio"
                        value={style}
                        checked={ctaStyle === style}
                        onChange={(e) => setCtaStyle(e.target.value as typeof ctaStyle)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {style}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Advanced Options */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Advanced Options
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={adaptToAudience}
                  onChange={(e) => setAdaptToAudience(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Adapt tone to match audience needs
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={demonstrateExpertise}
                  onChange={(e) => setDemonstrateExpertise(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Always demonstrate domain expertise
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={maintainAuthenticity}
                  onChange={(e) => setMaintainAuthenticity(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Maintain authenticity
                </span>
              </label>
            </div>
          </div>

          {/* Preview Result */}
          {previewResult && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Before vs After Preview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Before (Generic AI)
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewResult.before}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                    After (Your Brand Voice)
                  </h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewResult.after}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPreviewing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating Preview...
                </>
              ) : (
                'Preview Brand Voice'
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Brand Voice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
