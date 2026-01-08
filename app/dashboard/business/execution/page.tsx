'use client';

import { useState, useEffect } from 'react';

export default function ExecutionPage() {
  const [activeTab, setActiveTab] = useState('execution');
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionStats, setConnectionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Execution form state
  const [executionForm, setExecutionForm] = useState({
    activityTitle: '',
    activityType: 'other',
    actualDurationMinutes: '',
    notes: '',
    outcome: '',
  });

  // Connection form state
  const [connectionForm, setConnectionForm] = useState({
    connectionName: '',
    connectionType: 'linkedin',
    quality: 'warm_intro',
    platform: '',
    context: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'execution') {
        // Fetch today's execution logs
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/business/execution/logs?date=${today}`);
        const data = await response.json();

        if (data.success) {
          setExecutionLogs(data.logs || []);
        }
      } else if (activeTab === 'connections') {
        // Fetch connections with stats
        const response = await fetch('/api/business/execution/connections?stats=true');
        const data = await response.json();

        if (data.success) {
          setConnections(data.connections || []);
          setConnectionStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogExecution = async () => {
    if (!executionForm.activityTitle) {
      alert('Please enter an activity title');
      return;
    }

    try {
      const response = await fetch('/api/business/execution/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...executionForm,
          wasPlanned: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Execution logged successfully!');
        setShowExecutionModal(false);
        setExecutionForm({
          activityTitle: '',
          activityType: 'other',
          actualDurationMinutes: '',
          notes: '',
          outcome: '',
        });
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error logging execution:', error);
      alert('Failed to log execution');
    }
  };

  const handleLogConnection = async () => {
    if (!connectionForm.connectionName) {
      alert('Please enter a connection name');
      return;
    }

    try {
      const response = await fetch('/api/business/execution/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('Connection logged successfully!');
        setShowConnectionModal(false);
        setConnectionForm({
          connectionName: '',
          connectionType: 'linkedin',
          quality: 'warm_intro',
          platform: '',
          context: '',
          notes: '',
        });
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error logging connection:', error);
      alert('Failed to log connection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Execution Tracker...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Execution Tracking</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track what you actually do, close the planning-execution loop
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('execution')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'execution'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Today's Execution
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'connections'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Connections
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'execution' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Activities</h2>
                  <button
                    onClick={() => setShowExecutionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Log Activity
                  </button>
                </div>

                {/* Execution Logs List */}
                <div className="space-y-3">
                  {executionLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No activities logged today. Start by logging your first activity!
                    </div>
                  ) : (
                    executionLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{log.activityTitle}</h3>
                              {log.activityType && (
                                <span className={`px-2 py-1 text-xs rounded ${
                                  log.activityType === 'income'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : log.activityType === 'affiliate'
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {log.activityType}
                                </span>
                              )}
                            </div>
                            {log.actualDurationMinutes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Time spent: {log.actualDurationMinutes} minutes
                              </p>
                            )}
                            {log.notes && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{log.notes}</p>
                            )}
                            {log.outcome && (
                              <p className="text-sm text-green-700 dark:text-green-300 mt-2">Outcome: {log.outcome}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.completedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connection Tracking</h2>
                  <button
                    onClick={() => setShowConnectionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Log Connection
                  </button>
                </div>

                {/* Connection Stats */}
                {connectionStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Today</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{connectionStats.today.count}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">of {connectionStats.today.goal}</p>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(connectionStats.today.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">This Week</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{connectionStats.week.count}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">of {connectionStats.week.goal}</p>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(connectionStats.week.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">This Month</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{connectionStats.month.count}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">of {connectionStats.month.goal}</p>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min(connectionStats.month.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Connections */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Connections</h3>
                  <div className="space-y-3">
                    {connections.slice(0, 10).map((conn: any) => (
                      <div
                        key={conn.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{conn.connectionName}</h4>
                              <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {conn.connectionType}
                              </span>
                              {conn.quality && (
                                <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                  {conn.quality}
                                </span>
                              )}
                            </div>
                            {conn.context && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{conn.context}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(conn.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Execution Modal */}
      {showExecutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Log Activity</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={executionForm.activityTitle}
                  onChange={(e) => setExecutionForm({ ...executionForm, activityTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What did you do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Type
                </label>
                <select
                  value={executionForm.activityType}
                  onChange={(e) => setExecutionForm({ ...executionForm, activityType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="income">Income</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Spent (minutes)
                </label>
                <input
                  type="number"
                  value={executionForm.actualDurationMinutes}
                  onChange={(e) => setExecutionForm({ ...executionForm, actualDurationMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outcome
                </label>
                <input
                  type="text"
                  value={executionForm.outcome}
                  onChange={(e) => setExecutionForm({ ...executionForm, outcome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What was the result?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={executionForm.notes}
                  onChange={(e) => setExecutionForm({ ...executionForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExecutionModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleLogExecution}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Log New Connection</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Name *
                </label>
                <input
                  type="text"
                  value={connectionForm.connectionName}
                  onChange={(e) => setConnectionForm({ ...connectionForm, connectionName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Type
                </label>
                <select
                  value={connectionForm.connectionType}
                  onChange={(e) => setConnectionForm({ ...connectionForm, connectionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="in_person">In Person</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality
                </label>
                <select
                  value={connectionForm.quality}
                  onChange={(e) => setConnectionForm({ ...connectionForm, quality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="cold_outreach">Cold Outreach</option>
                  <option value="warm_intro">Warm Intro</option>
                  <option value="referral">Referral</option>
                  <option value="existing_network">Existing Network</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Context
                </label>
                <textarea
                  value={connectionForm.context}
                  onChange={(e) => setConnectionForm({ ...connectionForm, context: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="How did you connect?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={connectionForm.notes}
                  onChange={(e) => setConnectionForm({ ...connectionForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConnectionModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleLogConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
