import { sqliteTable, AnySQLiteColumn, index, foreignKey, text, uniqueIndex, integer } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const apiLogs = sqliteTable("api_logs", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").references(() => users.id, { onDelete: "set null" } ),
	apiName: text("api_name").notNull(),
	endpoint: text().notNull(),
	status: text().notNull(),
	errorMessage: text("error_message"),
	timestamp: text().notNull(),
},
(table) => [
	index("log_timestamp_idx").on(table.timestamp),
	index("log_organization_idx").on(table.organizationId),
]);

export const organizations = sqliteTable("organizations", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	subdomain: text().notNull(),
	calendlyAccessToken: text("calendly_access_token"),
	calendlyUserUri: text("calendly_user_uri"),
	stripeSecretKey: text("stripe_secret_key"),
	googleSheetsId: text("google_sheets_id"),
	metaAccessToken: text("meta_access_token"),
	metaAdAccountId: text("meta_ad_account_id"),
	googleAdsClientId: text("google_ads_client_id"),
	googleAdsClientSecret: text("google_ads_client_secret"),
	googleAdsRefreshToken: text("google_ads_refresh_token"),
	googleAdsCustomerId: text("google_ads_customer_id"),
	logoUrl: text("logo_url"),
	status: text().default("trial").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	brandVoiceProfile: text("brand_voice_profile"),
},
(table) => [
	uniqueIndex("subdomain_idx").on(table.subdomain),
	uniqueIndex("organizations_subdomain_unique").on(table.subdomain),
]);

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	name: text().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	role: text().default("viewer").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("user_organization_idx").on(table.organizationId),
	uniqueIndex("email_idx").on(table.email),
	uniqueIndex("users_email_unique").on(table.email),
]);

export const ads = sqliteTable("ads", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").references(() => users.id, { onDelete: "set null" } ),
	aiGenerated: integer("ai_generated").default(false).notNull(),
	aiPrompt: text("ai_prompt"),
	status: text().default("draft").notNull(),
	adType: text("ad_type").notNull(),
	headline: text().notNull(),
	bodyText: text("body_text").notNull(),
	callToAction: text("call_to_action").notNull(),
	landingPage: text("landing_page"),
	wordCount: integer("word_count"),
	platformAdId: text("platform_ad_id"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	platformConfig: text("platform_config"),
},
(table) => [
	index("ad_created_at_idx").on(table.createdAt),
	index("ad_ai_generated_idx").on(table.aiGenerated),
	index("ad_status_idx").on(table.status),
	index("ad_organization_idx").on(table.organizationId),
]);

export const aiPrompts = sqliteTable("ai_prompts", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	promptType: text("prompt_type").default("custom").notNull(),
	promptText: text("prompt_text").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	isDefault: integer("is_default").default(false).notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	avgQualityScore: text("avg_quality_score"),
	createdBy: text("created_by").references(() => users.id, { onDelete: "set null" } ),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("prompt_is_active_idx").on(table.isActive),
	index("prompt_is_default_idx").on(table.isDefault),
	index("prompt_category_idx").on(table.category),
	index("prompt_organization_idx").on(table.organizationId),
]);

export const customerAvatars = sqliteTable("customer_avatars", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	setName: text("set_name", { length: 100 }).notNull(),
	niche: text({ length: 200 }).notNull(),
	description: text(),
	avatarName: text("avatar_name", { length: 100 }).notNull(),
	personaData: text("persona_data").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("avatar_active_idx").on(table.isActive),
	index("avatar_organization_set_idx").on(table.organizationId, table.setName),
]);

