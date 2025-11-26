/**
 * Calendly API Types
 * Based on Calendly API v2
 * https://developer.calendly.com/api-docs
 */

/**
 * Event Status in Calendly
 */
export type CalendlyEventStatus = 'active' | 'canceled';

/**
 * Invitee Status
 */
export type InviteeStatus = 'active' | 'canceled';

/**
 * Calendly Event (Scheduled Meeting)
 */
export interface CalendlyEvent {
  uri: string;
  name: string;
  status: CalendlyEventStatus;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  event_type: string;
  location?: {
    type: string;
    location?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Calendly Invitee (Person who booked)
 */
export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: InviteeStatus;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
  }>;
  timezone: string;
  event: string; // Event URI
  created_at: string;
  updated_at: string;
  canceled: boolean;
  cancellation?: {
    canceled_by: string;
    reason?: string;
  };
  no_show?: {
    created_at: string;
  };
}

/**
 * Calendly API Response (Paginated)
 */
export interface CalendlyEventsResponse {
  collection: CalendlyEvent[];
  pagination: {
    count: number;
    next_page?: string;
    previous_page?: string;
    next_page_token?: string;
    previous_page_token?: string;
  };
}

export interface CalendlyInviteesResponse {
  collection: CalendlyInvitee[];
  pagination: {
    count: number;
    next_page?: string;
    previous_page?: string;
    next_page_token?: string;
    previous_page_token?: string;
  };
}

/**
 * Calendly User Info
 */
export interface CalendlyUser {
  uri: string;
  name: string;
  slug: string;
  email: string;
  scheduling_url: string;
  timezone: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  current_organization: string;
}

/**
 * Dashboard Metrics (Simplified for Dashboard Display)
 */
export interface CalendlyMetrics {
  totalBooked: number;
  completed: number;
  noShows: number;
  conversionRate: number; // (completed / totalBooked) * 100
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated?: string;
  events?: CalendlyEvent[];
  invitees?: CalendlyInvitee[];
}

/**
 * API Request Parameters
 */
export interface CalendlyAPIParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status?: 'active' | 'canceled';
  count?: number; // Results per page (max 100)
}

/**
 * Error Response
 */
export interface CalendlyErrorResponse {
  title: string;
  message: string;
  details?: Array<{
    parameter: string;
    message: string;
  }>;
}
