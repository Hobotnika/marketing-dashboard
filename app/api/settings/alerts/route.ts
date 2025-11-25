import { NextRequest, NextResponse } from 'next/server';
import {
  readAlertSettings,
  writeAlertSettings,
  updateThreshold,
  updateNotificationChannels,
} from '@/lib/alert-storage';
import { AlertSettings } from '@/types/alerts';

/**
 * GET /api/settings/alerts
 * Retrieve current alert settings
 */
export async function GET() {
  try {
    const settings = readAlertSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[API] Error reading alert settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read alert settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/alerts
 * Update alert settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'update-threshold') {
      const { thresholdId, enabled, threshold } = data;
      const success = updateThreshold(thresholdId, { enabled, threshold });

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to update threshold' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Threshold updated successfully',
      });
    }

    if (action === 'update-notifications') {
      const { notificationChannels } = data;
      const success = updateNotificationChannels(notificationChannels);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to update notification channels' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification channels updated successfully',
      });
    }

    if (action === 'update-all') {
      const { settings } = data as { settings: AlertSettings };
      const success = writeAlertSettings(settings);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to update settings' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Error updating alert settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert settings' },
      { status: 500 }
    );
  }
}
