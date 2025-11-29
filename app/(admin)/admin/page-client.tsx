'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddClientModal from '@/components/admin/AddClientModal';
import EditClientModal from '@/components/admin/EditClientModal';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  createdAt: string;
  calendlyAccessToken: string | null;
  stripeSecretKey: string | null;
  googleSheetsId: string | null;
  metaAccessToken: string | null;
  users: any[];
}

interface AdminPanelClientProps {
  organizations: Organization[];
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function AdminPanelClient({
  organizations,
  userEmail,
  userName,
  userRole,
}: AdminPanelClientProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will delete all users and data associated with this organization. This action cannot be undone.`)) {
      return;
    }

    setDeletingOrgId(orgId);

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organization');
      }

      router.refresh();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeletingOrgId(null);
    }
  };

  const handleViewDashboard = (subdomain: string) => {
    // Open client dashboard in new tab
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const baseDomain = window.location.hostname.replace('admin.', '');
    const url = `${protocol}//${subdomain}.${baseDomain}${port}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage all organizations and users
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Client
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Logged in as: <strong>{userName}</strong> ({userEmail})
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded text-xs">
              SUPER ADMIN
            </span>
          </p>
        </div>

        {/* Organizations Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Subdomain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    API Keys
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {org.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                        {org.subdomain}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          org.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : org.status === 'trial'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {org.users.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {org.calendlyAccessToken && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded text-xs">
                            Cal
                          </span>
                        )}
                        {org.stripeSecretKey && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                            Str
                          </span>
                        )}
                        {org.googleSheetsId && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-xs">
                            Ggl
                          </span>
                        )}
                        {org.metaAccessToken && (
                          <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 rounded text-xs">
                            Meta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDashboard(org.subdomain)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                          title="View Dashboard"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditingOrg(org)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          disabled={deletingOrgId === org.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded text-xs transition-colors"
                          title="Delete"
                        >
                          {deletingOrgId === org.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No organizations found. Create your first client!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Add New Client
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Total Organizations
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {organizations.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {organizations.reduce((sum, org) => sum + org.users.length, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Active Organizations
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {organizations.filter((org) => org.status === 'active').length}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditClientModal
        isOpen={!!editingOrg}
        onClose={() => setEditingOrg(null)}
        organization={editingOrg}
      />
    </div>
  );
}