export const adRatings = sqliteTable("ad_ratings", {
	id: text().primaryKey().notNull(),
	adId: text("ad_id").references(() => ads.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	avatarSetName: text("avatar_set_name", { length: 100 }).notNull(),
	niche: text({ length: 200 }).notNull(),
	avatarFeedbacks: text("avatar_feedbacks").notNull(),
	totalAvatars: integer("total_avatars").default(13).notNull(),
	positiveCount: integer("positive_count").default(0).notNull(),
	mixedCount: integer("mixed_count").default(0).notNull(),
	negativeCount: integer("negative_count").default(0).notNull(),
	processingTimeMs: integer("processing_time_ms"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("rating_created_at_idx").on(table.createdAt),
	index("rating_organization_idx").on(table.organizationId),
	index("rating_ad_organization_idx").on(table.adId, table.organizationId),
]);

export const kpiSnapshots = sqliteTable("kpi_snapshots", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	date: text().notNull(),
	exposure: integer().default(0).notNull(),
	leads: integer().default(0).notNull(),
	qualifiedLeads: integer("qualified_leads").default(0).notNull(),
	ss1Total: integer("ss1_total").default(0).notNull(),
	ss1SixBoxes: integer("ss1_six_boxes").default(0).notNull(),
	ss1Dms: integer("ss1_dms").default(0).notNull(),
	checkIns: integer("check_ins").default(0).notNull(),
	prescriptionClose: integer("prescription_close").default(0).notNull(),
	closes: integer().default(0).notNull(),
	upsells: integer().default(0).notNull(),
	churn: integer().default(0).notNull(),
	churnReasons: text("churn_reasons"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("kpi_organization_date_idx").on(table.organizationId, table.date),
	index("kpi_date_idx").on(table.date),
	index("kpi_organization_idx").on(table.organizationId),
]);

export const aiAnalyses = sqliteTable("ai_analyses", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	sectionName: text("section_name").notNull(),
	promptTemplateId: text("prompt_template_id").references(() => aiPromptTemplates.id, { onDelete: "set null" } ),
	promptName: text("prompt_name").notNull(),
	inputData: text("input_data").notNull(),
	output: text().notNull(),
	actionItems: text("action_items"),
	tokensUsed: integer("tokens_used"),
	processingTime: integer("processing_time"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("ai_analysis_created_at_idx").on(table.createdAt),
	index("ai_analysis_user_idx").on(table.userId),
	index("ai_analysis_section_idx").on(table.sectionName),
	index("ai_analysis_organization_idx").on(table.organizationId),
]);

export const aiPromptTemplates = sqliteTable("ai_prompt_templates", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	sectionName: text("section_name").notNull(),
	promptName: text("prompt_name").notNull(),
	description: text(),
	systemPrompt: text("system_prompt").notNull(),
	userPromptTemplate: text("user_prompt_template").notNull(),
	dataInputs: text("data_inputs").notNull(),
	triggers: text().default("[]").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	createdBy: text("created_by").references(() => users.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("ai_prompt_template_active_idx").on(table.isActive),
	index("ai_prompt_template_section_idx").on(table.sectionName),
	index("ai_prompt_template_organization_idx").on(table.organizationId),
]);

export const dailyRoutines = sqliteTable("daily_routines", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	isPrivate: integer("is_private").default(true).notNull(),
	date: text().notNull(),
	exerciseCompleted: integer("exercise_completed").default(false),
	exerciseType: text("exercise_type"),
	exerciseDuration: integer("exercise_duration"),
	gratitudeCompleted: integer("gratitude_completed").default(false),
	gratitudeEntry: text("gratitude_entry"),
	meditationCompleted: integer("meditation_completed").default(false),
	meditationDuration: integer("meditation_duration"),
	breathworkCompleted: integer("breathwork_completed").default(false),
	breathworkDuration: integer("breathwork_duration"),
	selfImageUpdate: text("self_image_update"),
	completionRate: integer("completion_rate"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("routine_unique_user_date_idx").on(table.organizationId, table.userId, table.date),
	index("routine_date_idx").on(table.date),
	index("routine_user_idx").on(table.userId),
	index("routine_organization_idx").on(table.organizationId),
]);

export const userPrinciples = sqliteTable("user_principles", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	isPrivate: integer("is_private").default(true).notNull(),
	principles: text(),
	purpose: text(),
	selfImage: text("self_image"),
	showPrincipleReminder: integer("show_principle_reminder").default(true),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("principles_unique_user_idx").on(table.organizationId, table.userId),
	index("principles_user_idx").on(table.userId),
	index("principles_organization_idx").on(table.organizationId),
]);

export const cashFlowSnapshots = sqliteTable("cash_flow_snapshots", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	date: text().notNull(),
	totalRevenue: integer("total_revenue").default(0).notNull(),
	totalExpenses: integer("total_expenses").default(0).notNull(),
	netCashFlow: integer("net_cash_flow").default(0).notNull(),
	revenueFromAds: integer("revenue_from_ads").default(0).notNull(),
	revenueFromDms: integer("revenue_from_dms").default(0).notNull(),
	revenueFromCalls: integer("revenue_from_calls").default(0).notNull(),
	revenueFromOther: integer("revenue_from_other").default(0).notNull(),
	expenseAds: integer("expense_ads").default(0).notNull(),
	expenseSoftware: integer("expense_software").default(0).notNull(),
	expenseContractors: integer("expense_contractors").default(0).notNull(),
	expenseEducation: integer("expense_education").default(0).notNull(),
	expenseOffice: integer("expense_office").default(0).notNull(),
	expenseOther: integer("expense_other").default(0).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("cashflow_organization_date_idx").on(table.organizationId, table.date),
	index("cashflow_date_idx").on(table.date),
	index("cashflow_organization_idx").on(table.organizationId),
]);

