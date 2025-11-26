/**
 * Stripe API Types
 * Based on Stripe API v2024-11-20
 * https://stripe.com/docs/api
 */

/**
 * Stripe Charge Object (simplified)
 */
export interface StripeCharge {
  id: string;
  object: 'charge';
  amount: number; // Amount in cents
  amount_captured: number;
  amount_refunded: number;
  currency: string; // 'usd', 'brl', etc.
  created: number; // Unix timestamp
  description?: string;
  status: 'succeeded' | 'pending' | 'failed';
  paid: boolean;
  refunded: boolean;
  metadata?: Record<string, string>;
  customer?: string;
}

/**
 * Stripe Payment Intent (simplified)
 */
export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number; // Amount in cents
  amount_received: number;
  currency: string;
  created: number; // Unix timestamp
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'canceled';
  description?: string;
  metadata?: Record<string, string>;
  customer?: string;
}

/**
 * Stripe API List Response
 */
export interface StripeListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
}

/**
 * Revenue Metrics (Dashboard Display)
 */
export interface RevenueMetrics {
  totalRevenue: number; // USD (converted from cents)
  totalConversions: number; // Number of successful charges
  averageOrderValue: number; // Average per conversion
  roas: number; // Return on Ad Spend (revenue / ad spend)
  profit: number; // revenue - ad spend
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  lastUpdated?: string;
  charges?: StripeCharge[];
}

/**
 * Weekly Revenue Breakdown (for charts)
 */
export interface WeeklyRevenue {
  week: string; // "Week 1", "Week 2", etc.
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  revenue: number; // USD
  conversions: number;
  adSpend: number; // Combined Google + Meta
  profit: number; // revenue - adSpend
}

/**
 * ROAS Calculation Helper
 */
export interface ROASCalculation {
  revenue: number;
  adSpend: number;
  roas: number; // revenue / adSpend
  roasFormatted: string; // "3.2x"
  status: 'excellent' | 'good' | 'poor'; // > 3x, 1-3x, < 1x
  color: 'green' | 'yellow' | 'red';
}

/**
 * API Request Parameters
 */
export interface StripeAPIParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  limit?: number; // Results per page (max 100)
  currency?: string; // Filter by currency
}

/**
 * Error Response
 */
export interface StripeErrorResponse {
  error: {
    type: string;
    message: string;
    code?: string;
    param?: string;
  };
}
