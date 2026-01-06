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
