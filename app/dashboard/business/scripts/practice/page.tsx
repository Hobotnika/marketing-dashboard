'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');

  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Practice session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [personaType, setPersonaType] = useState('friendly');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [clientContext, setClientContext] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const personas = [
    { value: 'friendly', label: 'Friendly Prospect', desc: 'Warm and interested, asks clarifying questions' },
    { value: 'skeptical', label: 'Skeptical Buyer', desc: 'Questions everything, needs strong proof' },
    { value: 'budget_conscious', label: 'Budget-Conscious', desc: 'Concerned about cost and ROI' },
    { value: 'decision_maker', label: 'Busy Decision-Maker', desc: 'Limited time, wants quick value' },
    { value: 'technical', label: 'Technical Buyer', desc: 'Asks detailed product questions' },
    { value: 'difficult', label: 'Difficult Prospect', desc: 'Hard to convince, many objections' },
  ];

  useEffect(() => {
    if (scriptId) {
      fetchScript();
    } else {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const fetchScript = async () => {
    try {
      const res = await fetch(`/api/business/scripts/${scriptId}`);
      const data = await res.json();
      if (data.success) {
        setScript(data.script);
      }
    } catch (error) {
      console.error('Error fetching script:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = () => {
    setSessionStarted(true);
    setStartTime(Date.now());
    setConversationHistory([]);
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || isAIResponding) return;

    const userMsg = userMessage.trim();
    setUserMessage('');
    setIsAIResponding(true);

    try {
      const res = await fetch('/api/business/scripts/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script?.id || null,
          scriptContent: script?.content || 'General sales conversation',
          personaType,
          difficultyLevel,
          clientContext,
          conversationHistory,
          userMessage: userMsg,
          isFirstMessage: conversationHistory.length === 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConversationHistory(data.conversationHistory);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsAIResponding(false);
    }
  };

  const endSessionAndGetFeedback = async () => {
    if (conversationHistory.length === 0) {
      alert('No conversation to analyze. Start a conversation first!');
      return;
    }

    setLoadingFeedback(true);
    const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const res = await fetch('/api/business/scripts/practice/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script?.id || 'unknown',
          scriptTitle: script?.title || 'Practice Session',
          personaType,
          difficultyLevel,
          conversationHistory,
          durationSeconds,
          clientContext,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback(data.feedback);
        setShowFeedback(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error getting feedback:', error);
      alert('Failed to get feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setConversationHistory([]);
    setUserMessage('');
    setStartTime(null);
    setShowFeedback(false);
    setFeedback(null);
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

  if (!scriptId || !script) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Script Selected</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please select a script from the scripts library to practice.
          </p>
          <button
            onClick={() => router.push('/dashboard/business/scripts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Scripts Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/business/scripts')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Scripts
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Role-Play Practice</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Script: <span className="font-semibold">{script.title}</span>
          </p>
        </div>

        {!sessionStarted ? (
          /* Setup View */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Session Setup</h2>

            <div className="space-y-6">
              {/* Persona Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Prospect Persona *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personas.map((persona) => (
                    <div
                      key={persona.value}
                      onClick={() => setPersonaType(persona.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        personaType === persona.value
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          checked={personaType === persona.value}
                          onChange={() => setPersonaType(persona.value)}
                          className="text-purple-600"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {persona.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{persona.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Difficulty Level *
                </label>
                <div className="flex gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficultyLevel(level)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                        difficultyLevel === level
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Context (Optional)
                </label>
                <textarea
                  value={clientContext}
                  onChange={(e) => setClientContext(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="E.g., SaaS company, 50 employees, looking to improve sales team performance..."
                />
              </div>

              <button
                onClick={startSession}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-lg"
              >
                Start Practice Session
              </button>
            </div>
          </div>
        ) : (
          /* Conversation View */
          <div className="space-y-4">
            {/* Conversation Box */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.floor((Date.now() - (startTime || 0)) / 60000)}:
                    {String(Math.floor(((Date.now() - (startTime || 0)) % 60000) / 1000)).padStart(2, '0')}
                  </span>
                  <button
                    onClick={endSessionAndGetFeedback}
                    disabled={loadingFeedback}
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    {loadingFeedback ? 'Getting Feedback...' : 'End & Get Feedback'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pr-2">
                {conversationHistory.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Start the conversation! The AI prospect is waiting...
                  </div>
                )}

                {conversationHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {msg.role === 'user' ? 'You (Sales Rep)' : 'AI Prospect'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isAIResponding && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <div className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                        AI Prospect
                      </div>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isAIResponding}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={sendMessage}
                  disabled={isAIResponding || !userMessage.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Script Reference */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Script Reference
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {script.content}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && feedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Session Feedback</h2>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {feedback.score && (
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold text-purple-600">{feedback.score}/10</div>
                  <div className="text-gray-600 dark:text-gray-400">Overall Score</div>
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {feedback.fullText}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetSession}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Practice Again
                </button>
                <button
                  onClick={() => router.push('/dashboard/business/scripts')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Back to Scripts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