export const incomeActivities = sqliteTable("income_activities", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	date: text().notNull(),
	source: text().notNull(),
	description: text(),
	amount: integer(),
	kpisStage: text("kpis_stage"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("income_organization_date_idx").on(table.organizationId, table.date),
	index("income_date_idx").on(table.date),
	index("income_user_idx").on(table.userId),
	index("income_organization_idx").on(table.organizationId),
]);

export const transactions = sqliteTable("transactions", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	date: text().notNull(),
	category: text().notNull(),
	description: text().notNull(),
	amount: integer().notNull(),
	vendor: text(),
	notes: text(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("transaction_organization_date_idx").on(table.organizationId, table.date),
	index("transaction_category_idx").on(table.category),
	index("transaction_date_idx").on(table.date),
	index("transaction_user_idx").on(table.userId),
	index("transaction_organization_idx").on(table.organizationId),
]);

export const competitors = sqliteTable("competitors", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	name: text().notNull(),
	website: text(),
	description: text(),
	strengths: text(),
	weaknesses: text(),
	lastAnalyzedAt: text("last_analyzed_at"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("competitor_organization_idx").on(table.organizationId),
]);

export const contentCalendar = sqliteTable("content_calendar", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	platform: text().notNull(),
	scheduledDate: text("scheduled_date").notNull(),
	contentType: text("content_type").notNull(),
	status: text().default("idea").notNull(),
	title: text().notNull(),
	body: text(),
	notes: text(),
	publishedAt: text("published_at"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("content_calendar_org_date_idx").on(table.organizationId, table.scheduledDate),
	index("content_calendar_status_idx").on(table.status),
	index("content_calendar_platform_idx").on(table.platform),
	index("content_calendar_date_idx").on(table.scheduledDate),
	index("content_calendar_organization_idx").on(table.organizationId),
]);

export const marketDefinitions = sqliteTable("market_definitions", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	targetMarketDescription: text("target_market_description"),
	primarySegment: text("primary_segment"),
	secondarySegment: text("secondary_segment"),
	nichePositioning: text("niche_positioning"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("market_def_unique_org_idx").on(table.organizationId),
	index("market_def_organization_idx").on(table.organizationId),
]);

export const messageFrameworks = sqliteTable("message_frameworks", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id),
	valueProposition: text("value_proposition"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("msg_framework_unique_org_idx").on(table.organizationId),
	index("msg_framework_organization_idx").on(table.organizationId),
]);

