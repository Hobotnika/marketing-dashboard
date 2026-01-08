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
  category: text('category', { enum: ['meta_ads', 'google_ads', 'planning'] }).notNull(),
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

// Income Activities table (Financial tracking - Company-level)
export const incomeActivities = sqliteTable('income_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Which user logged this income
  userId: text('user_id').notNull().references(() => users.id),

  // Date of income (stored as YYYY-MM-DD string)
  date: text('date').notNull(),

  // Income source
  source: text('source', { enum: ['content_ads', 'messages_dms', 'strategy_calls', 'other'] }).notNull(),
  description: text('description'),
  amount: integer('amount'), // Revenue in cents to avoid decimals

  // Optional link to KPI stage
  kpisStage: text('kpis_stage'), // 'exposure', 'lead', 'qualified', 'ss1', etc.

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('income_organization_idx').on(table.organizationId),
  userIdx: index('income_user_idx').on(table.userId),
  dateIdx: index('income_date_idx').on(table.date),
  organizationDateIdx: index('income_organization_date_idx').on(table.organizationId, table.date),
}));

// Transactions table (Expense tracking - Company-level)
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Which user logged this transaction
  userId: text('user_id').notNull().references(() => users.id),

  // Date of transaction (stored as YYYY-MM-DD string)
  date: text('date').notNull(),

  // Transaction details
  category: text('category', {
    enum: ['ads', 'software', 'contractors', 'education', 'office', 'other']
  }).notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // Expense in cents

  // Optional metadata
  vendor: text('vendor'),
  notes: text('notes'),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('transaction_organization_idx').on(table.organizationId),
  userIdx: index('transaction_user_idx').on(table.userId),
  dateIdx: index('transaction_date_idx').on(table.date),
  categoryIdx: index('transaction_category_idx').on(table.category),
  organizationDateIdx: index('transaction_organization_date_idx').on(table.organizationId, table.date),
}));

// Cash Flow Snapshots table (Daily financial summaries - Company-level)
export const cashFlowSnapshots = sqliteTable('cash_flow_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Which user created this snapshot
  userId: text('user_id').notNull().references(() => users.id),

  // Date for this snapshot (stored as YYYY-MM-DD string)
  date: text('date').notNull(),

  // Totals (all amounts in cents)
  totalRevenue: integer('total_revenue').notNull().default(0),
  totalExpenses: integer('total_expenses').notNull().default(0),
  netCashFlow: integer('net_cash_flow').notNull().default(0),

  // Revenue breakdown by source
  revenueFromAds: integer('revenue_from_ads').notNull().default(0),
  revenueFromDMs: integer('revenue_from_dms').notNull().default(0),
  revenueFromCalls: integer('revenue_from_calls').notNull().default(0),
  revenueFromOther: integer('revenue_from_other').notNull().default(0),

  // Expense breakdown by category
  expenseAds: integer('expense_ads').notNull().default(0),
  expenseSoftware: integer('expense_software').notNull().default(0),
  expenseContractors: integer('expense_contractors').notNull().default(0),
  expenseEducation: integer('expense_education').notNull().default(0),
  expenseOffice: integer('expense_office').notNull().default(0),
  expenseOther: integer('expense_other').notNull().default(0),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('cashflow_organization_idx').on(table.organizationId),
  dateIdx: index('cashflow_date_idx').on(table.date),
  organizationDateIdx: uniqueIndex('cashflow_organization_date_idx').on(table.organizationId, table.date),
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

export const transactionsRelations = relations(transactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [transactions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const cashFlowSnapshotsRelations = relations(cashFlowSnapshots, ({ one }) => ({
  organization: one(organizations, {
    fields: [cashFlowSnapshots.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [cashFlowSnapshots.userId],
    references: [users.id],
  }),
}));

// ============================================
// CONGRUENCE MANIFESTO (Business OS - User Private)
// ============================================

// Daily routine tracking (user-private)
export const dailyRoutines = sqliteTable('daily_routines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + user-scoped
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Privacy flag (always true for congruence)
  isPrivate: integer('is_private', { mode: 'boolean' }).default(true).notNull(),

  // Date for this routine (stored as YYYY-MM-DD string)
  date: text('date').notNull(),

  // Morning routine items
  exerciseCompleted: integer('exercise_completed', { mode: 'boolean' }).default(false),
  exerciseType: text('exercise_type'), // "30min run", "gym workout"
  exerciseDuration: integer('exercise_duration'), // minutes

  gratitudeCompleted: integer('gratitude_completed', { mode: 'boolean' }).default(false),
  gratitudeEntry: text('gratitude_entry'), // What they're grateful for

  meditationCompleted: integer('meditation_completed', { mode: 'boolean' }).default(false),
  meditationDuration: integer('meditation_duration'), // minutes

  breathworkCompleted: integer('breathwork_completed', { mode: 'boolean' }).default(false),
  breathworkDuration: integer('breathwork_duration'), // minutes

  // Self-image check-in (optional daily reflection)
  selfImageUpdate: text('self_image_update'),

  // Overall completion (calculated)
  completionRate: integer('completion_rate'), // 0-100%

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('routine_organization_idx').on(table.organizationId),
  userIdx: index('routine_user_idx').on(table.userId),
  dateIdx: index('routine_date_idx').on(table.date),
  // Unique: one routine per user per day
  uniqueUserDate: uniqueIndex('routine_unique_user_date_idx').on(table.organizationId, table.userId, table.date),
}));

// Principles & purpose (user-private, infrequently updated)
export const userPrinciples = sqliteTable('user_principles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  isPrivate: integer('is_private', { mode: 'boolean' }).default(true).notNull(),

  // Core principles (stored as JSON string array)
  principles: text('principles'), // JSON: ["Be present", "Add value", "Stay curious"]

  // Life purpose statement
  purpose: text('purpose'),

  // Self-image document (longer reflection)
  selfImage: text('self_image'),

  // When to show reminders
  showPrincipleReminder: integer('show_principle_reminder', { mode: 'boolean' }).default(true),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('principles_organization_idx').on(table.organizationId),
  userIdx: index('principles_user_idx').on(table.userId),
  // Unique: one principles record per user
  uniqueUser: uniqueIndex('principles_unique_user_idx').on(table.organizationId, table.userId),
}));

