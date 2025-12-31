'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ManualAvatarForm from '@/components/avatars/ManualAvatarForm';

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

  // Creation mode toggle
  const [creationMode, setCreationMode] = useState<'ai' | 'manual' | 'upload'>('ai');

  // AI Generation - Step 1: Input
  const [niche, setNiche] = useState('');
  const [setName, setSetName] = useState('');
  const [description, setDescription] = useState('');

  // AI Generation - Step 2: Generated avatars
  const [generatedSetName, setGeneratedSetName] = useState('');
  const [generatedNiche, setGeneratedNiche] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Manual Entry state
  const [manualSetDefined, setManualSetDefined] = useState(false);
  const [manualSetName, setManualSetName] = useState('');
  const [manualNiche, setManualNiche] = useState('');
  const [manualAvatars, setManualAvatars] = useState<Avatar[]>([]);

  // Upload state
  const [uploadSetName, setUploadSetName] = useState('');
  const [uploadNiche, setUploadNiche] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedAvatars, setExtractedAvatars] = useState<Avatar[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } else if (manualAvatars.length > 0) {
      if (confirm('Are you sure? All manually entered avatars will be lost.')) {
        router.push('/dashboard/settings/avatars');
      }
    } else {
      router.push('/dashboard/settings/avatars');
    }
  };

  // Manual Entry Handlers
  const handleAddManualAvatar = (avatar: Avatar) => {
    setManualAvatars(prev => [...prev, avatar]);
  };

  const removeManualAvatar = (index: number) => {
    if (confirm('Remove this avatar?')) {
      setManualAvatars(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveManualSet = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setName: manualSetName,
          niche: manualNiche,
          description: `Manually created avatar set`,
          avatars: manualAvatars,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save avatars');
      }

      // Redirect to library
      router.push('/dashboard/settings/avatars');
    } catch (err) {
      console.error('Error saving manual avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to save avatars');
      setSaving(false);
    }
  };

  // Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/msword';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max

      if (!isValidType) {
        setError(`${file.name} is not a valid PDF or DOCX file`);
        return false;
      }
      if (!isValidSize) {
        setError(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 20)); // Max 20 files
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExtractedAvatar = (index: number) => {
    if (confirm('Remove this persona?')) {
      setExtractedAvatars(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleExtractFromFiles = async () => {
    if (!uploadSetName || !uploadNiche || selectedFiles.length === 0) return;

    setIsExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('setName', uploadSetName);
      formData.append('niche', uploadNiche);

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/avatars/extract-from-files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // ADD to existing avatars instead of replacing
        setExtractedAvatars(prev => [...prev, ...result.avatars]);

        // Clear selected files for next batch
        setSelectedFiles([]);
      } else {
        throw new Error(result.error || 'Failed to extract personas');
      }
    } catch (err) {
      console.error('Extraction failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract personas from files');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveExtractedAvatars = async () => {
    setSaving(true);
    setError(null);

    // Show warning if outside recommended range, but allow save anyway
    if (extractedAvatars.length < 12) {
      console.log(`[Avatar Upload] Saving ${extractedAvatars.length} avatars. Recommended: 12-15 for optimal rating accuracy.`);
    } else if (extractedAvatars.length > 15) {
      console.log(`[Avatar Upload] Saving ${extractedAvatars.length} avatars. Recommended: 12-15 for best results.`);
    }

    try {
      const response = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setName: uploadSetName,
          niche: uploadNiche,
          description: `Extracted from uploaded documents (${extractedAvatars.length} personas)`,
          avatars: extractedAvatars,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save avatars');
      }

      // Redirect to library
      router.push('/dashboard/settings/avatars');
    } catch (err) {
      console.error('Error saving extracted avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to save avatars');
      setSaving(false);
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

        {/* Mode Toggle */}
        {step === 'input' && (
          <div className="mb-6">
            <div className="flex gap-4 border-b border-gray-700">
              <button
                onClick={() => setCreationMode('ai')}
                className={`pb-3 px-6 font-semibold transition-all ${
                  creationMode === 'ai'
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                🤖 AI Generation (12-15 personas)
              </button>
              <button
                onClick={() => setCreationMode('manual')}
                className={`pb-3 px-6 font-semibold transition-all ${
                  creationMode === 'manual'
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                ✍️ Manual Entry (Add One by One)
              </button>
              <button
                onClick={() => setCreationMode('upload')}
                className={`pb-3 px-6 font-semibold transition-all ${
                  creationMode === 'upload'
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                📄 Upload Files (PDF/DOCX)
              </button>
            </div>
          </div>
        )}

        {/* Upload Flow */}
        {creationMode === 'upload' && step === 'input' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">📄 Upload Persona Documents</h3>
              <p className="text-gray-400 mb-4">
                Upload PDF or DOCX files containing customer personas. AI will extract all personas automatically.
              </p>

              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Upload multiple files at once (PDF, DOCX)</li>
                <li>✓ AI extracts all personas from documents</li>
                <li>✓ Automatically detects: Name, Demographics, Background, Struggles, Goals</li>
                <li>✓ Review and edit before saving</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 space-y-6">
              {/* Set Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Set Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadSetName}
                    onChange={(e) => setUploadSetName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Professional Service Providers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niche <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadNiche}
                    onChange={(e) => setUploadNiche(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., professional services"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Documents <span className="text-red-500">*</span>
                </label>

                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.doc"
                    multiple
                    className="hidden"
                  />

                  <div className="space-y-4">
                    <div className="text-6xl">📄</div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                      >
                        Choose Files
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        or drag and drop PDF/DOCX files here
                      </p>
                    </div>

                    <p className="text-xs text-gray-400">
                      Supports: PDF, DOCX (Max 20 files, 10MB each)
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-sm text-white">Selected Files:</h4>
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-900/50 border border-gray-700 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {file.name.endsWith('.pdf') ? '📕' : '📘'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtractFromFiles}
                  disabled={!uploadSetName || !uploadNiche || selectedFiles.length === 0 || isExtracting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Extracting Personas from {selectedFiles.length} File(s)...
                    </>
                  ) : (
                    `Extract Personas from ${selectedFiles.length} File(s)`
                  )}
                </button>
              </div>
            </div>

            {/* Preview Extracted Avatars */}
            {extractedAvatars.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex-1">
                    <h3 className="font-semibold text-white">
                      ✅ Total Personas: {extractedAvatars.length}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {extractedAvatars.length < 12
                        ? `Upload more batches to reach 12-15 personas (recommended for rating).`
                        : `Ready to save! You can add more batches or save now.`}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Clear all extracted personas and start over?')) {
                        setExtractedAvatars([]);
                        setSelectedFiles([]);
                      }
                    }}
                    className="px-4 py-3 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors font-semibold whitespace-nowrap"
                  >
                    Clear All
                  </button>
                </div>

                {/* Warning for count outside recommended range */}
                {extractedAvatars.length < 12 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-400">
                      💡 Tip: 12-15 avatars recommended for best rating accuracy. You can save now or keep uploading.
                    </p>
                  </div>
                )}

                {/* Avatar List */}
                <div className="space-y-3">
                  {extractedAvatars.map((avatar, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {avatar.demographics.gender === 'Male' ? '👨' : '👩'}
                          </span>
                          <div>
                            <h4 className="font-semibold text-white">{avatar.name}</h4>
                            <p className="text-sm text-gray-400">
                              {avatar.demographics?.age} • {avatar.demographics?.gender} • {avatar.demographics?.location}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeExtractedAvatar(i)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      <details className="text-sm mt-3">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">
                          View Full Persona
                        </summary>
                        <div className="mt-3 bg-gray-900/50 rounded-lg p-4">
                          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {avatar.prompt_persona}
                          </p>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={handleSaveExtractedAvatars}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : `Save All ${extractedAvatars.length} Avatars to Library`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Flow */}
        {creationMode === 'manual' && step === 'input' && (
          <div className="space-y-6">
            {/* Step 1: Define Set */}
            {!manualSetDefined && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Step 1: Define Avatar Set</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Set Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualSetName}
                      onChange={(e) => setManualSetName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Professional Service Providers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Niche <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualNiche}
                      onChange={(e) => setManualNiche(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="professional services"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setManualSetDefined(true)}
                      disabled={!manualSetName || !manualNiche}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Add Avatars →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Add Avatars One by One */}
            {manualSetDefined && (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="font-semibold text-white">
                    Avatars Added: <span className="text-green-400">{manualAvatars.length}</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    You can add as many avatars as you want (recommended: 12-15 for rating)
                  </p>
                </div>

                {manualAvatars.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Current Avatars:</h4>
                    {manualAvatars.map((avatar, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-800/50 border border-gray-700 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {avatar.demographics.gender === 'Male' ? '👨' : '👩'}
                          </span>
                          <div>
                            <span className="text-white font-medium">{avatar.name}</span>
                            <p className="text-sm text-gray-400">
                              {avatar.demographics.age} • {avatar.demographics.gender} •{' '}
                              {avatar.demographics.location}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeManualAvatar(i)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ManualAvatarForm
                  setName={manualSetName}
                  niche={manualNiche}
                  onSave={handleAddManualAvatar}
                  onCancel={() => setManualSetDefined(false)}
                />

                {manualAvatars.length > 0 && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    {error && (
                      <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
                        <p className="text-red-500 text-sm">{error}</p>
                      </div>
                    )}
                    <button
                      onClick={handleSaveManualSet}
                      disabled={saving}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : `Save All ${manualAvatars.length} Avatars to Library`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Generation Flow */}
        {creationMode === 'ai' && step === 'input' && (
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