export const painPoints = sqliteTable("pain_points", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	messageFrameworkId: text("message_framework_id").notNull().references(() => messageFrameworks.id, { onDelete: "cascade" } ),
	description: text().notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("pain_point_framework_idx").on(table.messageFrameworkId),
	index("pain_point_organization_idx").on(table.organizationId),
]);

export const usps = sqliteTable("usps", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	messageFrameworkId: text("message_framework_id").notNull().references(() => messageFrameworks.id, { onDelete: "cascade" } ),
	title: text().notNull(),
	description: text().notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("usp_framework_idx").on(table.messageFrameworkId),
	index("usp_organization_idx").on(table.organizationId),
]);

export const churnRiskInterventions = sqliteTable("churn_risk_interventions", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	riskLevel: text("risk_level", { length: 20 }).notNull(),
	interventionType: text("intervention_type", { length: 50 }).notNull(),
	description: text().notNull(),
	outcome: text({ length: 20 }),
	healthScoreBefore: integer("health_score_before"),
	healthScoreAfter: integer("health_score_after"),
	interventionDate: text("intervention_date").notNull(),
	followUpDate: text("follow_up_date"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("churn_risk_interventions_org_idx").on(table.organizationId),
	index("churn_risk_interventions_client_idx").on(table.clientId),
]);

export const clientHealthMetrics = sqliteTable("client_health_metrics", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	metricType: text("metric_type", { length: 50 }).notNull(),
	value: text({ length: 255 }),
	notes: text(),
	impactOnHealth: integer("impact_on_health"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("client_health_metrics_org_idx").on(table.organizationId),
	index("client_health_metrics_client_idx").on(table.clientId),
]);

export const clientMilestones = sqliteTable("client_milestones", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	milestoneType: text("milestone_type", { length: 50 }).notNull(),
	description: text().notNull(),
	achievedDate: text("achieved_date").notNull(),
	value: text(),
	notes: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("client_milestones_org_idx").on(table.organizationId),
	index("client_milestones_client_idx").on(table.clientId),
]);

export const clientStageHistory = sqliteTable("client_stage_history", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	fromStage: text("from_stage", { length: 20 }),
	toStage: text("to_stage", { length: 20 }).notNull(),
	reason: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("client_stage_history_org_idx").on(table.organizationId),
	index("client_stage_history_client_idx").on(table.clientId),
]);

export const clients = sqliteTable("clients", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	name: text({ length: 100 }).notNull(),
	email: text({ length: 255 }),
	phone: text({ length: 50 }),
	company: text({ length: 100 }),
	industry: text({ length: 100 }),
	plan: text({ length: 50 }).default("starter").notNull(),
	mrr: text().default("0.00").notNull(),
	contractStartDate: text("contract_start_date").notNull(),
	contractEndDate: text("contract_end_date"),
	status: text({ length: 20 }).default("active").notNull(),
	currentStage: text("current_stage", { length: 20 }).default("sign_up").notNull(),
	healthScore: integer("health_score").default(50).notNull(),
	lastActivityDate: text("last_activity_date"),
	stageEnteredAt: text("stage_entered_at").notNull(),
	notes: text(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("clients_health_score_idx").on(table.healthScore),
	index("clients_status_idx").on(table.status),
	index("clients_org_idx").on(table.organizationId),
]);

export const onboardingTasks = sqliteTable("onboarding_tasks", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	taskName: text("task_name", { length: 200 }).notNull(),
	isCompleted: integer("is_completed").default(false).notNull(),
	completedAt: text("completed_at"),
	completedBy: text("completed_by").references(() => users.id),
	dueDate: text("due_date"),
	order: integer().default(0).notNull(),
	isDefault: integer("is_default").default(false).notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("onboarding_tasks_org_idx").on(table.organizationId),
	index("onboarding_tasks_client_idx").on(table.clientId),
]);

