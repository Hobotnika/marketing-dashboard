'use client';

import { useState, useEffect } from 'react';
import { AlertSettings, AlertThreshold } from '@/types/alerts';
import Link from 'next/link';

export default function AlertSettingsPage() {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/alerts');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-all',
          data: { settings },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleThreshold = (thresholdId: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      thresholds: settings.thresholds.map((t) =>
        t.id === thresholdId ? { ...t, enabled: !t.enabled } : t
      ),
    });
  };

  const updateThresholdValue = (thresholdId: string, value: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      thresholds: settings.thresholds.map((t) =>
        t.id === thresholdId ? { ...t, threshold: value } : t
      ),
    });
  };

  const updateNotificationChannel = (
    channel: 'email' | 'slack',
    field: string,
    value: any
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      notificationChannels: {
        ...settings.notificationChannels,
        [channel]: {
          ...settings.notificationChannels[channel],
          [field]: value,
        },
      },
    });
  };

  const addEmailRecipient = (email: string) => {
    if (!settings || !email) return;

    const recipients = settings.notificationChannels.email.recipients;
    if (!recipients.includes(email)) {
      updateNotificationChannel('email', 'recipients', [...recipients, email]);
    }
  };

  const removeEmailRecipient = (email: string) => {
    if (!settings) return;

    const recipients = settings.notificationChannels.email.recipients.filter(
      (r) => r !== email
    );
    updateNotificationChannel('email', 'recipients', recipients);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alert Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure thresholds and notification channels for anomaly alerts
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Alert Thresholds */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Alert Thresholds
          </h2>
          <div className="space-y-4">
            {settings.thresholds.map((threshold) => (
              <div
                key={threshold.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={threshold.enabled}
                        onChange={() => toggleThreshold(threshold.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                        {threshold.name}
                      </label>
                    </div>
                    <p className="mt-1 ml-7 text-sm text-gray-600 dark:text-gray-400">
                      {threshold.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={threshold.threshold}
                        onChange={(e) =>
                          updateThresholdValue(threshold.id, Number(e.target.value))
                        }
                        disabled={!threshold.enabled}
                        className="w-20 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        step={threshold.type === 'ctr_drop' ? '0.1' : '1'}
                        min="0"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {threshold.type === 'ctr_drop' ? '%' : '%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Email Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notificationChannels.email.enabled}
                onChange={(e) =>
                  updateNotificationChannel('email', 'enabled', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Enable email notifications
              </label>
            </div>

            {settings.notificationChannels.email.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipients
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addEmailRecipient((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={(e) => {
                      const input =
                        e.currentTarget.previousElementSibling as HTMLInputElement;
                      addEmailRecipient(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.notificationChannels.email.recipients.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">
                        {email}
                      </span>
                      <button
                        onClick={() => removeEmailRecipient(email)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {settings.notificationChannels.email.recipients.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No recipients added yet
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Note: Requires RESEND_API_KEY environment variable
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Slack Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Slack Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notificationChannels.slack.enabled}
                onChange={(e) =>
                  updateNotificationChannel('slack', 'enabled', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Enable Slack notifications
              </label>
            </div>

            {settings.notificationChannels.slack.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.notificationChannels.slack.webhookUrl}
                  onChange={(e) =>
                    updateNotificationChannel('slack', 'webhookUrl', e.target.value)
                  }
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Get your webhook URL from Slack:{' '}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Incoming Webhooks
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
