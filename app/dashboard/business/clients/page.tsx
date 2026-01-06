'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';
import { AnalysisHistory } from '@/components/ai/AnalysisHistory';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<any[]>([]);

  // New client form
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    plan: 'starter',
    mrr: '',
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
    fetchAIPrompts();
  }, [statusFilter, stageFilter, searchQuery]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/business/clients?${params}`);
      const data = await response.json();

      if (data.success) {
        setClients(data.clients || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIPrompts = async () => {
    try {
      const res = await fetch('/api/ai/prompts?section=clients');
      const data = await res.json();
      if (data.success) {
        setAiPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    }
  };

  const handleAddClient = async () => {
    if (!clientForm.name) {
      alert('Please enter a client name');
      return;
    }

    try {
      const res = await fetch('/api/business/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      });

      const data = await res.json();

      if (data.success) {
        alert('Client added successfully!');
        setShowAddModal(false);
        setClientForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          industry: '',
          plan: 'starter',
          mrr: '',
          contractStartDate: new Date().toISOString().split('T')[0],
          contractEndDate: '',
          notes: '',
        });
        fetchClients();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthEmoji = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  const atRiskClients = clients.filter(
    (c) => c.status === 'at_risk' || c.healthScore < 50
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading Clients...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Success Hub</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage clients, track health metrics, and prevent churn
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Client
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Clients
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary?.totalClients || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Active
            </h3>
            <p className="text-3xl font-bold text-green-600">{summary?.activeClients || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              At Risk
            </h3>
            <p className="text-3xl font-bold text-red-600">{summary?.atRiskClients || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Avg Health Score
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary?.avgHealthScore || 0}/100</p>
          </div>
        </div>

        {/* AI Analysis */}
        {aiPrompts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h2>
            <div className="flex gap-3">
              {aiPrompts.map((prompt) => (
                <AIAnalysisButton
                  key={prompt.id}
                  promptTemplateId={prompt.id}
                  promptName={prompt.promptName}
                  sectionName="clients"
                  onComplete={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* At-Risk Clients Alert */}
        {atRiskClients.length > 0 && (
          <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
              ⚠️ At-Risk Clients ({atRiskClients.length})
            </h2>
            <div className="space-y-3">
              {atRiskClients.slice(0, 5).map((client: any) => (
                <div
                  key={client.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                      {client.company && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {client.company}
                        </span>
                      )}
                      <span className={`font-bold ${getHealthColor(client.healthScore)}`}>
                        {client.healthScore}/100 {getHealthEmoji(client.healthScore)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last activity:{' '}
                      {client.lastActivityDate
                        ? `${Math.floor((Date.now() - new Date(client.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                        : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/business/clients/${client.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters and Clients Table */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Stages</option>
              <option value="sign_up">Sign-up</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="success">Success</option>
              <option value="at_risk">At Risk</option>
              <option value="churned">Churned</option>
            </select>

            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Stage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Health</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">MRR</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No clients found. Add your first client to get started!
                    </td>
                  </tr>
                ) : (
                  clients.map((client: any) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => router.push(`/dashboard/business/clients/${client.id}`)}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{client.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{client.company || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {client.currentStage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${getHealthColor(client.healthScore)}`}>
                          {client.healthScore} {getHealthEmoji(client.healthScore)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">${client.mrr}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/business/clients/${client.id}`);
                          }}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analysis History */}
        <AnalysisHistory sectionName="clients" />
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Client</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan
                  </label>
                  <select
                    value={clientForm.plan}
                    onChange={(e) => setClientForm({ ...clientForm, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    MRR ($)
                  </label>
                  <input
                    type="number"
                    value={clientForm.mrr}
                    onChange={(e) => setClientForm({ ...clientForm, mrr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={clientForm.industry}
                    onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="SaaS, E-commerce..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Start Date *
                  </label>
                  <input
                    type="date"
                    value={clientForm.contractStartDate}
                    onChange={(e) => setClientForm({ ...clientForm, contractStartDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={clientForm.contractEndDate}
                    onChange={(e) => setClientForm({ ...clientForm, contractEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
