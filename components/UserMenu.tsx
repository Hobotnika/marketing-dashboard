'use client';

import { useSession } from 'next-auth/react';
import LogoutButton from './LogoutButton';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { user } = session;

  return (
    <div className="flex items-center gap-4">
      {/* User Info */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {/* Avatar */}
        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        {/* User Details */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user.organizationName}
          </span>
        </div>

        {/* Role Badge */}
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          user.role === 'admin'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {user.role}
        </span>
      </div>

      {/* Logout Button */}
      <LogoutButton />
    </div>
  );
}
