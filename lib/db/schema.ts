import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// SQLite doesn't have native enums, so we use text with check constraints
// Enum values are enforced at the application level

// Organizations table
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),

  // API Credentials (encrypted)
  calendlyAccessToken: text('calendly_access_token'),
  calendlyUserUri: text('calendly_user_uri'),
  stripeSecretKey: text('stripe_secret_key'),
  googleSheetsId: text('google_sheets_id'),
  metaAccessToken: text('meta_access_token'),
  metaAdAccountId: text('meta_ad_account_id'),

  // Google Ads OAuth credentials (encrypted)
  googleAdsClientId: text('google_ads_client_id'),
  googleAdsClientSecret: text('google_ads_client_secret'),
  googleAdsRefreshToken: text('google_ads_refresh_token'),
  googleAdsCustomerId: text('google_ads_customer_id'),

  // Organization settings
  logoUrl: text('logo_url'),
  status: text('status', { enum: ['active', 'inactive', 'trial'] }).notNull().default('trial'),

  // Brand Voice Profile (JSON stored as text)
  brandVoiceProfile: text('brand_voice_profile'), // JSON: brand identity, tone, examples, rules

  // Timestamps (stored as ISO strings in SQLite)
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  subdomainIdx: uniqueIndex('subdomain_idx').on(table.subdomain),
}));

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'viewer'] }).notNull().default('viewer'),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
  organizationIdx: index('user_organization_idx').on(table.organizationId),
}));

// API Logs table (audit trail)
export const apiLogs = sqliteTable('api_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  apiName: text('api_name').notNull(), // ex: "calendly", "stripe", "meta"
  endpoint: text('endpoint').notNull(), // ex: "/api/calendly/events"
  status: text('status', { enum: ['success', 'error'] }).notNull(),
  errorMessage: text('error_message'),

  // Timestamp
  timestamp: text('timestamp').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('log_organization_idx').on(table.organizationId),
  timestampIdx: index('log_timestamp_idx').on(table.timestamp),
}));

// AI Prompts table (database-stored prompts for AI generation)
export const aiPrompts = sqliteTable('ai_prompts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  category: text('category', { enum: ['meta_ads', 'google_ads'] }).notNull(),
  promptType: text('prompt_type', { enum: ['default', 'local_business', 'ecommerce', 'saas', 'custom'] }).notNull().default('custom'),

  promptText: text('prompt_text').notNull(),

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),

  usageCount: integer('usage_count').notNull().default(0),
  avgQualityScore: text('avg_quality_score'), // Stored as text in SQLite

  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('prompt_organization_idx').on(table.organizationId),
  categoryIdx: index('prompt_category_idx').on(table.category),
  isDefaultIdx: index('prompt_is_default_idx').on(table.isDefault),
  isActiveIdx: index('prompt_is_active_idx').on(table.isActive),
}));

// Ads table (AI-generated and manual ad variations)
export const ads = sqliteTable('ads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Ad metadata
  ai_generated: integer('ai_generated', { mode: 'boolean' }).notNull().default(false),
  ai_prompt: text('ai_prompt'), // Formula: "PASTOR", "Story-Bridge", "Social Proof"
  status: text('status', { enum: ['draft', 'active', 'paused', 'archived'] }).notNull().default('draft'),
  ad_type: text('ad_type', { enum: ['meta', 'google'] }).notNull(),

  // Ad content
  headline: text('headline').notNull(), // Hook text
  body_text: text('body_text').notNull(), // Full copy
  call_to_action: text('call_to_action').notNull(), // CTA
  landing_page: text('landing_page'), // URL

  // Metrics
  word_count: integer('word_count'),
  platform_ad_id: text('platform_ad_id'), // ID from Meta/Google if published

  // Platform-specific configuration (JSON stored as text)
  platform_config: text('platform_config'), // Complex data for Google Ads RSA + extensions

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('ad_organization_idx').on(table.organizationId),
  statusIdx: index('ad_status_idx').on(table.status),
  aiGeneratedIdx: index('ad_ai_generated_idx').on(table.ai_generated),
  createdAtIdx: index('ad_created_at_idx').on(table.createdAt),
}));

// Customer Avatars table (AI-generated customer personas for ad rating)
export const customerAvatars = sqliteTable('customer_avatars', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Avatar Set Info
  setName: text('set_name', { length: 100 }).notNull(), // "E-commerce Store Owners"
  niche: text('niche', { length: 200 }).notNull(), // "ecommerce store owner"
  description: text('description'), // Optional description of the set

  // Individual Avatar Data
  avatarName: text('avatar_name', { length: 100 }).notNull(), // "Sarah Chen"
  personaData: text('persona_data').notNull(), // JSON: demographics, psychographics, etc.

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationSetIdx: index('avatar_organization_set_idx').on(table.organizationId, table.setName),
  activeIdx: index('avatar_active_idx').on(table.isActive),
}));

