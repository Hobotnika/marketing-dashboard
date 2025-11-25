import * as fs from 'fs';
import * as path from 'path';
import { AlertSettings, DEFAULT_ALERT_THRESHOLDS } from '@/types/alerts';

const SETTINGS_DIR = path.join(process.cwd(), '.cache');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'alert-settings.json');

/**
 * Get default alert settings
 */
export function getDefaultSettings(): AlertSettings {
  return {
    thresholds: DEFAULT_ALERT_THRESHOLDS,
    notificationChannels: {
      email: {
        enabled: false,
        recipients: [],
      },
      slack: {
        enabled: false,
        webhookUrl: '',
      },
    },
    dashboardUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  };
}

/**
 * Read alert settings from file
 */
export function readAlertSettings(): AlertSettings {
  try {
    // Ensure directory exists
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }

    // Check if file exists
    if (!fs.existsSync(SETTINGS_FILE)) {
      // Create default settings
      const defaultSettings = getDefaultSettings();
      writeAlertSettings(defaultSettings);
      return defaultSettings;
    }

    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data) as AlertSettings;

    // Merge with defaults in case new thresholds were added
    const defaultSettings = getDefaultSettings();
    const mergedThresholds = [
      ...settings.thresholds,
      ...defaultSettings.thresholds.filter(
        (dt) => !settings.thresholds.find((t) => t.id === dt.id)
      ),
    ];

    return {
      ...settings,
      thresholds: mergedThresholds,
    };
  } catch (error) {
    console.error('[ALERT-STORAGE] Error reading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Write alert settings to file
 */
export function writeAlertSettings(settings: AlertSettings): boolean {
  try {
    // Ensure directory exists
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('[ALERT-STORAGE] Error writing settings:', error);
    return false;
  }
}

/**
 * Update a specific threshold
 */
export function updateThreshold(
  thresholdId: string,
  updates: Partial<{
    enabled: boolean;
    threshold: number;
  }>
): boolean {
  try {
    const settings = readAlertSettings();
    const thresholdIndex = settings.thresholds.findIndex(
      (t) => t.id === thresholdId
    );

    if (thresholdIndex === -1) {
      return false;
    }

    settings.thresholds[thresholdIndex] = {
      ...settings.thresholds[thresholdIndex],
      ...updates,
    };

    return writeAlertSettings(settings);
  } catch (error) {
    console.error('[ALERT-STORAGE] Error updating threshold:', error);
    return false;
  }
}

/**
 * Update notification channels
 */
export function updateNotificationChannels(
  channels: AlertSettings['notificationChannels']
): boolean {
  try {
    const settings = readAlertSettings();
    settings.notificationChannels = channels;
    return writeAlertSettings(settings);
  } catch (error) {
    console.error('[ALERT-STORAGE] Error updating notification channels:', error);
    return false;
  }
}
