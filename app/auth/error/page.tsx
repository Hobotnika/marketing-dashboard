'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Map error codes to user-friendly messages
  const getErrorDetails = (errorCode: string | null) => {
    const errors: Record<string, { title: string; description: string }> = {
      Configuration: {
        title: 'Server Configuration Error',
        description: 'There is a problem with the server configuration. Please contact support.',
      },
      AccessDenied: {
        title: 'Access Denied',
        description: 'You do not have permission to sign in. Please contact your administrator.',
      },
      Verification: {
        title: 'Verification Failed',
        description: 'The verification link may have expired or already been used.',
      },
      OAuthSignin: {
        title: 'OAuth Sign In Error',
        description: 'Error occurred during the OAuth sign-in process.',
      },
      OAuthCallback: {
        title: 'OAuth Callback Error',
        description: 'Error occurred during the OAuth callback.',
      },
      OAuthCreateAccount: {
        title: 'Could Not Create Account',
        description: 'Could not create an OAuth account in the database.',
      },
      EmailCreateAccount: {
        title: 'Could Not Create Account',
        description: 'Could not create an email account in the database.',
      },
      Callback: {
        title: 'Callback Error',
        description: 'Error occurred during the authentication callback.',
      },
      OAuthAccountNotLinked: {
        title: 'Account Already Exists',
        description: 'This email is already associated with another account. Please sign in with the original provider.',
      },
      EmailSignin: {
        title: 'Email Sign In Error',
        description: 'Could not send verification email. Please try again.',
      },
      CredentialsSignin: {
        title: 'Sign In Failed',
        description: 'The credentials you provided are incorrect. Please check and try again.',
      },
      SessionRequired: {
        title: 'Session Required',
        description: 'You must be signed in to access this page.',
      },
      Default: {
        title: 'Authentication Error',
        description: 'An unexpected error occurred during authentication. Please try again.',
      },
    };

    return errors[errorCode || 'Default'] || errors.Default;
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{errorDetails.title}</h1>
          <p className="text-gray-400">{errorDetails.description}</p>
        </div>

        {/* Error Details Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-400 mb-1">Error Code:</p>
              <code className="text-xs text-red-300 font-mono">{error}</code>
            </div>
          )}

          <div className="space-y-4">
            {/* Try Again Button */}
            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </Link>

            {/* Back to Home Button */}
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              If the problem persists, please contact support or try a different sign-in method.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © 2024 Marketing Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