export const dmScripts = sqliteTable("dm_scripts", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: text({ length: 100 }).notNull(),
	category: text({ length: 50 }).notNull(),
	content: text().notNull(),
	useCase: text("use_case"),
	talkingPoints: text("talking_points"),
	expectedOutcomes: text("expected_outcomes"),
	successTips: text("success_tips"),
	order: integer().default(0).notNull(),
	isDefaultTemplate: integer("is_default_template").default(false).notNull(),
	timesUsed: integer("times_used").default(0).notNull(),
	successRate: text("success_rate").default("0.00"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("dm_scripts_category_idx").on(table.category),
	index("dm_scripts_org_idx").on(table.organizationId),
]);

export const practiceSessions = sqliteTable("practice_sessions", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	scriptId: text("script_id").notNull().references(() => dmScripts.id, { onDelete: "cascade" } ),
	personaType: text("persona_type", { length: 50 }).notNull(),
	difficultyLevel: text("difficulty_level", { length: 20 }).notNull(),
	clientContext: text("client_context"),
	conversationHistory: text("conversation_history").notNull(),
	durationSeconds: integer("duration_seconds"),
	aiFeedbackScore: integer("ai_feedback_score"),
	aiFeedbackText: text("ai_feedback_text"),
	whatWentWell: text("what_went_well"),
	areasToImprove: text("areas_to_improve"),
	missedOpportunities: text("missed_opportunities"),
	practiceDate: text("practice_date").notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("practice_sessions_script_idx").on(table.scriptId),
	index("practice_sessions_user_idx").on(table.userId),
	index("practice_sessions_org_idx").on(table.organizationId),
]);

export const scriptUsageLogs = sqliteTable("script_usage_logs", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	scriptId: text("script_id").notNull().references(() => dmScripts.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	clientId: text("client_id").references(() => clients.id, { onDelete: "set null" } ),
	usedAt: text("used_at").notNull(),
	outcome: text({ length: 30 }).notNull(),
	notes: text(),
	whatWorked: text("what_worked"),
	whatDidntWork: text("what_didnt_work"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("script_usage_logs_user_idx").on(table.userId),
	index("script_usage_logs_script_idx").on(table.scriptId),
	index("script_usage_logs_org_idx").on(table.organizationId),
]);

export const keyResults = sqliteTable("key_results", {
	id: text().primaryKey().notNull(),
	okrId: text("okr_id").notNull().references(() => quarterlyOkrs.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	description: text({ length: 200 }).notNull(),
	metricType: text("metric_type", { length: 50 }),
	targetValue: text("target_value").notNull(),
	currentValue: text("current_value").default("0").notNull(),
	unit: text({ length: 20 }),
	progressPercentage: integer("progress_percentage").default(0).notNull(),
	lastUpdated: text("last_updated").notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("key_results_okr_idx").on(table.okrId),
	index("key_results_org_idx").on(table.organizationId),
]);

export const monthlyActivities = sqliteTable("monthly_activities", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	title: text({ length: 100 }).notNull(),
	activityType: text("activity_type", { length: 20 }).notNull(),
	category: text({ length: 50 }),
	timeSlot: text("time_slot", { length: 20 }),
	durationMinutes: integer("duration_minutes"),
	description: text(),
	isCompleted: integer("is_completed").default(false).notNull(),
	completedAt: text("completed_at"),
	actualOutcome: text("actual_outcome"),
	clientId: text("client_id").references(() => clients.id, { onDelete: "set null" } ),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("monthly_activities_user_date_idx").on(table.userId, table.date),
	index("monthly_activities_date_idx").on(table.date),
	index("monthly_activities_user_idx").on(table.userId),
	index("monthly_activities_org_idx").on(table.organizationId),
]);

export const quarterlyOkrs = sqliteTable("quarterly_okrs", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" } ),
	quarter: text({ length: 2 }).notNull(),
	year: integer().notNull(),
	objectiveTitle: text("objective_title", { length: 200 }).notNull(),
	objectiveDescription: text("objective_description"),
	status: text({ length: 20 }).default("active").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("quarterly_okrs_quarter_year_idx").on(table.organizationId, table.quarter, table.year),
	index("quarterly_okrs_org_idx").on(table.organizationId),
]);

