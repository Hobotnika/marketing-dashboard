'use client';

import { useEffect, useState } from 'react';
import { AnalysisModal } from './AnalysisModal';

interface Analysis {
  id: string;
  promptName: string;
  output: string;
  createdAt: string;
  user: {
    name: string;
  };
  tokensUsed?: number;
  processingTime?: number;
}

interface AnalysisHistoryProps {
  sectionName: string;
  limit?: number;
  refreshTrigger?: number;
}

export function AnalysisHistory({
  sectionName,
  limit = 5,
  refreshTrigger = 0,
}: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, [sectionName, refreshTrigger]);

  async function fetchAnalyses() {
    try {
      const res = await fetch(`/api/ai/analyses?section=${sectionName}&limit=${limit}`);
      const data = await res.json();
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading history...</div>;
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No analyses yet. Click a button above to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
      {analyses.map((analysis) => (
        <button
          key={analysis.id}
          onClick={() => setSelectedAnalysis(analysis)}
          className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{analysis.promptName}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(analysis.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {analysis.output.substring(0, 150)}...
          </p>
        </button>
      ))}

      {selectedAnalysis && (
        <AnalysisModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}