// Relations for Congruence tables
export const dailyRoutinesRelations = relations(dailyRoutines, ({ one }) => ({
  organization: one(organizations, {
    fields: [dailyRoutines.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [dailyRoutines.userId],
    references: [users.id],
  }),
}));

export const userPrinciplesRelations = relations(userPrinciples, ({ one }) => ({
  organization: one(organizations, {
    fields: [userPrinciples.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [userPrinciples.userId],
    references: [users.id],
  }),
}));

// ============================================
// MARKETING ENGINE (Section 4)
// ============================================

// Market Definition (WHO) - One per organization
export const marketDefinitions = sqliteTable('market_definitions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Who created/updated
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Market data
  targetMarketDescription: text('target_market_description'), // 500 chars
  primarySegment: text('primary_segment'), // 100 chars
  secondarySegment: text('secondary_segment'), // 100 chars
  nichePositioning: text('niche_positioning'),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('market_def_organization_idx').on(table.organizationId),
  // Unique: one market definition per organization
  uniqueOrg: uniqueIndex('market_def_unique_org_idx').on(table.organizationId),
}));

// Message Framework (WHAT) - One per organization
export const messageFrameworks = sqliteTable('message_frameworks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Core message
  valueProposition: text('value_proposition'), // 200 chars

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('msg_framework_organization_idx').on(table.organizationId),
  uniqueOrg: uniqueIndex('msg_framework_unique_org_idx').on(table.organizationId),
}));

// Pain Points - Child of messageFrameworks
export const painPoints = sqliteTable('pain_points', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + Parent reference
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  messageFrameworkId: text('message_framework_id')
    .notNull()
    .references(() => messageFrameworks.id, { onDelete: 'cascade' }),

  // Pain point data
  description: text('description').notNull(), // 100 chars
  displayOrder: integer('display_order').notNull().default(0),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('pain_point_organization_idx').on(table.organizationId),
  frameworkIdx: index('pain_point_framework_idx').on(table.messageFrameworkId),
}));

// USPs - Child of messageFrameworks
export const usps = sqliteTable('usps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + Parent reference
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  messageFrameworkId: text('message_framework_id')
    .notNull()
    .references(() => messageFrameworks.id, { onDelete: 'cascade' }),

  // USP data
  title: text('title').notNull(), // 50 chars
  description: text('description').notNull(), // 150 chars
  displayOrder: integer('display_order').notNull().default(0),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('usp_organization_idx').on(table.organizationId),
  frameworkIdx: index('usp_framework_idx').on(table.messageFrameworkId),
}));

// Content Calendar - Multi-platform content planning
export const contentCalendar = sqliteTable('content_calendar', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Content details
  platform: text('platform', {
    enum: ['email', 'linkedin', 'instagram', 'facebook']
  }).notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  contentType: text('content_type').notNull(), // 'post', 'story', 'email', 'article', 'video'
  status: text('status', {
    enum: ['idea', 'drafted', 'scheduled', 'published']
  }).notNull().default('idea'),

  title: text('title').notNull(), // 100 chars
  body: text('body'), // 500 chars
  notes: text('notes'),

  publishedAt: text('published_at'), // ISO timestamp when published

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('content_calendar_organization_idx').on(table.organizationId),
  dateIdx: index('content_calendar_date_idx').on(table.scheduledDate),
  platformIdx: index('content_calendar_platform_idx').on(table.platform),
  statusIdx: index('content_calendar_status_idx').on(table.status),
  organizationDateIdx: index('content_calendar_org_date_idx').on(table.organizationId, table.scheduledDate),
}));

// Competitors - Track competitive landscape
export const competitors = sqliteTable('competitors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Competitor info
  name: text('name').notNull(), // 100 chars
  website: text('website'), // 255 chars
  description: text('description'), // 300 chars
  strengths: text('strengths'), // What they do well
  weaknesses: text('weaknesses'), // What they're missing

  lastAnalyzedAt: text('last_analyzed_at'), // ISO timestamp

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('competitor_organization_idx').on(table.organizationId),
}));

// ============================================
// UNIVERSAL AI INFRASTRUCTURE (Business OS)
// ============================================

// AI Prompt Templates table (Universal AI system for all sections)
export const aiPromptTemplates = sqliteTable('ai_prompt_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Which section this prompt belongs to
  sectionName: text('section_name').notNull(), // 'kpis', 'marketing', 'congruence', etc.

  // Prompt configuration
  promptName: text('prompt_name').notNull(), // "Weekly Analysis", "Daily Insights"
  description: text('description'), // What this prompt does

  // AI persona/role
  systemPrompt: text('system_prompt').notNull(), // "You are an expert sales analyst..."

  // Template for user prompt (can have variables like {{kpis_data}})
  userPromptTemplate: text('user_prompt_template').notNull(),

  // What data this prompt needs (stored as JSON string array)
  dataInputs: text('data_inputs').notNull(), // JSON: ["kpis_last_30_days", "churn_reasons"]

  // When this prompt should run (stored as JSON string array)
  triggers: text('triggers').notNull().default('[]'), // JSON: ["manual", "weekly_sunday"]

  // Active/inactive
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),

  // Who created it
  createdBy: text('created_by').references(() => users.id),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('ai_prompt_template_organization_idx').on(table.organizationId),
  sectionIdx: index('ai_prompt_template_section_idx').on(table.sectionName),
  activeIdx: index('ai_prompt_template_active_idx').on(table.isActive),
}));

