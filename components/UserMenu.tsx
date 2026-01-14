'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!session?.user) {
    return null;
  }

  const { user } = session;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId === user.workspaceId || isSwitching) return;

    setIsSwitching(true);
    try {
      const response = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (response.ok) {
        // Force session update and page reload
        await update();
        router.refresh();
        window.location.reload();
      } else {
        console.error('Failed to switch workspace');
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const workspaces = user.workspaces || [];
  const hasMultipleWorkspaces = workspaces.length > 1;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        {/* User Details */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user.workspaceName}
          </span>
        </div>

        {/* Role Badge */}
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          {/* Workspace Switcher Section */}
          {hasMultipleWorkspaces && (
            <>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Switch Workspace
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                    disabled={isSwitching}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      workspace.id === user.workspaceId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-full text-sm">
                          {workspace.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                          {workspace.subdomain}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(workspace.role)}`}>
                        {workspace.role}
                      </span>
                      {workspace.id === user.workspaceId && (
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <a
                  href="/dashboard/workspaces/new"
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Workspace
                </a>
              </div>
            </>
          )}

          {/* Actions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
