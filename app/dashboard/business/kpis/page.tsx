'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface KPISnapshot {
  id: string;
  date: string;
  exposure: number;
  leads: number;
  qualifiedLeads: number;
  ss1Total: number;
  ss1SixBoxes: number;
  ss1DMs: number;
  checkIns: number;
  prescriptionClose: number;
  closes: number;
  upsells: number;
  churn: number;
  churnReasons: string | null;
}

export default function KPIsDashboard() {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<KPISnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [currentMetrics, setCurrentMetrics] = useState({
    exposure: 0,
    leads: 0,
    qualifiedLeads: 0,
    ss1SixBoxes: 0,
    ss1DMs: 0,
    checkIns: 0,
    prescriptionClose: 0,
    closes: 0,
    upsells: 0,
    churn: 0,
    churnReasons: '',
  });

  // Fetch KPI data on mount
  useEffect(() => {
    fetchKPIs();
  }, []);

  async function fetchKPIs() {
    try {
      setLoading(true);
      const res = await fetch('/api/business/kpis?days=30');
      const data = await res.json();

      if (data.success) {
        setSnapshots(data.snapshots || []);

        // Load today's data if exists
        const today = data.snapshots?.find(
          (s: KPISnapshot) => s.date === selectedDate
        );
        if (today) {
          loadMetricsFromSnapshot(today);
        }
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      alert('Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  }

  function loadMetricsFromSnapshot(snapshot: KPISnapshot) {
    setCurrentMetrics({
      exposure: snapshot.exposure,
      leads: snapshot.leads,
      qualifiedLeads: snapshot.qualifiedLeads,
      ss1SixBoxes: snapshot.ss1SixBoxes,
      ss1DMs: snapshot.ss1DMs,
      checkIns: snapshot.checkIns,
      prescriptionClose: snapshot.prescriptionClose,
      closes: snapshot.closes,
      upsells: snapshot.upsells,
      churn: snapshot.churn,
      churnReasons: snapshot.churnReasons || '',
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch('/api/business/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          ...currentMetrics,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchKPIs();
        alert('✅ KPIs saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving KPIs:', error);
      alert('Failed to save KPIs');
    } finally {
      setSaving(false);
    }
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);

    // Load existing data for this date if available
    const snapshot = snapshots.find(s => s.date === newDate);
    if (snapshot) {
      loadMetricsFromSnapshot(snapshot);
    } else {
      // Reset to zero for new date
      setCurrentMetrics({
        exposure: 0,
        leads: 0,
        qualifiedLeads: 0,
        ss1SixBoxes: 0,
        ss1DMs: 0,
        checkIns: 0,
        prescriptionClose: 0,
        closes: 0,
        upsells: 0,
        churn: 0,
        churnReasons: '',
      });
    }
  }

  // Calculate conversion rates
  const ss1Total = currentMetrics.ss1SixBoxes + currentMetrics.ss1DMs;
  const conversionRates = {
    leadToQualified: currentMetrics.leads > 0
      ? ((currentMetrics.qualifiedLeads / currentMetrics.leads) * 100).toFixed(1)
      : '0.0',
    qualifiedToSS1: currentMetrics.qualifiedLeads > 0
      ? ((ss1Total / currentMetrics.qualifiedLeads) * 100).toFixed(1)
      : '0.0',
    ss1ToClose: ss1Total > 0
      ? ((currentMetrics.closes / ss1Total) * 100).toFixed(1)
      : '0.0',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading KPIs...</div>
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
            Business KPIs Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your sales funnel metrics daily - Company-level data shared across your team
          </p>
        </div>

        {/* Date Selector */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-zinc-800">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
            max={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {snapshots.find(s => s.date === selectedDate)
              ? '✅ Data exists for this date'
              : '➕ No data yet - enter metrics below'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
              Lead → Qualified
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {conversionRates.leadToQualified}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {currentMetrics.qualifiedLeads} / {currentMetrics.leads} leads qualified
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
              SS1 → Close
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {conversionRates.ss1ToClose}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {currentMetrics.closes} / {ss1Total} SS1 calls closed
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-1">
              Total Closes
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {currentMetrics.closes}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {currentMetrics.upsells} upsells | {currentMetrics.churn} churn
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Log Metrics for {selectedDate}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              * All fields are optional
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* A. Exposure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                A. Exposure
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.exposure}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  exposure: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Top of funnel (impressions, reach)
              </p>
            </div>

            {/* B. Leads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                B. Leads
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.leads}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  leads: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Form fills, DMs, comments
              </p>
            </div>

            {/* C. Qualified Leads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                C. Qualified Leads
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.qualifiedLeads}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  qualifiedLeads: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fit your criteria (budget, need, authority)
              </p>
            </div>

            {/* D1: 6 Boxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                D1. 6 Boxes Calls
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.ss1SixBoxes}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  ss1SixBoxes: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Framework discovery calls
              </p>
            </div>

            {/* D2: DMs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                D2. DM Conversations
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.ss1DMs}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  ss1DMs: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Direct message conversations
              </p>
            </div>

            {/* E: Check-Ins */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E. Check-In Calls
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.checkIns}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  checkIns: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Follow-up calls after initial contact
              </p>
            </div>

            {/* F: Prescription Close */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                F. Prescription Close
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.prescriptionClose}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  prescriptionClose: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Offer presentation/proposal
              </p>
            </div>

            {/* G: Closes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                G. Closes 💰
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.closes}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  closes: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Sales won ($$ in the bank)
              </p>
            </div>

            {/* H: Upsells */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                H. Upsells
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.upsells}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  upsells: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Additional sales to existing customers
              </p>
            </div>

            {/* I: Churn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                I. Churn
              </label>
              <input
                type="number"
                min="0"
                value={currentMetrics.churn}
                onChange={(e) => setCurrentMetrics({
                  ...currentMetrics,
                  churn: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg dark:bg-zinc-800 dark:text-white"
                placeholder="0"
              />
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Customers who cancelled
              </p>
            </div>
          </div>

          {/* J: Mirror (Churn Reasons) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              J. Mirror - Why did they churn?
            </label>
            <textarea
              value={currentMetrics.churnReasons}
              onChange={(e) => setCurrentMetrics({
                ...currentMetrics,
                churnReasons: e.target.value
              })}
              placeholder="Track patterns: pricing issues, poor fit, competitor, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white"
              rows={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Document churn reasons to identify patterns and improve retention
            </p>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save KPIs for {selectedDate}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Sales Funnel Visualization
          </h2>
          <div className="space-y-3">
            <FunnelStage label="A. Exposure" value={currentMetrics.exposure} />
            <FunnelStage label="B. Leads" value={currentMetrics.leads} />
            <FunnelStage label="C. Qualified Leads" value={currentMetrics.qualifiedLeads} />
            <FunnelStage
              label="D. SS1 (6 Boxes + DMs)"
              value={ss1Total}
              subtitle={`${currentMetrics.ss1SixBoxes} boxes + ${currentMetrics.ss1DMs} DMs`}
            />
            <FunnelStage label="E. Check-In Calls" value={currentMetrics.checkIns} />
            <FunnelStage label="F. Prescription Close" value={currentMetrics.prescriptionClose} />
            <FunnelStage
              label="G. Closes 💰"
              value={currentMetrics.closes}
              highlight
            />
            <FunnelStage label="H. Upsells" value={currentMetrics.upsells} />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <FunnelStage
                label="I. Churn"
                value={currentMetrics.churn}
                negative
              />
            </div>
          </div>
        </div>

        {/* Recent Snapshots */}
        {snapshots.length > 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Data (Last 7 Days)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Exposure</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Leads</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qualified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SS1</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Closes</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                  {snapshots.slice(0, 7).map((snapshot) => (
                    <tr
                      key={snapshot.id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => handleDateChange(snapshot.date)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        {snapshot.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {snapshot.exposure}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {snapshot.leads}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {snapshot.qualifiedLeads}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {snapshot.ss1Total}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                        {snapshot.closes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for funnel visualization
function FunnelStage({
  label,
  value,
  subtitle,
  highlight = false,
  negative = false,
}: {
  label: string;
  value: number;
  subtitle?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg ${
        highlight
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500'
          : negative
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
      }`}
    >
      <div>
        <span className={`font-medium ${
          highlight ? 'text-green-700 dark:text-green-400' :
          negative ? 'text-red-700 dark:text-red-400' :
          'text-gray-700 dark:text-gray-300'
        }`}>
          {label}
        </span>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </div>
        )}
      </div>
      <span
        className={`text-2xl font-bold ${
          highlight ? 'text-green-600 dark:text-green-400' :
          negative ? 'text-red-600 dark:text-red-400' :
          'text-gray-700 dark:text-gray-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
