'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddLeadModal from '@/components/AddLeadModal';
import type { Lead, LeadSourceAttribution } from '@/types/leads';
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_ICONS,
  LEAD_STATUS_COLORS,
} from '@/types/leads';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [attribution, setAttribution] = useState<LeadSourceAttribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch leads
      const leadsRes = await fetch('/api/leads');
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.data);
      }

      // Fetch attribution
      const attrRes = await fetch('/api/leads/attribution');
      const attrData = await attrRes.json();
      if (attrData.success) {
        setAttribution(attrData.data.bySource);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Lead Attribution
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and manage leads from all sources
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Manual Lead
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Leads
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {leads.length}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Converted
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {leads.filter((l) => l.status === 'converted').length}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Conversion Rate
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {leads.length > 0
                ? ((leads.filter((l) => l.status === 'converted').length / leads.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Attribution Chart */}
        {attribution.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-gray-200 dark:border-zinc-800 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lead Sources
            </h3>
            <div className="space-y-4">
              {attribution.map((attr) => (
                <div key={attr.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {LEAD_SOURCE_ICONS[attr.source]} {LEAD_SOURCE_LABELS[attr.source]}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {attr.count} leads ({attr.conversionRate.toFixed(1)}% converted)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(attr.count / leads.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Leads
            </h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No leads yet. Click "Add Manual Lead" to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {leads.map((lead) => {
                    const statusColors = LEAD_STATUS_COLORS[lead.status];
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {lead.name}
                          </div>
                          {lead.notes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {lead.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {LEAD_SOURCE_ICONS[lead.source]} {LEAD_SOURCE_LABELS[lead.source]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                            className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                          >
                            {Object.keys(LEAD_STATUS_LABELS).map((status) => (
                              <option key={status} value={status}>
                                {LEAD_STATUS_LABELS[status as Lead['status']]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {lead.phone && <div>📞 {lead.phone}</div>}
                          {lead.email && <div>📧 {lead.email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              if (confirm('Delete this lead?')) {
                                fetch(`/api/leads/${lead.id}`, { method: 'DELETE' }).then(() =>
                                  fetchData()
                                );
                              }
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
