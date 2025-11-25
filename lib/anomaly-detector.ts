import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics, MetaCampaignMetrics } from '@/types/meta-ads';
import { Anomaly, AlertSettings } from '@/types/alerts';
import * as fs from 'fs';
import * as path from 'path';

interface MetaDataStructure {
  campaigns: MetaCampaignMetrics[];
  totals: MetaAdsMetrics;
}

interface HistoricalMetrics {
  google: GoogleAdsMetrics | null;
  meta: MetaDataStructure | null;
  timestamp: string;
}

const HISTORY_FILE = path.join(process.cwd(), '.cache', 'metrics-history.json');

/**
 * Store current metrics as historical data for comparison
 */
export function storeHistoricalMetrics(
  google: GoogleAdsMetrics | null,
  meta: MetaDataStructure | null
): void {
  try {
    const history: HistoricalMetrics[] = readMetricsHistory();

    // Add current metrics
    history.push({
      google,
      meta,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 7 days (14 data points at 6-hour intervals per day)
    const maxRecords = 28;
    if (history.length > maxRecords) {
      history.splice(0, history.length - maxRecords);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('[ANOMALY] Error storing historical metrics:', error);
  }
}

/**
 * Read metrics history
 */
function readMetricsHistory(): HistoricalMetrics[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[ANOMALY] Error reading history:', error);
    return [];
  }
}

/**
 * Get previous metrics (24 hours ago, or closest available)
 */
function getPreviousMetrics(): HistoricalMetrics | null {
  const history = readMetricsHistory();
  if (history.length < 2) {
    return null; // Not enough data for comparison
  }

  // Get metrics from ~24 hours ago (4 intervals at 6 hours each)
  const targetIndex = Math.max(0, history.length - 5);
  return history[targetIndex];
}

/**
 * Calculate percentage change
 */
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Detect anomalies in current metrics compared to historical data
 */
export function detectAnomalies(
  currentGoogle: GoogleAdsMetrics | null,
  currentMeta: MetaDataStructure | null,
  settings: AlertSettings
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const previous = getPreviousMetrics();

  if (!previous) {
    console.log('[ANOMALY] Not enough historical data for anomaly detection');
    return anomalies;
  }

  const enabledThresholds = settings.thresholds.filter((t) => t.enabled);

  // Check Google Ads anomalies
  if (currentGoogle && previous.google) {
    // Check spend increase
    const spendThreshold = enabledThresholds.find(
      (t) => t.type === 'spend_increase'
    );
    if (spendThreshold) {
      const spendChange = calculateChange(
        currentGoogle.spend,
        previous.google.spend
      );
      const clicksChange = calculateChange(
        currentGoogle.clicks,
        previous.google.clicks
      );

      // Alert if spend increased significantly but clicks didn't increase proportionally
      if (
        spendChange > spendThreshold.threshold &&
        clicksChange < spendChange * 0.5
      ) {
        anomalies.push({
          id: `google-spend-${Date.now()}`,
          type: 'spend_increase',
          severity: spendChange > 50 ? 'high' : 'medium',
          title: 'Google Ads: Spend Increase Without Proportional Clicks',
          description: `Ad spend increased by ${spendChange.toFixed(1)}% but clicks only increased by ${clicksChange.toFixed(1)}%. This may indicate decreased campaign efficiency.`,
          currentValue: currentGoogle.spend,
          previousValue: previous.google.spend,
          change: spendChange,
          detectedAt: new Date().toISOString(),
          platform: 'google',
        });
      }
    }

    // Check CTR drop
    const ctrThreshold = enabledThresholds.find((t) => t.type === 'ctr_drop');
    if (ctrThreshold && currentGoogle.ctr < ctrThreshold.threshold) {
      const ctrChange = calculateChange(currentGoogle.ctr, previous.google.ctr);
      anomalies.push({
        id: `google-ctr-${Date.now()}`,
        type: 'ctr_drop',
        severity: currentGoogle.ctr < ctrThreshold.threshold * 0.5 ? 'high' : 'medium',
        title: 'Google Ads: Low Click-Through Rate',
        description: `CTR is ${currentGoogle.ctr.toFixed(2)}%, below the threshold of ${ctrThreshold.threshold}%. Consider reviewing ad copy and targeting.`,
        currentValue: currentGoogle.ctr,
        previousValue: previous.google.ctr,
        change: ctrChange,
        detectedAt: new Date().toISOString(),
        platform: 'google',
      });
    }
  }

  // Check Meta Ads anomalies
  if (currentMeta && previous.meta) {
    // Check spend increase
    const spendThreshold = enabledThresholds.find(
      (t) => t.type === 'spend_increase'
    );
    if (spendThreshold) {
      const spendChange = calculateChange(
        currentMeta.totals.spend,
        previous.meta.totals.spend
      );
      const convChange = calculateChange(
        currentMeta.totals.whatsappConversations,
        previous.meta.totals.whatsappConversations
      );

      if (
        spendChange > spendThreshold.threshold &&
        convChange < spendChange * 0.5
      ) {
        anomalies.push({
          id: `meta-spend-${Date.now()}`,
          type: 'spend_increase',
          severity: spendChange > 50 ? 'high' : 'medium',
          title: 'Meta Ads: Spend Increase Without Proportional Conversions',
          description: `Ad spend increased by ${spendChange.toFixed(1)}% but conversations only increased by ${convChange.toFixed(1)}%. Campaign performance may be declining.`,
          currentValue: currentMeta.totals.spend,
          previousValue: previous.meta.totals.spend,
          change: spendChange,
          detectedAt: new Date().toISOString(),
          platform: 'meta',
        });
      }
    }

    // Check cost per conversation increase
    const costPerConvThreshold = enabledThresholds.find(
      (t) => t.type === 'cost_per_conv_increase'
    );
    if (costPerConvThreshold) {
      const costChange = calculateChange(
        currentMeta.totals.avgCostPerConversation,
        previous.meta.totals.avgCostPerConversation
      );

      if (costChange > costPerConvThreshold.threshold) {
        anomalies.push({
          id: `meta-cost-${Date.now()}`,
          type: 'cost_per_conv_increase',
          severity: costChange > 40 ? 'high' : 'medium',
          title: 'Meta Ads: Cost Per Conversation Increased',
          description: `Average cost per conversation increased by ${costChange.toFixed(1)}% from $${previous.meta.totals.avgCostPerConversation.toFixed(2)} to $${currentMeta.totals.avgCostPerConversation.toFixed(2)}.`,
          currentValue: currentMeta.totals.avgCostPerConversation,
          previousValue: previous.meta.totals.avgCostPerConversation,
          change: costChange,
          detectedAt: new Date().toISOString(),
          platform: 'meta',
        });
      }
    }

    // Check conversion drop
    const convDropThreshold = enabledThresholds.find(
      (t) => t.type === 'conversion_drop'
    );
    if (convDropThreshold) {
      const convChange = calculateChange(
        currentMeta.totals.whatsappConversations,
        previous.meta.totals.whatsappConversations
      );

      if (convChange < -convDropThreshold.threshold) {
        anomalies.push({
          id: `meta-conv-drop-${Date.now()}`,
          type: 'conversion_drop',
          severity: convChange < -30 ? 'high' : 'medium',
          title: 'Meta Ads: Conversion Drop Detected',
          description: `WhatsApp conversations dropped by ${Math.abs(convChange).toFixed(1)}% from ${previous.meta.totals.whatsappConversations} to ${currentMeta.totals.whatsappConversations}.`,
          currentValue: currentMeta.totals.whatsappConversations,
          previousValue: previous.meta.totals.whatsappConversations,
          change: convChange,
          detectedAt: new Date().toISOString(),
          platform: 'meta',
        });
      }
    }
  }

  return anomalies;
}