// AI Analyses table (History/Outputs from AI analyses)
export const aiAnalyses = sqliteTable('ai_analyses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Who triggered this analysis
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Which section
  sectionName: text('section_name').notNull(),

  // Which prompt was used
  promptTemplateId: text('prompt_template_id')
    .references(() => aiPromptTemplates.id, { onDelete: 'set null' }),
  promptName: text('prompt_name').notNull(), // Store name even if template deleted

  // Input data sent to AI (JSON string)
  inputData: text('input_data').notNull(),

  // AI's response
  output: text('output').notNull(),

  // Extracted action items (stored as JSON string array, optional)
  actionItems: text('action_items'),

  // Processing info
  tokensUsed: integer('tokens_used'),
  processingTime: integer('processing_time'), // milliseconds

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('ai_analysis_organization_idx').on(table.organizationId),
  sectionIdx: index('ai_analysis_section_idx').on(table.sectionName),
  userIdx: index('ai_analysis_user_idx').on(table.userId),
  createdAtIdx: index('ai_analysis_created_at_idx').on(table.createdAt),
}));

// Relations for AI Infrastructure
export const aiPromptTemplatesRelations = relations(aiPromptTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiPromptTemplates.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [aiPromptTemplates.createdBy],
    references: [users.id],
  }),
  analyses: many(aiAnalyses),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiAnalyses.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiAnalyses.userId],
    references: [users.id],
  }),
  promptTemplate: one(aiPromptTemplates, {
    fields: [aiAnalyses.promptTemplateId],
    references: [aiPromptTemplates.id],
  }),
}));

// Relations for Marketing Engine
export const marketDefinitionsRelations = relations(marketDefinitions, ({ one }) => ({
  organization: one(organizations, {
    fields: [marketDefinitions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [marketDefinitions.userId],
    references: [users.id],
  }),
}));

export const messageFrameworksRelations = relations(messageFrameworks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [messageFrameworks.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [messageFrameworks.userId],
    references: [users.id],
  }),
  painPoints: many(painPoints),
  usps: many(usps),
}));

export const painPointsRelations = relations(painPoints, ({ one }) => ({
  organization: one(organizations, {
    fields: [painPoints.organizationId],
    references: [organizations.id],
  }),
  framework: one(messageFrameworks, {
    fields: [painPoints.messageFrameworkId],
    references: [messageFrameworks.id],
  }),
}));

export const uspsRelations = relations(usps, ({ one }) => ({
  organization: one(organizations, {
    fields: [usps.organizationId],
    references: [organizations.id],
  }),
  framework: one(messageFrameworks, {
    fields: [usps.messageFrameworkId],
    references: [messageFrameworks.id],
  }),
}));

