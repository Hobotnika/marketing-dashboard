import { Anomaly, NotificationPayload } from '@/types/alerts';

/**
 * Send email notification using Resend API
 */
export async function sendEmailNotification(
  anomaly: Anomaly,
  recipients: string[],
  dashboardUrl: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('[NOTIFICATIONS] Resend API key not configured');
    return false;
  }

  try {
    const severityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #F9FAFB; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
            .alert-box { background: white; border-left: 4px solid ${anomaly.severity === 'high' ? '#DC2626' : anomaly.severity === 'medium' ? '#F59E0B' : '#3B82F6'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .metric { display: inline-block; margin-right: 30px; margin-top: 15px; }
            .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1F2937; }
            .cta-button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Marketing Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Anomaly detected in your advertising campaigns</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #1F2937;">
                  ${severityEmoji[anomaly.severity]} ${anomaly.title}
                </h2>
                <p style="color: #4B5563; line-height: 1.6;">
                  ${anomaly.description}
                </p>
                <div style="margin-top: 20px;">
                  <div class="metric">
                    <div class="metric-label">Previous Value</div>
                    <div class="metric-value">${formatValue(anomaly.previousValue, anomaly.type)}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Current Value</div>
                    <div class="metric-value">${formatValue(anomaly.currentValue, anomaly.type)}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Change</div>
                    <div class="metric-value" style="color: ${anomaly.change > 0 ? '#DC2626' : '#10B981'};">
                      ${anomaly.change > 0 ? '+' : ''}${anomaly.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              <p style="color: #6B7280; font-size: 14px;">
                <strong>Platform:</strong> ${anomaly.platform === 'google' ? 'Google Ads' : 'Meta Ads'}<br>
                <strong>Detected at:</strong> ${new Date(anomaly.detectedAt).toLocaleString()}<br>
                <strong>Severity:</strong> ${anomaly.severity.toUpperCase()}
              </p>
              <a href="${dashboardUrl}" class="cta-button">View Dashboard →</a>
            </div>
            <div class="footer">
              <p>This is an automated alert from your Marketing Dashboard</p>
              <p>Manage alert settings in your dashboard settings</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Marketing Dashboard <alerts@yourdomain.com>',
        to: recipients,
        subject: `⚠️ ${anomaly.severity.toUpperCase()} Alert: ${anomaly.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NOTIFICATIONS] Email send failed:', error);
      return false;
    }

    console.log(`[NOTIFICATIONS] Email sent to ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending email:', error);
    return false;
  }
}

/**
 * Send Slack notification
 */
export async function sendSlackNotification(
  anomaly: Anomaly,
  webhookUrl: string,
  dashboardUrl: string
): Promise<boolean> {
  if (!webhookUrl) {
    console.warn('[NOTIFICATIONS] Slack webhook URL not configured');
    return false;
  }

  try {
    const severityColor = {
      low: '#3B82F6',
      medium: '#F59E0B',
      high: '#DC2626',
    };

    const severityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    };

    const slackPayload = {
      text: `${severityEmoji[anomaly.severity]} Marketing Alert: ${anomaly.title}`,
      attachments: [
        {
          color: severityColor[anomaly.severity],
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${severityEmoji[anomaly.severity]} ${anomaly.title}`,
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: anomaly.description,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Platform:*\n${anomaly.platform === 'google' ? 'Google Ads' : 'Meta Ads'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Severity:*\n${anomaly.severity.toUpperCase()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Previous Value:*\n${formatValue(anomaly.previousValue, anomaly.type)}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Current Value:*\n${formatValue(anomaly.currentValue, anomaly.type)}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Change:*\n${anomaly.change > 0 ? '+' : ''}${anomaly.change.toFixed(1)}%`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Detected:*\n${new Date(anomaly.detectedAt).toLocaleString()}`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'View Dashboard',
                    emoji: true,
                  },
                  url: dashboardUrl,
                  style: 'primary',
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NOTIFICATIONS] Slack send failed:', error);
      return false;
    }

    console.log('[NOTIFICATIONS] Slack notification sent');
    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Format value based on anomaly type
 */
function formatValue(value: number, type: string): string {
  if (type === 'spend_increase' || type === 'cost_per_conv_increase') {
    return `$${value.toFixed(2)}`;
  } else if (type === 'ctr_drop') {
    return `${value.toFixed(2)}%`;
  } else {
    return value.toLocaleString();
  }
}

/**
 * Send notifications via all enabled channels
 */
export async function sendAnomalyNotifications(
  anomalies: Anomaly[],
  emailRecipients: string[],
  slackWebhook: string,
  dashboardUrl: string
): Promise<void> {
  for (const anomaly of anomalies) {
    // Send email notifications
    if (emailRecipients.length > 0) {
      await sendEmailNotification(anomaly, emailRecipients, dashboardUrl);
    }

    // Send Slack notifications
    if (slackWebhook) {
      await sendSlackNotification(anomaly, slackWebhook, dashboardUrl);
    }
  }
}