export const silentTimeBlocks = sqliteTable("silent_time_blocks", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	startTime: text("start_time").notNull(),
	durationMinutes: integer("duration_minutes").notNull(),
	activityFocus: text("activity_focus", { length: 200 }),
	phoneWasSilent: integer("phone_was_silent").default(true).notNull(),
	qualityRating: integer("quality_rating"),
	notes: text(),
	accomplishments: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("silent_time_blocks_date_idx").on(table.userId, table.date),
	index("silent_time_blocks_user_idx").on(table.userId),
	index("silent_time_blocks_org_idx").on(table.organizationId),
]);

export const visionMilestones = sqliteTable("vision_milestones", {
	id: text().primaryKey().notNull(),
	visionId: text("vision_id").notNull().references(() => yearlyVisions.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	title: text({ length: 100 }).notNull(),
	targetDate: text("target_date").notNull(),
	category: text({ length: 50 }),
	description: text(),
	isAchieved: integer("is_achieved").default(false).notNull(),
	achievedDate: text("achieved_date"),
	notes: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("vision_milestones_vision_idx").on(table.visionId),
	index("vision_milestones_org_idx").on(table.organizationId),
]);

export const weeklyReviews = sqliteTable("weekly_reviews", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	weekStartDate: text("week_start_date").notNull(),
	weekEndDate: text("week_end_date").notNull(),
	wins: text(),
	learnings: text(),
	challenges: text(),
	nextWeekPriorities: text("next_week_priorities"),
	gratitude: text(),
	weeklyRevenue: text("weekly_revenue"),
	newClients: integer("new_clients"),
	contentPublished: integer("content_published"),
	scriptsPracticed: integer("scripts_practiced"),
	completedAt: text("completed_at").notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("weekly_reviews_week_start_idx").on(table.userId, table.weekStartDate),
	index("weekly_reviews_user_idx").on(table.userId),
	index("weekly_reviews_org_idx").on(table.organizationId),
]);

export const yearlyVisions = sqliteTable("yearly_visions", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	year: integer().notNull(),
	themeFocus: text("theme_focus"),
	annualRevenueTarget: text("annual_revenue_target"),
	annualProfitTarget: text("annual_profit_target"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("yearly_visions_year_idx").on(table.organizationId, table.year),
	index("yearly_visions_org_idx").on(table.organizationId),
]);

export const offerActivities = sqliteTable("offer_activities", {
	id: text().primaryKey().notNull(),
	offerId: text("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	activityType: text("activity_type", { length: 50 }).notNull(),
	performedBy: text("performed_by").references(() => users.id, { onDelete: "set null" } ),
	ipAddress: text("ip_address", { length: 50 }),
	userAgent: text("user_agent"),
	notes: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("offer_activities_type_idx").on(table.activityType),
	index("offer_activities_org_idx").on(table.organizationId),
	index("offer_activities_offer_idx").on(table.offerId),
]);

export const offerTemplates = sqliteTable("offer_templates", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	name: text({ length: 100 }).notNull(),
	category: text({ length: 50 }).notNull(),
	description: text(),
	structureType: text("structure_type", { length: 20 }).notNull(),
	sections: text().notNull(),
	defaultTerms: text("default_terms"),
	isDefaultTemplate: integer("is_default_template").default(false).notNull(),
	timesUsed: integer("times_used").default(0).notNull(),
	averageAcceptanceRate: text("average_acceptance_rate").default("0.00"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("offer_templates_category_idx").on(table.category),
	index("offer_templates_org_idx").on(table.organizationId),
]);

export const offerVersions = sqliteTable("offer_versions", {
	id: text().primaryKey().notNull(),
	offerId: text("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" } ),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	versionNumber: integer("version_number").notNull(),
	changesSummary: text("changes_summary"),
	createdBy: text("created_by").references(() => users.id, { onDelete: "set null" } ),
	contentSnapshot: text("content_snapshot").notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("offer_versions_org_idx").on(table.organizationId),
	index("offer_versions_offer_idx").on(table.offerId),
]);