export const contentCalendarRelations = relations(contentCalendar, ({ one }) => ({
  organization: one(organizations, {
    fields: [contentCalendar.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [contentCalendar.userId],
    references: [users.id],
  }),
}));

export const competitorsRelations = relations(competitors, ({ one }) => ({
  organization: one(organizations, {
    fields: [competitors.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [competitors.userId],
    references: [users.id],
  }),
}));

// Update organizations relations to include all Business OS tables
export const organizationsRelationsExtended = relations(organizations, ({ many }) => ({
  users: many(users),
  apiLogs: many(apiLogs),
  ads: many(ads),
  aiPrompts: many(aiPrompts),
  customerAvatars: many(customerAvatars),
  adRatings: many(adRatings),
  kpiSnapshots: many(kpiSnapshots),
  incomeActivities: many(incomeActivities),
  transactions: many(transactions),
  cashFlowSnapshots: many(cashFlowSnapshots),
  dailyRoutines: many(dailyRoutines),
  userPrinciples: many(userPrinciples),
  aiPromptTemplates: many(aiPromptTemplates),
  aiAnalyses: many(aiAnalyses),
  marketDefinitions: many(marketDefinitions),
  messageFrameworks: many(messageFrameworks),
  painPoints: many(painPoints),
  usps: many(usps),
  contentCalendar: many(contentCalendar),
  competitors: many(competitors),
  clients: many(clients),
  clientStageHistory: many(clientStageHistory),
  clientHealthMetrics: many(clientHealthMetrics),
  onboardingTasks: many(onboardingTasks),
  clientMilestones: many(clientMilestones),
  churnRiskInterventions: many(churnRiskInterventions),
  dmScripts: many(dmScripts),
  scriptUsageLogs: many(scriptUsageLogs),
  practiceSessions: many(practiceSessions),
  monthlyActivities: many(monthlyActivities),
  quarterlyOKRs: many(quarterlyOKRs),
  keyResults: many(keyResults),
  yearlyVisions: many(yearlyVisions),
  visionMilestones: many(visionMilestones),
  weeklyReviews: many(weeklyReviews),
  silentTimeBlocks: many(silentTimeBlocks),
  offerTemplates: many(offerTemplates),
  offers: many(offers),
  offerVersions: many(offerVersions),
  offerActivities: many(offerActivities),
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

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type CashFlowSnapshot = typeof cashFlowSnapshots.$inferSelect;
export type NewCashFlowSnapshot = typeof cashFlowSnapshots.$inferInsert;

export type AiPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type NewAiPromptTemplate = typeof aiPromptTemplates.$inferInsert;

export type AiAnalysis = typeof aiAnalyses.$inferSelect;
export type NewAiAnalysis = typeof aiAnalyses.$inferInsert;

export type DailyRoutine = typeof dailyRoutines.$inferSelect;
export type NewDailyRoutine = typeof dailyRoutines.$inferInsert;

export type UserPrinciples = typeof userPrinciples.$inferSelect;
export type NewUserPrinciples = typeof userPrinciples.$inferInsert;

export type MarketDefinition = typeof marketDefinitions.$inferSelect;
export type NewMarketDefinition = typeof marketDefinitions.$inferInsert;

export type MessageFramework = typeof messageFrameworks.$inferSelect;
export type NewMessageFramework = typeof messageFrameworks.$inferInsert;

export type PainPoint = typeof painPoints.$inferSelect;
export type NewPainPoint = typeof painPoints.$inferInsert;

export type Usp = typeof usps.$inferSelect;
export type NewUsp = typeof usps.$inferInsert;

export type ContentCalendar = typeof contentCalendar.$inferSelect;
export type NewContentCalendar = typeof contentCalendar.$inferInsert;

export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;

// ============================================
// CLIENT SUCCESS HUB (Section 5)
// ============================================

// Clients table (Core client database)
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Account owner/CSM

  // Basic Info
  name: text('name', { length: 100 }).notNull(),
  email: text('email', { length: 255 }),
  phone: text('phone', { length: 50 }),
  company: text('company', { length: 100 }),
  industry: text('industry', { length: 100 }),

  // Commercial
  plan: text('plan', { length: 50 }).notNull().default('starter'), // 'starter', 'pro', 'business', 'enterprise', 'custom'
  mrr: text('mrr').notNull().default('0.00'), // Stored as decimal string
  contractStartDate: text('contract_start_date').notNull(),
  contractEndDate: text('contract_end_date'), // nullable for month-to-month

  // Status & Health
  status: text('status', { length: 20 }).notNull().default('active'), // 'active', 'at_risk', 'churned', 'paused'
  currentStage: text('current_stage', { length: 20 }).notNull().default('sign_up'), // 'sign_up', 'onboarding', 'active', 'success', 'at_risk', 'churned'
  healthScore: integer('health_score').notNull().default(50), // 0-100

  // Tracking
  lastActivityDate: text('last_activity_date'),
  stageEnteredAt: text('stage_entered_at').notNull().$defaultFn(() => new Date().toISOString()),
  notes: text('notes'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('clients_org_idx').on(table.organizationId),
  statusIdx: index('clients_status_idx').on(table.status),
  healthScoreIdx: index('clients_health_score_idx').on(table.healthScore),
}));

// Client Stage History (Track journey stage transitions)
export const clientStageHistory = sqliteTable('client_stage_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who changed the stage

  fromStage: text('from_stage', { length: 20 }),
  toStage: text('to_stage', { length: 20 }).notNull(),
  reason: text('reason'), // Optional note about why stage changed

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  clientIdx: index('client_stage_history_client_idx').on(table.clientId),
  organizationIdx: index('client_stage_history_org_idx').on(table.organizationId),
}));

// Client Health Metrics (Manual metric logging)
export const clientHealthMetrics = sqliteTable('client_health_metrics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who logged this

  date: text('date').notNull().$defaultFn(() => new Date().toISOString()),
  metricType: text('metric_type', { length: 50 }).notNull(), // 'login', 'support_ticket', 'payment', 'meeting', 'feedback', 'usage'
  value: text('value', { length: 255 }), // Flexible field for different metric types
  notes: text('notes'),
  impactOnHealth: integer('impact_on_health'), // +/- points to health score

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  clientIdx: index('client_health_metrics_client_idx').on(table.clientId),
  organizationIdx: index('client_health_metrics_org_idx').on(table.organizationId),
}));

// Onboarding Tasks (Checklist for new clients)
export const onboardingTasks = sqliteTable('onboarding_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  taskName: text('task_name', { length: 200 }).notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  completedBy: text('completed_by').references(() => users.id), // Which team member completed it
  dueDate: text('due_date'),
  order: integer('order').notNull().default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false), // true for template tasks

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  clientIdx: index('onboarding_tasks_client_idx').on(table.clientId),
  organizationIdx: index('onboarding_tasks_org_idx').on(table.organizationId),
}));

// Client Milestones (Track achievements and wins)
export const clientMilestones = sqliteTable('client_milestones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who logged this milestone

  milestoneType: text('milestone_type', { length: 50 }).notNull(), // 'first_purchase', 'renewal', 'upsell', 'referral', 'case_study', 'champion'
  description: text('description').notNull(),
  achievedDate: text('achieved_date').notNull(),
  value: text('value'), // Monetary value if applicable (stored as decimal string)
  notes: text('notes'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  clientIdx: index('client_milestones_client_idx').on(table.clientId),
  organizationIdx: index('client_milestones_org_idx').on(table.organizationId),
}));

// Churn Risk Interventions (Actions taken for at-risk clients)
export const churnRiskInterventions = sqliteTable('churn_risk_interventions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who performed intervention

  riskLevel: text('risk_level', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  interventionType: text('intervention_type', { length: 50 }).notNull(), // 'call', 'email', 'discount', 'training', 'feature_demo', 'escalation'
  description: text('description').notNull(),
  outcome: text('outcome', { length: 20 }), // 'retained', 'churned', 'pending', nullable
  healthScoreBefore: integer('health_score_before'),
  healthScoreAfter: integer('health_score_after'),

  interventionDate: text('intervention_date').notNull().$defaultFn(() => new Date().toISOString()),
  followUpDate: text('follow_up_date'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  clientIdx: index('churn_risk_interventions_client_idx').on(table.clientId),
  organizationIdx: index('churn_risk_interventions_org_idx').on(table.organizationId),
}));

