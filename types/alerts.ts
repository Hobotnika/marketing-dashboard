export interface AlertThreshold {
  id: string;
  name: string;
  type: 'spend_increase' | 'ctr_drop' | 'conversion_drop' | 'cost_per_conv_increase';
  enabled: boolean;
  threshold: number; // percentage or absolute value
  description: string;
}

export interface AlertSettings {
  thresholds: AlertThreshold[];
  notificationChannels: {
    email: {
      enabled: boolean;
      recipients: string[];
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
    };
  };
  dashboardUrl: string;
}

export interface Anomaly {
  id: string;
  type: AlertThreshold['type'];
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage change
  detectedAt: string;
  platform: 'google' | 'meta' | 'both';
}

export interface NotificationPayload {
  anomaly: Anomaly;
  dashboardUrl: string;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    id: 'spend-increase',
    name: 'Spend Increase Alert',
    type: 'spend_increase',
    enabled: true,
    threshold: 30, // 30% increase
    description: 'Alert when ad spend increases by more than 30% without proportional conversion increase',
  },
  {
    id: 'ctr-drop',
    name: 'CTR Drop Alert',
    type: 'ctr_drop',
    enabled: true,
    threshold: 2.0, // CTR below 2.0%
    description: 'Alert when click-through rate falls below 2.0%',
  },
  {
    id: 'conversion-drop',
    name: 'Conversion Drop Alert',
    type: 'conversion_drop',
    enabled: true,
    threshold: 20, // 20% decrease
    description: 'Alert when conversions drop by more than 20%',
  },
  {
    id: 'cost-per-conv-increase',
    name: 'Cost Per Conversion Increase',
    type: 'cost_per_conv_increase',
    enabled: true,
    threshold: 25, // 25% increase
    description: 'Alert when cost per conversation increases by more than 25%',
  },
];