export const offers = sqliteTable("offers", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	clientId: text("client_id").references(() => clients.id, { onDelete: "set null" } ),
	templateId: text("template_id").references(() => offerTemplates.id, { onDelete: "set null" } ),
	offerId: text("offer_id", { length: 20 }).notNull(),
	title: text({ length: 200 }).notNull(),
	uniqueShareLink: text("unique_share_link", { length: 100 }).notNull(),
	content: text().notNull(),
	customMessage: text("custom_message"),
	totalValue: text("total_value").notNull(),
	discountAmount: text("discount_amount").default("0.00"),
	finalValue: text("final_value").notNull(),
	currency: text({ length: 3 }).default("USD").notNull(),
	paymentTerms: text("payment_terms", { length: 100 }),
	dueDate: text("due_date"),
	validUntil: text("valid_until"),
	sentDate: text("sent_date"),
	viewedDate: text("viewed_date"),
	decisionDate: text("decision_date"),
	status: text({ length: 20 }).default("draft").notNull(),
	decisionReason: text("decision_reason"),
	isPasswordProtected: integer("is_password_protected").default(false).notNull(),
	password: text({ length: 100 }),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("offers_offer_id_idx").on(table.offerId),
	uniqueIndex("offers_share_link_idx").on(table.uniqueShareLink),
	index("offers_status_idx").on(table.status),
	index("offers_client_idx").on(table.clientId),
	index("offers_org_idx").on(table.organizationId),
	uniqueIndex("offers_unique_share_link_unique").on(table.uniqueShareLink),
	uniqueIndex("offers_offer_id_unique").on(table.offerId),
]);

export const connectionGoals = sqliteTable("connection_goals", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	dailyGoal: integer("daily_goal").default(5).notNull(),
	weeklyGoal: integer("weekly_goal").default(25).notNull(),
	monthlyGoal: integer("monthly_goal").default(100).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("connection_goals_user_idx").on(table.userId),
]);

export const contentExecutionLogs = sqliteTable("content_execution_logs", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	platform: text({ length: 50 }).notNull(),
	contentType: text("content_type", { length: 50 }),
	title: text({ length: 200 }).notNull(),
	plannedContentId: text("planned_content_id").references(() => contentCalendar.id, { onDelete: "set null" } ),
	wasPlanned: integer("was_planned").default(false).notNull(),
	status: text({ length: 20 }).default("published").notNull(),
	publishedUrl: text("published_url", { length: 500 }),
	checklistItems: text("checklist_items"),
	performanceNotes: text("performance_notes"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("content_execution_logs_user_idx").on(table.userId),
	index("content_execution_logs_user_date_idx").on(table.userId, table.date),
]);

export const executionLogs = sqliteTable("execution_logs", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	activityTitle: text("activity_title", { length: 200 }).notNull(),
	activityType: text("activity_type", { length: 20 }),
	plannedActivityId: text("planned_activity_id").references(() => monthlyActivities.id, { onDelete: "set null" } ),
	wasPlanned: integer("was_planned").default(false).notNull(),
	plannedDurationMinutes: integer("planned_duration_minutes"),
	actualDurationMinutes: integer("actual_duration_minutes"),
	notes: text(),
	outcome: text(),
	completedAt: text("completed_at").notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("execution_logs_user_idx").on(table.userId),
	index("execution_logs_planned_idx").on(table.plannedActivityId),
	index("execution_logs_user_date_idx").on(table.userId, table.date),
]);

export const executionStreaks = sqliteTable("execution_streaks", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	streakType: text("streak_type", { length: 50 }).notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	lastActivityDate: text("last_activity_date"),
	lastBrokenDate: text("last_broken_date"),
	streakGoal: integer("streak_goal").default(30).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("execution_streaks_user_type_idx").on(table.userId, table.streakType),
]);

export const loomVideos = sqliteTable("loom_videos", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: text({ length: 200 }).notNull(),
	category: text({ length: 50 }),
	loomUrl: text("loom_url", { length: 500 }).notNull(),
	description: text(),
	durationSeconds: integer("duration_seconds"),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("loom_videos_org_idx").on(table.organizationId),
]);