// Relations for Client Success Hub
export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  stageHistory: many(clientStageHistory),
  healthMetrics: many(clientHealthMetrics),
  onboardingTasks: many(onboardingTasks),
  milestones: many(clientMilestones),
  interventions: many(churnRiskInterventions),
}));

export const clientStageHistoryRelations = relations(clientStageHistory, ({ one }) => ({
  client: one(clients, {
    fields: [clientStageHistory.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [clientStageHistory.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [clientStageHistory.userId],
    references: [users.id],
  }),
}));

export const clientHealthMetricsRelations = relations(clientHealthMetrics, ({ one }) => ({
  client: one(clients, {
    fields: [clientHealthMetrics.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [clientHealthMetrics.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [clientHealthMetrics.userId],
    references: [users.id],
  }),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  client: one(clients, {
    fields: [onboardingTasks.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [onboardingTasks.organizationId],
    references: [organizations.id],
  }),
  completedByUser: one(users, {
    fields: [onboardingTasks.completedBy],
    references: [users.id],
  }),
}));

export const clientMilestonesRelations = relations(clientMilestones, ({ one }) => ({
  client: one(clients, {
    fields: [clientMilestones.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [clientMilestones.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [clientMilestones.userId],
    references: [users.id],
  }),
}));

export const churnRiskInterventionsRelations = relations(churnRiskInterventions, ({ one }) => ({
  client: one(clients, {
    fields: [churnRiskInterventions.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [churnRiskInterventions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [churnRiskInterventions.userId],
    references: [users.id],
  }),
}));

// Types
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type ClientStageHistory = typeof clientStageHistory.$inferSelect;
export type NewClientStageHistory = typeof clientStageHistory.$inferInsert;

export type ClientHealthMetric = typeof clientHealthMetrics.$inferSelect;
export type NewClientHealthMetric = typeof clientHealthMetrics.$inferInsert;

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type NewOnboardingTask = typeof onboardingTasks.$inferInsert;

export type ClientMilestone = typeof clientMilestones.$inferSelect;
export type NewClientMilestone = typeof clientMilestones.$inferInsert;

export type ChurnRiskIntervention = typeof churnRiskInterventions.$inferSelect;
export type NewChurnRiskIntervention = typeof churnRiskInterventions.$inferInsert;

// ============================================
// DM SCRIPTS LIBRARY (Section 6)
// ============================================

// DM Scripts table (Sales scripts repository)
export const dmScripts = sqliteTable('dm_scripts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Creator

  // Script Details
  title: text('title', { length: 100 }).notNull(),
  category: text('category', { length: 50 }).notNull(), // '6_boxes', 'dm_flow', 'upsell', 'churn_prevention', 'pre_call', 'post_call', 'check_in', 'closing'
  content: text('content').notNull(), // Main script body
  useCase: text('use_case'), // When to use this script
  talkingPoints: text('talking_points'), // Key points to cover
  expectedOutcomes: text('expected_outcomes'),
  successTips: text('success_tips'),

  // Organization
  order: integer('order').notNull().default(0),
  isDefaultTemplate: integer('is_default_template', { mode: 'boolean' }).notNull().default(false),

  // Performance Tracking
  timesUsed: integer('times_used').notNull().default(0),
  successRate: text('success_rate').default('0.00'), // Stored as decimal string

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('dm_scripts_org_idx').on(table.organizationId),
  categoryIdx: index('dm_scripts_category_idx').on(table.category),
}));

// Script Usage Logs table (Track script performance)
export const scriptUsageLogs = sqliteTable('script_usage_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  scriptId: text('script_id')
    .notNull()
    .references(() => dmScripts.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who used the script

  // Optional link to client (if used in real conversation)
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),

  // Usage Details
  usedAt: text('used_at').notNull().$defaultFn(() => new Date().toISOString()),
  outcome: text('outcome', { length: 30 }).notNull(), // 'success', 'follow_up_needed', 'no_response', 'objection', 'closed', 'lost'

  // Learnings
  notes: text('notes'),
  whatWorked: text('what_worked'),
  whatDidntWork: text('what_didnt_work'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('script_usage_logs_org_idx').on(table.organizationId),
  scriptIdx: index('script_usage_logs_script_idx').on(table.scriptId),
  userIdx: index('script_usage_logs_user_idx').on(table.userId),
}));

// Practice Sessions table (AI role-play practice)
export const practiceSessions = sqliteTable('practice_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Who practiced

  scriptId: text('script_id')
    .notNull()
    .references(() => dmScripts.id, { onDelete: 'cascade' }),

  // Session Config
  personaType: text('persona_type', { length: 50 }).notNull(), // 'skeptical', 'budget_conscious', 'decision_maker', 'technical', 'friendly', 'difficult'
  difficultyLevel: text('difficulty_level', { length: 20 }).notNull(), // 'easy', 'medium', 'hard'
  clientContext: text('client_context'), // Optional context for realism

  // Session Data
  conversationHistory: text('conversation_history').notNull(), // JSON string of messages
  durationSeconds: integer('duration_seconds'),

  // AI Feedback
  aiFeedbackScore: integer('ai_feedback_score'), // 1-10
  aiFeedbackText: text('ai_feedback_text'),
  whatWentWell: text('what_went_well'),
  areasToImprove: text('areas_to_improve'),
  missedOpportunities: text('missed_opportunities'),

  practiceDate: text('practice_date').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('practice_sessions_org_idx').on(table.organizationId),
  userIdx: index('practice_sessions_user_idx').on(table.userId),
  scriptIdx: index('practice_sessions_script_idx').on(table.scriptId),
}));

// Relations for DM Scripts Library
export const dmScriptsRelations = relations(dmScripts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [dmScripts.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [dmScripts.userId],
    references: [users.id],
  }),
  usageLogs: many(scriptUsageLogs),
  practiceSessions: many(practiceSessions),
}));

export const scriptUsageLogsRelations = relations(scriptUsageLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [scriptUsageLogs.organizationId],
    references: [organizations.id],
  }),
  script: one(dmScripts, {
    fields: [scriptUsageLogs.scriptId],
    references: [dmScripts.id],
  }),
  user: one(users, {
    fields: [scriptUsageLogs.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [scriptUsageLogs.clientId],
    references: [clients.id],
  }),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [practiceSessions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [practiceSessions.userId],
    references: [users.id],
  }),
  script: one(dmScripts, {
    fields: [practiceSessions.scriptId],
    references: [dmScripts.id],
  }),
}));

