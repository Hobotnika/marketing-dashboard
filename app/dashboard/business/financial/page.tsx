'use client';

import { useState, useEffect } from 'react';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';
import { AnalysisHistory } from '@/components/ai/AnalysisHistory';

export default function FinancialPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Financial data
  const [summary, setSummary] = useState<any>(null);
  const [incomeActivities, setIncomeActivities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Forms state
  const [currentIncome, setCurrentIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'content_ads',
    description: '',
    amount: '',
    kpisStage: '',
  });

  const [currentTransaction, setCurrentTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ads',
    description: '',
    amount: '',
    vendor: '',
    notes: '',
  });

  // AI prompts
  const [prompts, setPrompts] = useState<any[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    fetchFinancialData();
    fetchAIPrompts();
  }, []);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      const [summaryRes, incomeRes, transactionsRes] = await Promise.all([
        fetch('/api/business/financial/summary?days=30'),
        fetch('/api/business/financial/income?days=30'),
        fetch('/api/business/financial/transactions?days=30'),
      ]);

      const summaryData = await summaryRes.json();
      const incomeData = await incomeRes.json();
      const transactionsData = await transactionsRes.json();

      if (summaryData.success) setSummary(summaryData.summary);
      if (incomeData.success) setIncomeActivities(incomeData.activities || []);
      if (transactionsData.success) setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      alert('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAIPrompts() {
    try {
      const res = await fetch('/api/ai/prompts?section=financial');
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    }
  }

  // Helper functions
  function formatMoney(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  }

  function dollarsToCents(dollars: string): number {
    const num = parseFloat(dollars);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }

  // Save income
  async function handleSaveIncome() {
    if (!currentIncome.description) {
      alert('Please enter a description');
      return;
    }

    if (!currentIncome.amount || parseFloat(currentIncome.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/business/financial/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentIncome.date,
          source: currentIncome.source,
          description: currentIncome.description,
          amount: dollarsToCents(currentIncome.amount),
          kpisStage: currentIncome.kpisStage || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Income added successfully!');
        // Reset form
        setCurrentIncome({
          date: new Date().toISOString().split('T')[0],
          source: 'content_ads',
          description: '',
          amount: '',
          kpisStage: '',
        });
        // Refresh data
        await fetchFinancialData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Failed to save income');
    } finally {
      setSaving(false);
    }
  }

  // Save transaction
  async function handleSaveTransaction() {
    if (!currentTransaction.description) {
      alert('Please enter a description');
      return;
    }

    if (!currentTransaction.amount || parseFloat(currentTransaction.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/business/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentTransaction.date,
          category: currentTransaction.category,
          description: currentTransaction.description,
          amount: dollarsToCents(currentTransaction.amount),
          vendor: currentTransaction.vendor || null,
          notes: currentTransaction.notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Expense added successfully!');
        // Reset form
        setCurrentTransaction({
          date: new Date().toISOString().split('T')[0],
          category: 'ads',
          description: '',
          amount: '',
          vendor: '',
          notes: '',
        });
        // Refresh data
        await fetchFinancialData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }

  // Delete income
  async function handleDeleteIncome(id: string) {
    if (!confirm('Are you sure you want to delete this income activity?')) return;

    try {
      const res = await fetch(`/api/business/financial/income?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Income deleted');
        await fetchFinancialData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Failed to delete income');
    }
  }

  // Delete transaction
  async function handleDeleteTransaction(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await fetch(`/api/business/financial/transactions?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Transaction deleted');
        await fetchFinancialData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  }

  function handleAnalysisComplete(analysis: any) {
    setCurrentAnalysis(analysis);
    setAnalysisRefreshTrigger((prev) => prev + 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Financial Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Command Center</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track income, monitor spending, and optimize cash flow
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue (30d)"
            value={formatMoney(summary?.totals?.revenue)}
            color="green"
          />
          <KPICard
            title="Total Expenses (30d)"
            value={formatMoney(summary?.totals?.expenses)}
            color="red"
          />
          <KPICard
            title="Net Cash Flow"
            value={formatMoney(summary?.totals?.netCashFlow)}
            color={summary?.totals?.netCashFlow >= 0 ? 'green' : 'red'}
          />
          <KPICard
            title="Profit Margin"
            value={`${summary?.totals?.profitMargin || 0}%`}
            color={summary?.totals?.profitMargin >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* AI Analysis Buttons */}
        {prompts.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((prompt) => (
                <AIAnalysisButton
                  key={prompt.id}
                  promptTemplateId={prompt.id}
                  promptName={prompt.promptName}
                  sectionName="financial"
                  onComplete={handleAnalysisComplete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Income Tracking Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Income Tracking</h2>

          {/* Income Entry Form */}
          <div className="mb-6 bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={currentIncome.date}
                  onChange={(e) => setCurrentIncome({ ...currentIncome, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source
                </label>
                <select
                  value={currentIncome.source}
                  onChange={(e) => setCurrentIncome({ ...currentIncome, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                >
                  <option value="content_ads">Content/Ads</option>
                  <option value="messages_dms">Messages/DMs</option>
                  <option value="strategy_calls">Strategy Calls</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={currentIncome.amount}
                  onChange={(e) => setCurrentIncome({ ...currentIncome, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Sale from..."
                  value={currentIncome.description}
                  onChange={(e) => setCurrentIncome({ ...currentIncome, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveIncome}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Add Income'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Income Activities */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {incomeActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No income activities yet. Add your first entry above!
                    </td>
                  </tr>
                ) : (
                  incomeActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activity.source.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activity.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                        {formatMoney(activity.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteIncome(activity.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spending Tracker Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spending Tracker</h2>

          {/* Transaction Entry Form */}
          <div className="mb-6 bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={currentTransaction.date}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={currentTransaction.category}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                >
                  <option value="ads">Ads</option>
                  <option value="software">Software</option>
                  <option value="contractors">Contractors</option>
                  <option value="education">Education</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={currentTransaction.amount}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Facebook Ads..."
                  value={currentTransaction.description}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveTransaction}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No expenses tracked yet. Add your first transaction above!
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {transaction.category.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                        {formatMoney(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analysis History */}
        <AnalysisHistory
          sectionName="financial"
          refreshTrigger={analysisRefreshTrigger}
          limit={5}
        />
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, color }: { title: string; value: string; color: 'green' | 'red' }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 border ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium mb-2 opacity-80">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
