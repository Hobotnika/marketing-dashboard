/**
 * Lead Attribution System Types
 * Tracks leads from multiple sources (ads, manual, organic)
 */

/**
 * Lead Source Types
 */
export type LeadSource =
  | 'whatsapp'
  | 'instagram_dm'
  | 'phone_call'
  | 'website_form'
  | 'google_ads'
  | 'meta_ads'
  | 'email'
  | 'referral'
  | 'other';

/**
 * Lead Status in Sales Pipeline
 */
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'meeting_booked'
  | 'converted'
  | 'lost';

/**
 * Lead Object (Database Schema)
 */
export interface Lead {
  id: string; // UUID
  name: string;
  phone?: string;
  email?: string;
  source: LeadSource;
  campaign_id?: string; // Link to ad campaign (if from ads)
  status: LeadStatus;
  value?: number; // Deal value if converted (USD)
  notes?: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  converted_at?: string; // ISO 8601 (when status became 'converted')
}

/**
 * Lead Source Attribution (Aggregated)
 */
export interface LeadSourceAttribution {
  source: LeadSource;
  count: number;
  converted: number;
  conversionRate: number; // Percentage (0-100)
  totalValue: number; // Sum of converted lead values
  averageValue: number; // Average value per converted lead
}

/**
 * Lead Stats by Status
 */
export interface LeadStatusStats {
  status: LeadStatus;
  count: number;
  percentage: number; // Of total leads
}

/**
 * Lead Filters (for GET /api/leads)
 */
export interface LeadFilters {
  source?: LeadSource | LeadSource[];
  status?: LeadStatus | LeadStatus[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  search?: string; // Search in name, phone, email
  limit?: number;
  offset?: number;
}

/**
 * Create Lead Request
 */
export interface CreateLeadRequest {
  name: string;
  phone?: string;
  email?: string;
  source: LeadSource;
  campaign_id?: string;
  status?: LeadStatus; // Default: 'new'
  value?: number;
  notes?: string;
}

/**
 * Update Lead Request
 */
export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  email?: string;
  source?: LeadSource;
  campaign_id?: string;
  status?: LeadStatus;
  value?: number;
  notes?: string;
}

/**
 * Lead Source Icons (for UI)
 */
export const LEAD_SOURCE_ICONS: Record<LeadSource, string> = {
  whatsapp: '💬',
  instagram_dm: '📷',
  phone_call: '📞',
  website_form: '🌐',
  google_ads: '🔍',
  meta_ads: '📘',
  email: '📧',
  referral: '🤝',
  other: '📋',
};

/**
 * Lead Source Labels
 */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  instagram_dm: 'Instagram DM',
  phone_call: 'Phone Call',
  website_form: 'Website Form',
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  email: 'Email',
  referral: 'Referral',
  other: 'Other',
};

/**
 * Lead Status Labels
 */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  meeting_booked: 'Meeting Booked',
  converted: 'Converted',
  lost: 'Lost',
};

/**
 * Lead Status Colors (for UI)
 */
export const LEAD_STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  new: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  contacted: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  qualified: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  meeting_booked: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  converted: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  lost: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

/**
 * Google Sheets Import Row
 */
export interface GoogleSheetsLeadRow {
  Name: string;
  Phone?: string;
  Email?: string;
  Source: string;
  Status?: string;
  Value?: string;
  Notes?: string;
  Date?: string;
}