// Types for DM Scripts Library
export type DmScript = typeof dmScripts.$inferSelect;
export type NewDmScript = typeof dmScripts.$inferInsert;

export type ScriptUsageLog = typeof scriptUsageLogs.$inferSelect;
export type NewScriptUsageLog = typeof scriptUsageLogs.$inferInsert;

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;

// ============================================
// PLANNING SYSTEM (Section 7)
// ============================================

// Monthly Activities table (User-private planning)
export const monthlyActivities = sqliteTable('monthly_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + User-private
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // User-private planning

  // Activity Details
  date: text('date').notNull(), // YYYY-MM-DD format
  title: text('title', { length: 100 }).notNull(),
  activityType: text('activity_type', { length: 20 }).notNull(), // 'income', 'affiliate', 'other'
  category: text('category', { length: 50 }), // 'content', 'call', 'meeting', 'admin', 'learning'
  timeSlot: text('time_slot', { length: 20 }), // 'morning', 'afternoon', 'evening', or specific time
  durationMinutes: integer('duration_minutes'),
  description: text('description'),

  // Status
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  actualOutcome: text('actual_outcome'),

  // Optional Links
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('monthly_activities_org_idx').on(table.organizationId),
  userIdx: index('monthly_activities_user_idx').on(table.userId),
  dateIdx: index('monthly_activities_date_idx').on(table.date),
  userDateIdx: index('monthly_activities_user_date_idx').on(table.userId, table.date),
}));

// Quarterly OKRs table (Company-level goals)
export const quarterlyOKRs = sqliteTable('quarterly_okrs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant (Company-level)
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Creator

  ownerId: text('owner_id')
    .references(() => users.id, { onDelete: 'set null' }), // Who's responsible

  // OKR Details
  quarter: text('quarter', { length: 2 }).notNull(), // 'Q1', 'Q2', 'Q3', 'Q4'
  year: integer('year').notNull(), // 2025, 2026
  objectiveTitle: text('objective_title', { length: 200 }).notNull(),
  objectiveDescription: text('objective_description'),
  status: text('status', { length: 20 }).notNull().default('active'), // 'draft', 'active', 'completed', 'abandoned'

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('quarterly_okrs_org_idx').on(table.organizationId),
  quarterYearIdx: index('quarterly_okrs_quarter_year_idx').on(table.organizationId, table.quarter, table.year),
}));

// Key Results table (Measurable outcomes for OKRs)
export const keyResults = sqliteTable('key_results', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  okrId: text('okr_id')
    .notNull()
    .references(() => quarterlyOKRs.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Key Result Details
  description: text('description', { length: 200 }).notNull(),
  metricType: text('metric_type', { length: 50 }), // 'revenue', 'clients', 'conversions', 'custom'
  targetValue: text('target_value').notNull(), // Stored as text for flexibility
  currentValue: text('current_value').notNull().default('0'), // Stored as text
  unit: text('unit', { length: 20 }), // '$', '%', '#'

  // Auto-calculated
  progressPercentage: integer('progress_percentage').notNull().default(0), // 0-100

  lastUpdated: text('last_updated').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('key_results_org_idx').on(table.organizationId),
  okrIdx: index('key_results_okr_idx').on(table.okrId),
}));

// Yearly Visions table (Company-level vision)
export const yearlyVisions = sqliteTable('yearly_visions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant (Company-level vision)
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Creator

  // Vision Details
  year: integer('year').notNull(), // 2025, 2026
  themeFocus: text('theme_focus'), // "Year of Scale", etc.
  annualRevenueTarget: text('annual_revenue_target'), // Stored as text for flexibility
  annualProfitTarget: text('annual_profit_target'), // Stored as text

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('yearly_visions_org_idx').on(table.organizationId),
  yearIdx: index('yearly_visions_year_idx').on(table.organizationId, table.year),
}));

// Vision Milestones table
export const visionMilestones = sqliteTable('vision_milestones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  visionId: text('vision_id')
    .notNull()
    .references(() => yearlyVisions.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Milestone Details
  title: text('title', { length: 100 }).notNull(),
  targetDate: text('target_date').notNull(), // ISO string
  category: text('category', { length: 50 }), // 'revenue', 'product', 'team', 'personal', 'other'
  description: text('description'),

  // Status
  isAchieved: integer('is_achieved', { mode: 'boolean' }).notNull().default(false),
  achievedDate: text('achieved_date'),
  notes: text('notes'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('vision_milestones_org_idx').on(table.organizationId),
  visionIdx: index('vision_milestones_vision_idx').on(table.visionId),
}));