// Ad Ratings table (Avatar feedback on ads)
export const adRatings = sqliteTable('ad_ratings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text('ad_id').references(() => ads.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Avatar Set Info
  avatarSetName: text('avatar_set_name', { length: 100 }).notNull(),
  niche: text('niche', { length: 200 }).notNull(),

  // Raw feedback from each avatar (JSON)
  avatarFeedbacks: text('avatar_feedbacks').notNull(), // JSON: { [avatarName]: { feedback, sentiment, processing_time } }

  // Summary stats
  totalAvatars: integer('total_avatars').notNull().default(13),
  positiveCount: integer('positive_count').notNull().default(0),
  mixedCount: integer('mixed_count').notNull().default(0),
  negativeCount: integer('negative_count').notNull().default(0),

  processingTimeMs: integer('processing_time_ms'), // Total time to rate

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  adOrganizationIdx: index('rating_ad_organization_idx').on(table.adId, table.organizationId),
  organizationIdx: index('rating_organization_idx').on(table.organizationId),
  createdAtIdx: index('rating_created_at_idx').on(table.createdAt),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  apiLogs: many(apiLogs),
  ads: many(ads),
  aiPrompts: many(aiPrompts),
  customerAvatars: many(customerAvatars),
  adRatings: many(adRatings),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  apiLogs: many(apiLogs),
  ads: many(ads),
  aiPrompts: many(aiPrompts),
}));

export const apiLogsRelations = relations(apiLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiLogs.userId],
    references: [users.id],
  }),
}));

export const adsRelations = relations(ads, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [ads.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
  ratings: many(adRatings),
}));

export const aiPromptsRelations = relations(aiPrompts, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiPrompts.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [aiPrompts.createdBy],
    references: [users.id],
  }),
}));

export const customerAvatarsRelations = relations(customerAvatars, ({ one }) => ({
  organization: one(organizations, {
    fields: [customerAvatars.organizationId],
    references: [organizations.id],
  }),
}));

export const adRatingsRelations = relations(adRatings, ({ one }) => ({
  ad: one(ads, {
    fields: [adRatings.adId],
    references: [ads.id],
  }),
  organization: one(organizations, {
    fields: [adRatings.organizationId],
    references: [organizations.id],
  }),
}));

// ============================================
// BUSINESS OPERATING SYSTEM (Product 2)
// ============================================

// KPI Snapshots table (Company-level daily metrics)
export const kpiSnapshots = sqliteTable('kpi_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Which user logged this data (for attribution, but data is shared)
  userId: text('user_id').notNull().references(() => users.id),

  // Date for this snapshot (stored as YYYY-MM-DD string)
  date: text('date').notNull(), // "2024-01-15"

  // Funnel metrics
  exposure: integer('exposure').notNull().default(0),
  leads: integer('leads').notNull().default(0),
  qualifiedLeads: integer('qualified_leads').notNull().default(0),
  ss1Total: integer('ss1_total').notNull().default(0),
  ss1SixBoxes: integer('ss1_six_boxes').notNull().default(0),
  ss1DMs: integer('ss1_dms').notNull().default(0),
  checkIns: integer('check_ins').notNull().default(0),
  prescriptionClose: integer('prescription_close').notNull().default(0),
  closes: integer('closes').notNull().default(0),
  upsells: integer('upsells').notNull().default(0),
  churn: integer('churn').notNull().default(0),

  // Why people churned (text notes)
  churnReasons: text('churn_reasons'),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('kpi_organization_idx').on(table.organizationId),
  dateIdx: index('kpi_date_idx').on(table.date),
  organizationDateIdx: uniqueIndex('kpi_organization_date_idx').on(table.organizationId, table.date), // One entry per org per day
}));

// Income Activities table (User-level attribution)
export const incomeActivities = sqliteTable('income_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Which user did this activity
  userId: text('user_id').notNull().references(() => users.id),

  // Date of activity (stored as YYYY-MM-DD string)
  date: text('date').notNull(),

  // Activity details
  activityType: text('activity_type', { enum: ['content', 'dm', 'call', 'close', 'other'] }).notNull(),
  description: text('description'),
  value: integer('value'), // Revenue if applicable (in cents to avoid decimals)

  // Link to funnel stage
  funnelStage: text('funnel_stage', { enum: ['exposure', 'lead', 'qualified', 'ss1', 'checkin', 'prescription', 'close', 'upsell'] }),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('activity_organization_idx').on(table.organizationId),
  userIdx: index('activity_user_idx').on(table.userId),
  dateIdx: index('activity_date_idx').on(table.date),
}));

// Relations for KPIs
export const kpiSnapshotsRelations = relations(kpiSnapshots, ({ one }) => ({
  organization: one(organizations, {
    fields: [kpiSnapshots.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [kpiSnapshots.userId],
    references: [users.id],
  }),
}));

export const incomeActivitiesRelations = relations(incomeActivities, ({ one }) => ({
  organization: one(organizations, {
    fields: [incomeActivities.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [incomeActivities.userId],
    references: [users.id],
  }),
}));

// Update organizations relations to include KPIs
export const organizationsRelationsExtended = relations(organizations, ({ many }) => ({
  users: many(users),
  apiLogs: many(apiLogs),
  ads: many(ads),
  aiPrompts: many(aiPrompts),
  customerAvatars: many(customerAvatars),
  adRatings: many(adRatings),
  kpiSnapshots: many(kpiSnapshots),
  incomeActivities: many(incomeActivities),
}));

// Types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type NewAiPrompt = typeof aiPrompts.$inferInsert;

export type CustomerAvatar = typeof customerAvatars.$inferSelect;
export type NewCustomerAvatar = typeof customerAvatars.$inferInsert;

export type AdRating = typeof adRatings.$inferSelect;
export type NewAdRating = typeof adRatings.$inferInsert;

export type KpiSnapshot = typeof kpiSnapshots.$inferSelect;
export type NewKpiSnapshot = typeof kpiSnapshots.$inferInsert;

export type IncomeActivity = typeof incomeActivities.$inferSelect;
export type NewIncomeActivity = typeof incomeActivities.$inferInsert;
