import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/db/schema';

export default async function AdminPanel() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user is admin (you can add a super admin check here)
  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all organizations and users
  const allOrganizations = await db.query.organizations.findMany({
    with: {
      users: true,
    },
    orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage all organizations and users
          </p>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Logged in as: <strong>{session.user.name}</strong> ({session.user.email})
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded text-xs">
              {session.user.role}
            </span>
          </p>
        </div>

        {/* Organizations List */}
        <div className="grid grid-cols-1 gap-6">
          {allOrganizations.map((org) => (
            <div
              key={org.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {org.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Subdomain:{' '}
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {org.subdomain}.yourdomain.com
                    </code>
                  </p>
                </div>
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
              </div>

              {/* Organization Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Users:</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {org.users.length}
                  </p>
                </div>
              </div>

              {/* Users */}
              {org.users.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Users
                  </h3>
                  <div className="space-y-2">
                    {org.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Configuration Status */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  API Configuration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div
                    className={`px-3 py-2 rounded-lg text-xs ${
                      org.calendlyAccessToken
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    <span className="font-semibold">Calendly:</span>{' '}
                    {org.calendlyAccessToken ? '✓' : '✗'}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-xs ${
                      org.stripeSecretKey
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    <span className="font-semibold">Stripe:</span>{' '}
                    {org.stripeSecretKey ? '✓' : '✗'}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-xs ${
                      org.googleSheetsId
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    <span className="font-semibold">Google:</span>{' '}
                    {org.googleSheetsId ? '✓' : '✗'}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-xs ${
                      org.metaAccessToken
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    <span className="font-semibold">Meta:</span>{' '}
                    {org.metaAccessToken ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Organization Button (Future) */}
        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To add a new organization, use the CLI command:
          </p>
          <code className="px-4 py-2 bg-gray-800 text-green-400 rounded font-mono text-sm">
            npm run db:add-client
          </code>
        </div>
      </div>
    </div>
  );
}