// Weekly Reviews table (User-private reviews)
export const weeklyReviews = sqliteTable('weekly_reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + User-private
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // User-private reviews

  // Week Details
  weekStartDate: text('week_start_date').notNull(), // Monday of the week (YYYY-MM-DD)
  weekEndDate: text('week_end_date').notNull(), // Sunday of the week (YYYY-MM-DD)

  // Review Content
  wins: text('wins'),
  learnings: text('learnings'),
  challenges: text('challenges'),
  nextWeekPriorities: text('next_week_priorities'),
  gratitude: text('gratitude'),

  // Auto-populated Numbers
  weeklyRevenue: text('weekly_revenue'), // Stored as text
  newClients: integer('new_clients'),
  contentPublished: integer('content_published'),
  scriptsPracticed: integer('scripts_practiced'),

  completedAt: text('completed_at').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('weekly_reviews_org_idx').on(table.organizationId),
  userIdx: index('weekly_reviews_user_idx').on(table.userId),
  weekStartIdx: index('weekly_reviews_week_start_idx').on(table.userId, table.weekStartDate),
}));

// Silent Time Blocks table (User-private tracking)
export const silentTimeBlocks = sqliteTable('silent_time_blocks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant + User-private
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // User-private tracking

  // Block Details
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // ISO string
  durationMinutes: integer('duration_minutes').notNull(), // 90, 120, 180
  activityFocus: text('activity_focus', { length: 200 }),
  phoneWasSilent: integer('phone_was_silent', { mode: 'boolean' }).notNull().default(true),
  qualityRating: integer('quality_rating'), // 1-5 stars
  notes: text('notes'),
  accomplishments: text('accomplishments'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('silent_time_blocks_org_idx').on(table.organizationId),
  userIdx: index('silent_time_blocks_user_idx').on(table.userId),
  dateIdx: index('silent_time_blocks_date_idx').on(table.userId, table.date),
}));

// Relations for Planning System
export const monthlyActivitiesRelations = relations(monthlyActivities, ({ one }) => ({
  organization: one(organizations, {
    fields: [monthlyActivities.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [monthlyActivities.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [monthlyActivities.clientId],
    references: [clients.id],
  }),
}));

export const quarterlyOKRsRelations = relations(quarterlyOKRs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [quarterlyOKRs.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [quarterlyOKRs.userId],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [quarterlyOKRs.ownerId],
    references: [users.id],
  }),
  keyResults: many(keyResults),
}));

export const keyResultsRelations = relations(keyResults, ({ one }) => ({
  okr: one(quarterlyOKRs, {
    fields: [keyResults.okrId],
    references: [quarterlyOKRs.id],
  }),
  organization: one(organizations, {
    fields: [keyResults.organizationId],
    references: [organizations.id],
  }),
}));

export const yearlyVisionsRelations = relations(yearlyVisions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [yearlyVisions.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [yearlyVisions.userId],
    references: [users.id],
  }),
  milestones: many(visionMilestones),
}));

export const visionMilestonesRelations = relations(visionMilestones, ({ one }) => ({
  vision: one(yearlyVisions, {
    fields: [visionMilestones.visionId],
    references: [yearlyVisions.id],
  }),
  organization: one(organizations, {
    fields: [visionMilestones.organizationId],
    references: [organizations.id],
  }),
}));

export const weeklyReviewsRelations = relations(weeklyReviews, ({ one }) => ({
  organization: one(organizations, {
    fields: [weeklyReviews.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [weeklyReviews.userId],
    references: [users.id],
  }),
}));

export const silentTimeBlocksRelations = relations(silentTimeBlocks, ({ one }) => ({
  organization: one(organizations, {
    fields: [silentTimeBlocks.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [silentTimeBlocks.userId],
    references: [users.id],
  }),
}));

// Types for Planning System
export type MonthlyActivity = typeof monthlyActivities.$inferSelect;
export type NewMonthlyActivity = typeof monthlyActivities.$inferInsert;

export type QuarterlyOKR = typeof quarterlyOKRs.$inferSelect;
export type NewQuarterlyOKR = typeof quarterlyOKRs.$inferInsert;

export type KeyResult = typeof keyResults.$inferSelect;
export type NewKeyResult = typeof keyResults.$inferInsert;

export type YearlyVision = typeof yearlyVisions.$inferSelect;
export type NewYearlyVision = typeof yearlyVisions.$inferInsert;

export type VisionMilestone = typeof visionMilestones.$inferSelect;
export type NewVisionMilestone = typeof visionMilestones.$inferInsert;

export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type NewWeeklyReview = typeof weeklyReviews.$inferInsert;

export type SilentTimeBlock = typeof silentTimeBlocks.$inferSelect;
export type NewSilentTimeBlock = typeof silentTimeBlocks.$inferInsert;

// ============================================
// OFFERS SYSTEM (Section 8)
// ============================================

// Offer Templates table (Reusable offer structures)
export const offerTemplates = sqliteTable('offer_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Creator

  // Template Details
  name: text('name', { length: 100 }).notNull(),
  category: text('category', { length: 50 }).notNull(), // 'service', 'product', 'package', 'consulting', 'retainer', 'custom'
  description: text('description'),
  structureType: text('structure_type', { length: 20 }).notNull(), // 'single_tier', 'tiered', 'custom'

  // Template Content (stored as JSON)
  sections: text('sections').notNull(), // JSON string of section objects
  defaultTerms: text('default_terms'), // Standard T&C

  // Metadata
  isDefaultTemplate: integer('is_default_template', { mode: 'boolean' }).notNull().default(false),
  timesUsed: integer('times_used').notNull().default(0),
  averageAcceptanceRate: text('average_acceptance_rate').default('0.00'), // Stored as decimal string

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('offer_templates_org_idx').on(table.organizationId),
  categoryIdx: index('offer_templates_category_idx').on(table.category),
}));