export const newConnections = sqliteTable("new_connections", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	date: text().notNull(),
	connectionName: text("connection_name", { length: 100 }).notNull(),
	connectionType: text("connection_type", { length: 50 }).notNull(),
	platform: text({ length: 50 }),
	quality: text({ length: 50 }),
	context: text(),
	followUpNeeded: integer("follow_up_needed").default(false).notNull(),
	followUpDate: text("follow_up_date"),
	followUpCompleted: integer("follow_up_completed").default(false).notNull(),
	clientId: text("client_id").references(() => clients.id, { onDelete: "set null" } ),
	notes: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("new_connections_user_idx").on(table.userId),
	index("new_connections_user_date_idx").on(table.userId, table.date),
]);

export const activityFeed = sqliteTable("activity_feed", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	activityType: text("activity_type", { length: 50 }).notNull(),
	entityType: text("entity_type", { length: 50 }),
	entityId: text("entity_id"),
	activityText: text("activity_text").notNull(),
	metadata: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("activity_feed_created_idx").on(table.createdAt),
	index("activity_feed_org_idx").on(table.organizationId),
]);

export const comments = sqliteTable("comments", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	entityType: text("entity_type", { length: 50 }).notNull(),
	entityId: text("entity_id").notNull(),
	commentText: text("comment_text").notNull(),
	mentions: text(),
	parentCommentId: text("parent_comment_id"),
	isEdited: integer("is_edited").default(false).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("comments_org_idx").on(table.organizationId),
	index("comments_entity_idx").on(table.entityType, table.entityId),
	foreignKey(() => ({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "comments_parent_comment_id_comments_id_fk"
		})).onDelete("cascade"),
]);

export const conversations = sqliteTable("conversations", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	type: text({ length: 20 }).notNull(),
	participants: text().notNull(),
	lastMessageAt: text("last_message_at"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("conversations_org_idx").on(table.organizationId),
]);

export const messages = sqliteTable("messages", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	messageText: text("message_text").notNull(),
	attachments: text(),
	isAnnouncement: integer("is_announcement").default(false).notNull(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("messages_conversation_idx").on(table.conversationId),
]);

export const notifications = sqliteTable("notifications", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	notificationType: text("notification_type", { length: 50 }).notNull(),
	title: text({ length: 200 }).notNull(),
	message: text(),
	link: text({ length: 500 }),
	isRead: integer("is_read").default(false).notNull(),
	readAt: text("read_at"),
	createdAt: text("created_at").notNull(),
},
(table) => [
	index("notifications_unread_idx").on(table.userId, table.isRead),
	index("notifications_user_idx").on(table.userId),
]);

export const tasks = sqliteTable("tasks", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "cascade" } ),
	assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" } ),
	taskType: text("task_type", { length: 50 }),
	linkedEntityId: text("linked_entity_id"),
	linkedSection: text("linked_section", { length: 50 }),
	title: text({ length: 200 }).notNull(),
	description: text(),
	priority: text({ length: 20 }).default("medium").notNull(),
	status: text({ length: 20 }).default("todo").notNull(),
	dueDate: text("due_date"),
	completedAt: text("completed_at"),
	estimatedTimeMinutes: integer("estimated_time_minutes"),
	actualTimeMinutes: integer("actual_time_minutes"),
	tags: text(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("tasks_status_idx").on(table.status),
	index("tasks_assigned_idx").on(table.assignedTo),
	index("tasks_org_idx").on(table.organizationId),
]);

export const teamMembers = sqliteTable("team_members", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	role: text({ length: 20 }).default("member").notNull(),
	department: text({ length: 50 }),
	title: text({ length: 100 }),
	status: text({ length: 20 }).default("active").notNull(),
	invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" } ),
	invitedAt: text("invited_at"),
	joinedAt: text("joined_at"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("team_members_user_idx").on(table.userId),
	index("team_members_org_idx").on(table.organizationId),
]);

