'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';
import { AnalysisModal } from '@/components/ai/AnalysisModal';
import { AnalysisHistory } from '@/components/ai/AnalysisHistory';

interface DailyRoutine {
  id: string;
  date: string;
  exerciseCompleted: boolean;
  exerciseType?: string;
  exerciseDuration?: number;
  gratitudeCompleted: boolean;
  gratitudeEntry?: string;
  meditationCompleted: boolean;
  meditationDuration?: number;
  breathworkCompleted: boolean;
  breathworkDuration?: number;
  selfImageUpdate?: string;
  completionRate: number;
}

export default function CongruenceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [routine, setRoutine] = useState<Partial<DailyRoutine>>({
    exerciseCompleted: false,
    gratitudeCompleted: false,
    meditationCompleted: false,
    breathworkCompleted: false,
    exerciseType: '',
    gratitudeEntry: '',
    meditationDuration: 0,
    breathworkDuration: 0,
  });

  const [routines, setRoutines] = useState<DailyRoutine[]>([]);
  const [streak, setStreak] = useState(0);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRoutines();
    fetchAIPrompts();
  }, []);

  useEffect(() => {
    const dayRoutine = routines.find(r => r.date === selectedDate);
    if (dayRoutine) {
      setRoutine(dayRoutine);
    } else {
      setRoutine({
        exerciseCompleted: false,
        gratitudeCompleted: false,
        meditationCompleted: false,
        breathworkCompleted: false,
        exerciseType: '',
        gratitudeEntry: '',
        meditationDuration: 0,
        breathworkDuration: 0,
      });
    }
  }, [selectedDate, routines]);

  async function fetchRoutines() {
    try {
      const res = await fetch('/api/business/congruence/routines?days=30');
      const data = await res.json();
      if (data.success) {
        setRoutines(data.routines || []);
        calculateStreak(data.routines || []);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAIPrompts() {
    try {
      const res = await fetch('/api/ai/prompts?section=congruence');
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  }

  function calculateStreak(routines: DailyRoutine[]) {
    let currentStreak = 0;
    const sortedRoutines = [...routines].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const routine of sortedRoutines) {
      if (routine.completionRate >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch('/api/business/congruence/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          ...routine,
        }),
      });

      if (res.ok) {
        await fetchRoutines();
        alert('✅ Routine saved!');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Failed to save routine');
    } finally {
      setSaving(false);
    }
  }

  function handleAnalysisComplete(analysis: any) {
    setCurrentAnalysis(analysis);
    setAnalysisRefreshTrigger(prev => prev + 1);
  }

  const completionRate = [
    routine.exerciseCompleted,
    routine.gratitudeCompleted,
    routine.meditationCompleted,
    routine.breathworkCompleted,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧘 Congruence Manifesto
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal development tracker - private to you
          </p>
        </div>

        {/* Streak & Date Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Streak Card */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <div className="text-4xl font-bold">{streak}</div>
            </div>
            <div className="text-sm opacity-90">Day Streak</div>
            <div className="text-xs mt-1 opacity-75">
              {streak > 0 ? "You're on fire! 🔥" : 'Start today!'}
            </div>
          </div>

          {/* Date Selector */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
            <label className="block text-sm font-medium mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
            />
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Completion: {completionRate}/4 ({Math.round((completionRate / 4) * 100)}%)
            </div>
          </div>
        </div>

        {/* Morning Routine Checklist */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Morning Routine
          </h2>

          <div className="space-y-6">
            {/* Exercise */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setRoutine({
                  ...routine,
                  exerciseCompleted: !routine.exerciseCompleted
                })}
                className="mt-1"
              >
                {routine.exerciseCompleted ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <label className="font-medium">💪 Exercise</label>
                <input
                  type="text"
                  placeholder="30min run, gym workout, yoga..."
                  value={routine.exerciseType || ''}
                  onChange={(e) => setRoutine({
                    ...routine,
                    exerciseType: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            {/* Gratitude */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setRoutine({
                  ...routine,
                  gratitudeCompleted: !routine.gratitudeCompleted
                })}
                className="mt-1"
              >
                {routine.gratitudeCompleted ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <label className="font-medium">❤️ Gratitude</label>
                <textarea
                  placeholder="What are you grateful for today?"
                  value={routine.gratitudeEntry || ''}
                  onChange={(e) => setRoutine({
                    ...routine,
                    gratitudeEntry: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                  rows={2}
                />
              </div>
            </div>

            {/* Meditation */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setRoutine({
                  ...routine,
                  meditationCompleted: !routine.meditationCompleted
                })}
                className="mt-1"
              >
                {routine.meditationCompleted ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <label className="font-medium">🧘 Meditation</label>
                <input
                  type="number"
                  placeholder="Minutes"
                  value={routine.meditationDuration || ''}
                  onChange={(e) => setRoutine({
                    ...routine,
                    meditationDuration: parseInt(e.target.value) || 0
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            {/* Breathwork */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => setRoutine({
                  ...routine,
                  breathworkCompleted: !routine.breathworkCompleted
                })}
                className="mt-1"
              >
                {routine.breathworkCompleted ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <label className="font-medium">🌬️ Breathwork</label>
                <input
                  type="number"
                  placeholder="Minutes"
                  value={routine.breathworkDuration || ''}
                  onChange={(e) => setRoutine({
                    ...routine,
                    breathworkDuration: parseInt(e.target.value) || 0
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Routine for {selectedDate}
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🧠 AI Analysis
          </h2>

          {prompts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {prompts.map((prompt) => (
                  <AIAnalysisButton
                    key={prompt.id}
                    promptTemplateId={prompt.id}
                    promptName={prompt.promptName}
                    sectionName="congruence"
                    onComplete={handleAnalysisComplete}
                  />
                ))}
              </div>

              <AnalysisHistory
                sectionName="congruence"
                limit={5}
                refreshTrigger={analysisRefreshTrigger}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No AI prompts configured yet. Seed default prompts to get started.
              </p>
              <button
                onClick={async () => {
                  try {
                    // For now, you can manually call the seed function
                    // Or update the seed-prompts API to support congruence
                    await fetchAIPrompts();
                  } catch (error) {
                    console.error('Error:', error);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Check for Prompts
              </button>
            </div>
          )}
        </div>

        {currentAnalysis && (
          <AnalysisModal
            analysis={currentAnalysis}
            onClose={() => setCurrentAnalysis(null)}
          />
        )}

        {/* Recent Activity */}
        {routines.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity (Last 7 Days)
            </h2>

            <div className="space-y-2">
              {routines.slice(0, 7).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedDate(r.date)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                    {r.completionRate >= 75 && (
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {r.completionRate}%
                    </div>
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        style={{ width: `${r.completionRate}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
