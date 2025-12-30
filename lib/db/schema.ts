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

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  apiLogs: many(apiLogs),
  ads: many(ads),
  aiPrompts: many(aiPrompts),
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

export const adsRelations = relations(ads, ({ one }) => ({
  organization: one(organizations, {
    fields: [ads.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
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
