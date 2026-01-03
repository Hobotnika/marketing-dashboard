'use client';

import { useState } from 'react';

interface AIAnalysisButtonProps {
  promptTemplateId: string;
  promptName: string;
  sectionName: string;
  onComplete?: (analysis: any) => void;
  className?: string;
}

export function AIAnalysisButton({
  promptTemplateId,
  promptName,
  sectionName,
  onComplete,
  className = '',
}: AIAnalysisButtonProps) {
  const [loading, setLoading] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptTemplateId,
          sectionName,
        }),
      });

      const data = await res.json();

      if (res.ok && onComplete) {
        onComplete(data.analysis);
      } else {
        alert(data.error || 'Failed to run analysis');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Failed to run analysis');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={runAnalysis}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
        </svg>
      )}
      {loading ? 'Analyzing...' : promptName}
    </button>
  );
}
