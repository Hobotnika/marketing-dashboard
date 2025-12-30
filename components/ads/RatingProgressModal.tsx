'use client';

interface AvatarStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed';
  time?: number;
}

interface RatingProgressModalProps {
  isOpen: boolean;
  avatarStatuses: AvatarStatus[];
  completedCount: number;
  totalAvatars: number;
}

export default function RatingProgressModal({
  isOpen,
  avatarStatuses,
  completedCount,
  totalAvatars,
}: RatingProgressModalProps) {
  if (!isOpen) return null;

  const progressPercentage = (completedCount / totalAvatars) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Avatar Rating in Progress
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Getting feedback from {totalAvatars} customer personas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {completedCount}/{totalAvatars} avatars
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Avatar Status List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {avatarStatuses.map((avatar, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {avatar.status === 'completed' && (
                  <span className="text-2xl">✅</span>
                )}
                {avatar.status === 'processing' && (
                  <span className="text-2xl animate-pulse">⏳</span>
                )}
                {avatar.status === 'pending' && (
                  <span className="text-2xl opacity-30">⏸</span>
                )}
              </div>

              {/* Avatar Name */}
              <span
                className={`flex-1 font-medium ${
                  avatar.status === 'completed'
                    ? 'text-green-700 dark:text-green-400'
                    : avatar.status === 'processing'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {avatar.name}
              </span>

              {/* Processing Time */}
              {avatar.status === 'completed' && avatar.time && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(avatar.time / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Estimated Time */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ⚡ Estimated time: 30-60 seconds
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Powered by Gemini 2.0 Flash
          </p>
        </div>
      </div>
    </div>
  );
}
