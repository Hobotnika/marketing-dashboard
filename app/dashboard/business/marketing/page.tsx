'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketDefinition {
  id: string;
  targetMarketDescription: string | null;
  primarySegment: string | null;
  secondarySegment: string | null;
  nichePositioning: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageFramework {
  id: string;
  valueProposition: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PainPoint {
  id: string;
  description: string;
  displayOrder: number;
  createdAt: string;
}

interface Usp {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  createdAt: string;
}

interface ContentItem {
  id: string;
  platform: 'email' | 'linkedin' | 'instagram' | 'facebook';
  scheduledDate: string;
  contentType: string;
  status: 'idea' | 'drafted' | 'scheduled' | 'published';
  title: string;
  body: string | null;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Competitor {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  lastAnalyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AvatarSet {
  setName: string;
  niche: string;
  description: string | null;
  avatarCount: number;
}

interface AIPrompt {
  id: string;
  promptName: string;
  description: string;
}

interface AIAnalysis {
  id: string;
  promptName: string;
  output: string;
  tokensUsed: number;
  processingTime: number;
  createdAt: string;
}

export default function MarketingEnginePage() {
  // Market Definition state
  const [marketDef, setMarketDef] = useState<MarketDefinition | null>(null);
  const [marketForm, setMarketForm] = useState({
    targetMarketDescription: '',
    primarySegment: '',
    secondarySegment: '',
    nichePositioning: '',
  });

  // Message Framework state
  const [messageFramework, setMessageFramework] = useState<MessageFramework | null>(null);
  const [valueProposition, setValueProposition] = useState('');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [usps, setUsps] = useState<Usp[]>([]);

  // Content Calendar state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'email' | 'linkedin' | 'instagram' | 'facebook'>('all');

  // Competitors state
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  // Avatar sets (read-only from Marketing CC)
  const [avatarSets, setAvatarSets] = useState<AvatarSet[]>([]);

  // Brand voice (read-only from organizations)
  const [brandVoice, setBrandVoice] = useState<any>(null);

  // AI state
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals state
  const [showPainPointModal, setShowPainPointModal] = useState(false);
  const [showUspModal, setShowUspModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);

  // Form state for modals
  const [painPointDescription, setPainPointDescription] = useState('');
  const [uspForm, setUspForm] = useState({ title: '', description: '' });
  const [contentForm, setContentForm] = useState({
    platform: 'linkedin' as any,
    scheduledDate: new Date().toISOString().split('T')[0],
    contentType: 'post',
    title: '',
    body: '',
    notes: '',
  });
  const [competitorForm, setCompetitorForm] = useState({
    name: '',
    website: '',
    description: '',
    strengths: '',
    weaknesses: '',
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all marketing data on mount
  useEffect(() => {
    fetchMarketingData();
    fetchAIPrompts();
  }, []);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        marketRes,
        messageRes,
        contentRes,
        competitorsRes,
        avatarsRes,
        brandVoiceRes,
        analysesRes,
      ] = await Promise.all([
        fetch('/api/business/marketing/market'),
        fetch('/api/business/marketing/message'),
        fetch('/api/business/marketing/content'),
        fetch('/api/business/marketing/competitors'),
        fetch('/api/business/marketing/avatars'),
        fetch('/api/organizations/brand-voice'), // Assuming this endpoint exists
        fetch('/api/ai/analyses?section=marketing&limit=10'),
      ]);

      const marketData = await marketRes.json();
      const messageData = await messageRes.json();
      const contentData = await contentRes.json();
      const competitorsData = await competitorsRes.json();
      const avatarsData = await avatarsRes.json();
      const brandVoiceData = await brandVoiceRes.json();
      const analysesData = await analysesRes.json();

      // Set market definition
      if (marketData.success && marketData.marketDefinition) {
        setMarketDef(marketData.marketDefinition);
        setMarketForm({
          targetMarketDescription: marketData.marketDefinition.targetMarketDescription || '',
          primarySegment: marketData.marketDefinition.primarySegment || '',
          secondarySegment: marketData.marketDefinition.secondarySegment || '',
          nichePositioning: marketData.marketDefinition.nichePositioning || '',
        });
      }

      // Set message framework data
      if (messageData.success) {
        if (messageData.messageFramework) {
          setMessageFramework(messageData.messageFramework);
          setValueProposition(messageData.messageFramework.valueProposition || '');
        }
        setPainPoints(messageData.painPoints || []);
        setUsps(messageData.usps || []);
      }

      // Set content items
      if (contentData.success) {
        setContentItems(contentData.content || []);
      }

      // Set competitors
      if (competitorsData.success) {
        setCompetitors(competitorsData.competitors || []);
      }

      // Set avatar sets
      if (avatarsData.success) {
        setAvatarSets(avatarsData.avatarSets || []);
      }

      // Set brand voice (if endpoint exists and returns data)
      if (brandVoiceData.success && brandVoiceData.brandVoice) {
        setBrandVoice(brandVoiceData.brandVoice);
      }

      // Set AI analyses
      if (analysesData.success) {
        setAiAnalyses(analysesData.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIPrompts = async () => {
    try {
      const res = await fetch('/api/ai/prompts?section=marketing');
      const data = await res.json();
      if (data.success) {
        setAiPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    }
  };

  // Market Definition handlers
  const handleSaveMarket = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/business/marketing/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketForm),
      });

      const data = await res.json();
      if (data.success) {
        setMarketDef(data.marketDefinition);
        alert('Market definition saved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving market definition:', error);
      alert('Failed to save market definition');
    } finally {
      setSaving(false);
    }
  };

  // Message Framework handlers
  const handleSaveMessage = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/business/marketing/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueProposition }),
      });

      const data = await res.json();
      if (data.success) {
        setMessageFramework(data.messageFramework);
        alert('Message framework saved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving message framework:', error);
      alert('Failed to save message framework');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPainPoint = async () => {
    if (!painPointDescription.trim()) {
      alert('Please enter a pain point description');
      return;
    }

    try {
      const res = await fetch('/api/business/marketing/pain-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: painPointDescription,
          displayOrder: painPoints.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPainPoints([...painPoints, data.painPoint]);
        setPainPointDescription('');
        setShowPainPointModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding pain point:', error);
      alert('Failed to add pain point');
    }
  };

  const handleDeletePainPoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pain point?')) return;

    try {
      const res = await fetch(`/api/business/marketing/pain-points?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setPainPoints(painPoints.filter((p) => p.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting pain point:', error);
      alert('Failed to delete pain point');
    }
  };

  const handleAddUsp = async () => {
    if (!uspForm.title.trim() || !uspForm.description.trim()) {
      alert('Please enter both title and description');
      return;
    }

    try {
      const res = await fetch('/api/business/marketing/usps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uspForm,
          displayOrder: usps.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsps([...usps, data.usp]);
        setUspForm({ title: '', description: '' });
        setShowUspModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding USP:', error);
      alert('Failed to add USP');
    }
  };

  const handleDeleteUsp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this USP?')) return;

    try {
      const res = await fetch(`/api/business/marketing/usps?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setUsps(usps.filter((u) => u.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting USP:', error);
      alert('Failed to delete USP');
    }
  };

  // Content Calendar handlers
  const handleAddContent = async () => {
    if (!contentForm.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const res = await fetch('/api/business/marketing/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentForm),
      });

      const data = await res.json();
      if (data.success) {
        setContentItems([data.content, ...contentItems]);
        setContentForm({
          platform: 'linkedin',
          scheduledDate: new Date().toISOString().split('T')[0],
          contentType: 'post',
          title: '',
          body: '',
          notes: '',
        });
        setShowContentModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Failed to add content');
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const res = await fetch(`/api/business/marketing/content?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setContentItems(contentItems.filter((c) => c.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const handleUpdateContentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/business/marketing/content?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setContentItems(
          contentItems.map((c) => (c.id === id ? data.content : c))
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating content status:', error);
      alert('Failed to update content status');
    }
  };

  // Competitors handlers
  const handleAddCompetitor = async () => {
    if (!competitorForm.name.trim()) {
      alert('Please enter a competitor name');
      return;
    }

    try {
      const res = await fetch('/api/business/marketing/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorForm),
      });

      const data = await res.json();
      if (data.success) {
        setCompetitors([data.competitor, ...competitors]);
        setCompetitorForm({
          name: '',
          website: '',
          description: '',
          strengths: '',
          weaknesses: '',
        });
        setShowCompetitorModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
      alert('Failed to add competitor');
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) return;

    try {
      const res = await fetch(`/api/business/marketing/competitors?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setCompetitors(competitors.filter((c) => c.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting competitor:', error);
      alert('Failed to delete competitor');
    }
  };

  // AI Analysis handler
  const handleRunAnalysis = async (promptId: string) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptTemplateId: promptId,
          sectionName: 'marketing',
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAiAnalyses([data.analysis, ...aiAnalyses]);
        alert('Analysis completed!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter content by active tab
  const filteredContent =
    activeTab === 'all'
      ? contentItems
      : contentItems.filter((c) => c.platform === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading Marketing Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marketing Engine
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Define your market, messaging, content strategy, and competitive positioning
              </p>
            </div>

            {/* AI Analysis Buttons */}
            <div className="flex gap-2">
              {aiPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleRunAnalysis(prompt.id)}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={prompt.description}
                >
                  {isAnalyzing ? 'Analyzing...' : prompt.promptName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Market Definition Section (WHO) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Market Definition (WHO)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Market Description
              </label>
              <textarea
                value={marketForm.targetMarketDescription}
                onChange={(e) =>
                  setMarketForm({ ...marketForm, targetMarketDescription: e.target.value })
                }
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your ideal target market in detail..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {marketForm.targetMarketDescription.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Segment
                </label>
                <input
                  type="text"
                  value={marketForm.primarySegment}
                  onChange={(e) =>
                    setMarketForm({ ...marketForm, primarySegment: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., B2B SaaS founders"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary Segment
                </label>
                <input
                  type="text"
                  value={marketForm.secondarySegment}
                  onChange={(e) =>
                    setMarketForm({ ...marketForm, secondarySegment: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Marketing agencies"
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niche Positioning
              </label>
              <textarea
                value={marketForm.nichePositioning}
                onChange={(e) =>
                  setMarketForm({ ...marketForm, nichePositioning: e.target.value })
                }
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="How do you position yourself in your niche?"
              />
            </div>

            <button
              onClick={handleSaveMarket}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Market Definition'}
            </button>
          </div>

          {/* Customer Avatars Integration */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Customer Avatars (from Marketing Command Center)
            </h3>
            {avatarSets.length > 0 ? (
              <div className="space-y-2">
                {avatarSets.map((set) => (
                  <div
                    key={set.setName}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {set.setName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {set.avatarCount} avatars • {set.niche}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/marketing-command-center/avatars"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View in Marketing CC →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  No customer avatars created yet
                </p>
                <Link
                  href="/dashboard/marketing-command-center/avatars"
                  className="text-blue-600 hover:underline"
                >
                  Create avatars in Marketing Command Center →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Message Framework Section (WHAT) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Message Framework (WHAT)
          </h2>

          <div className="space-y-6">
            {/* Value Proposition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value Proposition
              </label>
              <textarea
                value={valueProposition}
                onChange={(e) => setValueProposition(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What unique value do you provide?"
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">
                {valueProposition.length}/200 characters
              </p>
            </div>

            {/* Pain Points */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pain Points
                </label>
                <button
                  onClick={() => setShowPainPointModal(true)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  + Add Pain Point
                </button>
              </div>
              {painPoints.length > 0 ? (
                <div className="space-y-2">
                  {painPoints.map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <p className="text-gray-900 dark:text-white">{point.description}</p>
                      <button
                        onClick={() => handleDeletePainPoint(point.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No pain points added yet</p>
              )}
            </div>

            {/* USPs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unique Selling Points (USPs)
                </label>
                <button
                  onClick={() => setShowUspModal(true)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  + Add USP
                </button>
              </div>
              {usps.length > 0 ? (
                <div className="space-y-2">
                  {usps.map((usp) => (
                    <div
                      key={usp.id}
                      className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{usp.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{usp.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteUsp(usp.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No USPs added yet</p>
              )}
            </div>

            <button
              onClick={handleSaveMessage}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Message Framework'}
            </button>
          </div>

          {/* Brand Voice Integration */}
          {brandVoice && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Brand Voice (from Settings)
              </h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="font-medium text-gray-900 dark:text-white">
                  {brandVoice.brand_name || 'Your Brand'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tone: {brandVoice.tone || 'Not set'}
                </p>
                {brandVoice.personality_traits && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Traits: {brandVoice.personality_traits.join(', ')}
                  </p>
                )}
                <Link
                  href="/dashboard/settings"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  Edit in Settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Content Calendar Section (WHERE) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Content Calendar
            </h2>
            <button
              onClick={() => setShowContentModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Content
            </button>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
            {(['all', 'email', 'linkedin', 'instagram', 'facebook'] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={`px-4 py-2 ${
                  activeTab === platform
                    ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Items */}
          {filteredContent.length > 0 ? (
            <div className="space-y-3">
              {filteredContent.map((content) => (
                <div
                  key={content.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {content.platform}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            content.status === 'published'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : content.status === 'scheduled'
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                              : content.status === 'drafted'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {content.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(content.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {content.title}
                      </h3>
                      {content.body && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {content.body}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {content.status !== 'published' && (
                        <select
                          value={content.status}
                          onChange={(e) => handleUpdateContentStatus(content.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="idea">Idea</option>
                          <option value="drafted">Drafted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No content items yet</p>
          )}
        </div>

        {/* Competitors Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Competitors
            </h2>
            <button
              onClick={() => setShowCompetitorModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Competitor
            </button>
          </div>

          {competitors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitors.map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{comp.name}</h3>
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {comp.website}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCompetitor(comp.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  {comp.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {comp.description}
                    </p>
                  )}
                  {comp.strengths && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">
                        Strengths:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{comp.strengths}</p>
                    </div>
                  )}
                  {comp.weaknesses && (
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        Weaknesses:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{comp.weaknesses}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No competitors tracked yet</p>
          )}
        </div>

        {/* AI Analysis History */}
        {aiAnalyses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Analysis History
            </h2>
            <div className="space-y-4">
              {aiAnalyses.slice(0, 3).map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {analysis.promptName}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(analysis.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <div className="whitespace-pre-wrap">{analysis.output}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {analysis.tokensUsed} tokens • {analysis.processingTime}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pain Point Modal */}
      {showPainPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Pain Point
            </h3>
            <textarea
              value={painPointDescription}
              onChange={(e) => setPainPointDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              placeholder="Describe a pain point your customers experience..."
              maxLength={100}
            />
            <p className="text-sm text-gray-500 mb-4">{painPointDescription.length}/100</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPainPointModal(false);
                  setPainPointDescription('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPainPoint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USP Modal */}
      {showUspModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Unique Selling Point
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uspForm.title}
                  onChange={(e) => setUspForm({ ...uspForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 10x Faster Processing"
                  maxLength={50}
                />
                <p className="text-sm text-gray-500 mt-1">{uspForm.title.length}/50</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uspForm.description}
                  onChange={(e) => setUspForm({ ...uspForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Explain why this matters to customers..."
                  maxLength={150}
                />
                <p className="text-sm text-gray-500 mt-1">{uspForm.description.length}/150</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowUspModal(false);
                  setUspForm({ title: '', description: '' });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUsp}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Content Item
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={contentForm.platform}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, platform: e.target.value as any })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={contentForm.scheduledDate}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, scheduledDate: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <input
                  type="text"
                  value={contentForm.contentType}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, contentType: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="post, story, email, article, video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Content title or hook"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Body
                </label>
                <textarea
                  value={contentForm.body}
                  onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Content body..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={contentForm.notes}
                  onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Internal notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowContentModal(false);
                  setContentForm({
                    platform: 'linkedin',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    contentType: 'post',
                    title: '',
                    body: '',
                    notes: '',
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContent}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Modal */}
      {showCompetitorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Competitor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={competitorForm.name}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Competitor name"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={competitorForm.website}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, website: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={competitorForm.description}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What do they do?"
                  maxLength={300}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strengths
                </label>
                <textarea
                  value={competitorForm.strengths}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, strengths: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What they do well..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weaknesses
                </label>
                <textarea
                  value={competitorForm.weaknesses}
                  onChange={(e) =>
                    setCompetitorForm({ ...competitorForm, weaknesses: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What they're missing..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCompetitorModal(false);
                  setCompetitorForm({
                    name: '',
                    website: '',
                    description: '',
                    strengths: '',
                    weaknesses: '',
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
