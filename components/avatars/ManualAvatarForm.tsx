'use client';

import { useState } from 'react';

interface ManualAvatarFormProps {
  setName: string;
  niche: string;
  onSave: (avatar: any) => void;
  onCancel: () => void;
}

export default function ManualAvatarForm({ setName, niche, onSave, onCancel }: ManualAvatarFormProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    avatarName: '',

    // Demographics
    age: '',
    gender: '',
    location: '',
    education: '',
    income: '',
    maritalStatus: '',
    generation: '',

    // Professional Background
    professionalBackground: '',
    digitalAdvertisingExperience: '',

    // Psychographics
    struggles: ['', '', '', '', '', '', ''], // 7 items
    goals: ['', '', '', '', '', '', '', '', ''], // 9 items
    fears: ['', '', ''], // 3 items
    frustrations: ['', '', '', ''], // 4 items

    // Buying Behavior
    buyingBehavior: '',
    communicationStyle: '',

    // Prompt Persona (Most Important!)
    promptPersona: '',
  });

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.avatarName || !formData.promptPersona) {
      alert('Avatar name and Prompt Persona are required!');
      return;
    }

    // Build persona data structure
    const avatar = {
      name: formData.avatarName,
      demographics: {
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        location: formData.location,
        income: formData.income,
      },
      psychographics: {
        struggles: formData.struggles.filter(s => s.trim()),
        goals: formData.goals.filter(g => g.trim()),
        fears: formData.fears.filter(f => f.trim()),
        frustrations: formData.frustrations.filter(f => f.trim())
      },
      buying_behavior: formData.buyingBehavior,
      communication_style: formData.communicationStyle,
      prompt_persona: formData.promptPersona
    };

    onSave(avatar);

    // Reset form for next avatar
    setFormData({
      avatarName: '',
      age: '',
      gender: '',
      location: '',
      education: '',
      income: '',
      maritalStatus: '',
      generation: '',
      professionalBackground: '',
      digitalAdvertisingExperience: '',
      struggles: ['', '', '', '', '', '', ''],
      goals: ['', '', '', '', '', '', '', '', ''],
      fears: ['', '', ''],
      frustrations: ['', '', '', ''],
      buyingBehavior: '',
      communicationStyle: '',
      promptPersona: '',
    });
  };

  return (
    <div className="space-y-8 bg-gray-800/50 border border-gray-700 rounded-lg p-8">
      {/* Header */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-2">Manual Avatar Entry</h3>
        <p className="text-sm text-gray-400">
          Creating avatar for set: <strong className="text-blue-400">{setName}</strong> (Niche: {niche})
        </p>
        <p className="text-sm text-gray-500 mt-1">
          💡 Tip: The "Prompt Persona" field is most important for AI rating quality!
        </p>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg text-white">1. Basic Information</h4>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Avatar Name <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(e.g., "Jennifer Walsh")</span>
          </label>
          <input
            type="text"
            value={formData.avatarName}
            onChange={(e) => setFormData(prev => ({ ...prev, avatarName: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Full name of this persona"
          />
        </div>
      </div>

      {/* Demographics */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg text-white">2. Demographics</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="42"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Denver, Colorado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Income Range</label>
            <input
              type="text"
              value={formData.income}
              onChange={(e) => setFormData(prev => ({ ...prev, income: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="$65,000 - $85,000 annually"
            />
          </div>
        </div>
      </div>

      {/* Prompt Persona - MOST IMPORTANT */}
      <div className="space-y-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-6">
        <h4 className="font-semibold text-lg text-yellow-400">⭐ Prompt Persona (CRITICAL!) <span className="text-red-500">*</span></h4>
        <p className="text-sm text-gray-400">
          This 300+ word description is used by AI to roleplay as this persona when rating ads.
          Include background, current situation, struggles, tools they use, buying behavior, skepticism, and what they need.
        </p>

        <textarea
          value={formData.promptPersona}
          onChange={(e) => setFormData(prev => ({ ...prev, promptPersona: e.target.value }))}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
          rows={12}
          placeholder="Jennifer is a 42-year-old certified life coach who launched 'Authentic Path Coaching' four years ago after her own career transition from corporate HR. She works with 15-20 clients monthly..."
        />
        <div className="text-sm text-gray-400">
          {formData.promptPersona.length} characters
          {formData.promptPersona.length < 300 && (
            <span className="text-orange-400 ml-2">(recommend 300+ for quality)</span>
          )}
          {formData.promptPersona.length >= 300 && (
            <span className="text-green-400 ml-2">✓ Good length</span>
          )}
        </div>
      </div>

      {/* Collapsible Psychographics Section */}
      <details className="border border-gray-700 rounded-lg p-4">
        <summary className="font-semibold text-white cursor-pointer hover:text-blue-400">
          3. Psychographics (Optional - 7 Struggles, 9 Goals, 3 Fears, 4 Frustrations)
        </summary>
        <div className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Struggles (7 items)
            </label>
            {formData.struggles.map((struggle, i) => (
              <input
                key={i}
                type="text"
                value={struggle}
                onChange={(e) => handleArrayChange('struggles', i, e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                placeholder={`Struggle ${i + 1}`}
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Goals (9 items)
            </label>
            {formData.goals.map((goal, i) => (
              <input
                key={i}
                type="text"
                value={goal}
                onChange={(e) => handleArrayChange('goals', i, e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                placeholder={`Goal ${i + 1}`}
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fears (3 items)
            </label>
            {formData.fears.map((fear, i) => (
              <input
                key={i}
                type="text"
                value={fear}
                onChange={(e) => handleArrayChange('fears', i, e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                placeholder={`Fear ${i + 1}`}
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Frustrations (4 items)
            </label>
            {formData.frustrations.map((frustration, i) => (
              <input
                key={i}
                type="text"
                value={frustration}
                onChange={(e) => handleArrayChange('frustrations', i, e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                placeholder={`Frustration ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </details>

      {/* Collapsible Behavior Section */}
      <details className="border border-gray-700 rounded-lg p-4">
        <summary className="font-semibold text-white cursor-pointer hover:text-blue-400">
          4. Buying Behavior & Communication (Optional)
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buying Behavior
            </label>
            <textarea
              value={formData.buyingBehavior}
              onChange={(e) => setFormData(prev => ({ ...prev, buyingBehavior: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="How they make purchasing decisions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Communication Style
            </label>
            <textarea
              value={formData.communicationStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, communicationStyle: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="How they prefer to be communicated with..."
            />
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.avatarName || !formData.promptPersona}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Avatar to Set
        </button>
      </div>
    </div>
  );
}
