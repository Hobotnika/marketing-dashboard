import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isSuperAdminEmail } from '@/lib/auth/super-admin';
import AdminPanelClient from './page-client';

export default async function AdminPanel() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Super admin check - only specific emails can access
  if (!isSuperAdminEmail(session.user.email)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Only super administrators can access this panel.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Your email: {session.user.email}
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
    <AdminPanelClient
      organizations={allOrganizations}
      userEmail={session.user.email}
      userName={session.user.name}
      userRole={session.user.role}
    />
  );
}