// Offers table (Individual offers sent to clients)
export const offers = sqliteTable('offers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Multi-tenant
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Creator

  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'set null' }), // Link to client

  templateId: text('template_id')
    .references(() => offerTemplates.id, { onDelete: 'set null' }),

  // Offer Identification
  offerId: text('offer_id', { length: 20 }).notNull().unique(), // OFF-2025-001
  title: text('title', { length: 200 }).notNull(),
  uniqueShareLink: text('unique_share_link', { length: 100 }).notNull().unique(), // Random hash for sharing

  // Offer Content (stored as JSON for flexibility)
  content: text('content').notNull(), // JSON string of offer structure
  customMessage: text('custom_message'), // Personalized intro

  // Pricing
  totalValue: text('total_value').notNull(), // Stored as decimal string
  discountAmount: text('discount_amount').default('0.00'), // Stored as decimal string
  finalValue: text('final_value').notNull(), // Stored as decimal string
  currency: text('currency', { length: 3 }).notNull().default('USD'),
  paymentTerms: text('payment_terms', { length: 100 }), // "50% upfront, 50% on completion"

  // Dates
  dueDate: text('due_date'), // When client should decide (ISO string)
  validUntil: text('valid_until'), // Offer expiration (ISO string)
  sentDate: text('sent_date'), // ISO string
  viewedDate: text('viewed_date'), // First view (ISO string)
  decisionDate: text('decision_date'), // Accepted or declined (ISO string)

  // Status
  status: text('status', { length: 20 }).notNull().default('draft'), // 'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
  decisionReason: text('decision_reason'), // Why accepted/declined

  // Settings
  isPasswordProtected: integer('is_password_protected', { mode: 'boolean' }).notNull().default(false),
  password: text('password', { length: 100 }), // Hashed password if protected

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  organizationIdx: index('offers_org_idx').on(table.organizationId),
  clientIdx: index('offers_client_idx').on(table.clientId),
  statusIdx: index('offers_status_idx').on(table.status),
  shareLinkIdx: uniqueIndex('offers_share_link_idx').on(table.uniqueShareLink),
  offerIdIdx: uniqueIndex('offers_offer_id_idx').on(table.offerId),
}));

// Offer Versions table (Track changes to offers over time)
export const offerVersions = sqliteTable('offer_versions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  offerId: text('offer_id')
    .notNull()
    .references(() => offers.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Version Details
  versionNumber: integer('version_number').notNull(), // 1, 2, 3...
  changesSummary: text('changes_summary'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),

  // Snapshot of offer content at this version
  contentSnapshot: text('content_snapshot').notNull(), // Full JSON snapshot

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  offerIdx: index('offer_versions_offer_idx').on(table.offerId),
  organizationIdx: index('offer_versions_org_idx').on(table.organizationId),
}));

// Offer Activities table (Track offer interactions and history)
export const offerActivities = sqliteTable('offer_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  offerId: text('offer_id')
    .notNull()
    .references(() => offers.id, { onDelete: 'cascade' }),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Activity Details
  activityType: text('activity_type', { length: 50 }).notNull(), // 'created', 'sent', 'viewed', 'accepted', 'declined', 'edited', 'downloaded'
  performedBy: text('performed_by').references(() => users.id, { onDelete: 'set null' }), // User or client
  ipAddress: text('ip_address', { length: 50 }), // For tracking views
  userAgent: text('user_agent'), // Browser info
  notes: text('notes'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  offerIdx: index('offer_activities_offer_idx').on(table.offerId),
  organizationIdx: index('offer_activities_org_idx').on(table.organizationId),
  activityTypeIdx: index('offer_activities_type_idx').on(table.activityType),
}));

// Relations for Offers System
export const offerTemplatesRelations = relations(offerTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [offerTemplates.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [offerTemplates.userId],
    references: [users.id],
  }),
  offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [offers.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [offers.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [offers.clientId],
    references: [clients.id],
  }),
  template: one(offerTemplates, {
    fields: [offers.templateId],
    references: [offerTemplates.id],
  }),
  versions: many(offerVersions),
  activities: many(offerActivities),
}));

export const offerVersionsRelations = relations(offerVersions, ({ one }) => ({
  offer: one(offers, {
    fields: [offerVersions.offerId],
    references: [offers.id],
  }),
  organization: one(organizations, {
    fields: [offerVersions.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [offerVersions.createdBy],
    references: [users.id],
  }),
}));

export const offerActivitiesRelations = relations(offerActivities, ({ one }) => ({
  offer: one(offers, {
    fields: [offerActivities.offerId],
    references: [offers.id],
  }),
  organization: one(organizations, {
    fields: [offerActivities.organizationId],
    references: [organizations.id],
  }),
  performedByUser: one(users, {
    fields: [offerActivities.performedBy],
    references: [users.id],
  }),
}));

// Types for Offers System
export type OfferTemplate = typeof offerTemplates.$inferSelect;
export type NewOfferTemplate = typeof offerTemplates.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type OfferVersion = typeof offerVersions.$inferSelect;
export type NewOfferVersion = typeof offerVersions.$inferInsert;

export type OfferActivity = typeof offerActivities.$inferSelect;
export type NewOfferActivity = typeof offerActivities.$inferInsert;
