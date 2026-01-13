CREATE TABLE `activity_feed` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`activity_type` text(50) NOT NULL,
	`entity_type` text(50),
	`entity_id` text,
	`activity_text` text NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_feed_org_idx` ON `activity_feed` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `activity_feed_created_idx` ON `activity_feed` (`created_at`);--> statement-breakpoint
CREATE TABLE `ad_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`ad_id` text,
	`workspace_id` text NOT NULL,
	`avatar_set_name` text(100) NOT NULL,
	`niche` text(200) NOT NULL,
	`avatar_feedbacks` text NOT NULL,
	`total_avatars` integer DEFAULT 13 NOT NULL,
	`positive_count` integer DEFAULT 0 NOT NULL,
	`mixed_count` integer DEFAULT 0 NOT NULL,
	`negative_count` integer DEFAULT 0 NOT NULL,
	`processing_time_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rating_ad_workspace_idx` ON `ad_ratings` (`ad_id`,`workspace_id`);--> statement-breakpoint
CREATE INDEX `rating_workspace_idx` ON `ad_ratings` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `rating_created_at_idx` ON `ad_ratings` (`created_at`);--> statement-breakpoint
CREATE TABLE `ads` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text,
	`ai_generated` integer DEFAULT false NOT NULL,
	`ai_prompt` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`ad_type` text NOT NULL,
	`headline` text NOT NULL,
	`body_text` text NOT NULL,
	`call_to_action` text NOT NULL,
	`landing_page` text,
	`word_count` integer,
	`platform_ad_id` text,
	`platform_config` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ad_workspace_idx` ON `ads` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `ad_status_idx` ON `ads` (`status`);--> statement-breakpoint
CREATE INDEX `ad_ai_generated_idx` ON `ads` (`ai_generated`);--> statement-breakpoint
CREATE INDEX `ad_created_at_idx` ON `ads` (`created_at`);--> statement-breakpoint
CREATE TABLE `ai_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`section_name` text NOT NULL,
	`prompt_template_id` text,
	`prompt_name` text NOT NULL,
	`input_data` text NOT NULL,
	`output` text NOT NULL,
	`action_items` text,
	`tokens_used` integer,
	`processing_time` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prompt_template_id`) REFERENCES `ai_prompt_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ai_analysis_workspace_idx` ON `ai_analyses` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `ai_analysis_section_idx` ON `ai_analyses` (`section_name`);--> statement-breakpoint
CREATE INDEX `ai_analysis_user_idx` ON `ai_analyses` (`user_id`);--> statement-breakpoint
CREATE INDEX `ai_analysis_created_at_idx` ON `ai_analyses` (`created_at`);--> statement-breakpoint
CREATE TABLE `ai_prompt_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`section_name` text NOT NULL,
	`prompt_name` text NOT NULL,
	`description` text,
	`system_prompt` text NOT NULL,
	`user_prompt_template` text NOT NULL,
	`data_inputs` text NOT NULL,
	`triggers` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_prompt_template_workspace_idx` ON `ai_prompt_templates` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `ai_prompt_template_section_idx` ON `ai_prompt_templates` (`section_name`);--> statement-breakpoint
CREATE INDEX `ai_prompt_template_active_idx` ON `ai_prompt_templates` (`is_active`);--> statement-breakpoint
CREATE TABLE `ai_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`prompt_type` text DEFAULT 'custom' NOT NULL,
	`prompt_text` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`avg_quality_score` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prompt_workspace_idx` ON `ai_prompts` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `prompt_category_idx` ON `ai_prompts` (`category`);--> statement-breakpoint
CREATE INDEX `prompt_is_default_idx` ON `ai_prompts` (`is_default`);--> statement-breakpoint
CREATE INDEX `prompt_is_active_idx` ON `ai_prompts` (`is_active`);--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text,
	`api_name` text NOT NULL,
	`endpoint` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `log_workspace_idx` ON `api_logs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `log_timestamp_idx` ON `api_logs` (`timestamp`);--> statement-breakpoint
CREATE TABLE `cash_flow_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`total_revenue` integer DEFAULT 0 NOT NULL,
	`total_expenses` integer DEFAULT 0 NOT NULL,
	`net_cash_flow` integer DEFAULT 0 NOT NULL,
	`revenue_from_ads` integer DEFAULT 0 NOT NULL,
	`revenue_from_dms` integer DEFAULT 0 NOT NULL,
	`revenue_from_calls` integer DEFAULT 0 NOT NULL,
	`revenue_from_other` integer DEFAULT 0 NOT NULL,
	`expense_ads` integer DEFAULT 0 NOT NULL,
	`expense_software` integer DEFAULT 0 NOT NULL,
	`expense_contractors` integer DEFAULT 0 NOT NULL,
	`expense_education` integer DEFAULT 0 NOT NULL,
	`expense_office` integer DEFAULT 0 NOT NULL,
	`expense_other` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cashflow_workspace_idx` ON `cash_flow_snapshots` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `cashflow_date_idx` ON `cash_flow_snapshots` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `cashflow_workspace_date_idx` ON `cash_flow_snapshots` (`workspace_id`,`date`);--> statement-breakpoint
CREATE TABLE `churn_risk_interventions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`risk_level` text(20) NOT NULL,
	`intervention_type` text(50) NOT NULL,
	`description` text NOT NULL,
	`outcome` text(20),
	`health_score_before` integer,
	`health_score_after` integer,
	`intervention_date` text NOT NULL,
	`follow_up_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `churn_risk_interventions_client_idx` ON `churn_risk_interventions` (`client_id`);--> statement-breakpoint
CREATE INDEX `churn_risk_interventions_org_idx` ON `churn_risk_interventions` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `client_health_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`metric_type` text(50) NOT NULL,
	`value` text(255),
	`notes` text,
	`impact_on_health` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_health_metrics_client_idx` ON `client_health_metrics` (`client_id`);--> statement-breakpoint
CREATE INDEX `client_health_metrics_org_idx` ON `client_health_metrics` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `client_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`milestone_type` text(50) NOT NULL,
	`description` text NOT NULL,
	`achieved_date` text NOT NULL,
	`value` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_milestones_client_idx` ON `client_milestones` (`client_id`);--> statement-breakpoint
CREATE INDEX `client_milestones_org_idx` ON `client_milestones` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `client_stage_history` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`from_stage` text(20),
	`to_stage` text(20) NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_stage_history_client_idx` ON `client_stage_history` (`client_id`);--> statement-breakpoint
CREATE INDEX `client_stage_history_org_idx` ON `client_stage_history` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text(100) NOT NULL,
	`email` text(255),
	`phone` text(50),
	`company` text(100),
	`industry` text(100),
	`plan` text(50) DEFAULT 'starter' NOT NULL,
	`mrr` text DEFAULT '0.00' NOT NULL,
	`contract_start_date` text NOT NULL,
	`contract_end_date` text,
	`status` text(20) DEFAULT 'active' NOT NULL,
	`current_stage` text(20) DEFAULT 'sign_up' NOT NULL,
	`health_score` integer DEFAULT 50 NOT NULL,
	`last_activity_date` text,
	`stage_entered_at` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clients_org_idx` ON `clients` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `clients_status_idx` ON `clients` (`status`);--> statement-breakpoint
CREATE INDEX `clients_health_score_idx` ON `clients` (`health_score`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`entity_type` text(50) NOT NULL,
	`entity_id` text NOT NULL,
	`comment_text` text NOT NULL,
	`mentions` text,
	`parent_comment_id` text,
	`is_edited` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_entity_idx` ON `comments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `comments_org_idx` ON `comments` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`description` text,
	`strengths` text,
	`weaknesses` text,
	`last_analyzed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `competitor_workspace_idx` ON `competitors` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `connection_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`daily_goal` integer DEFAULT 5 NOT NULL,
	`weekly_goal` integer DEFAULT 25 NOT NULL,
	`monthly_goal` integer DEFAULT 100 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connection_goals_user_idx` ON `connection_goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'idea' NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`notes` text,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `content_calendar_workspace_idx` ON `content_calendar` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `content_calendar_date_idx` ON `content_calendar` (`scheduled_date`);--> statement-breakpoint
CREATE INDEX `content_calendar_platform_idx` ON `content_calendar` (`platform`);--> statement-breakpoint
CREATE INDEX `content_calendar_status_idx` ON `content_calendar` (`status`);--> statement-breakpoint
CREATE INDEX `content_calendar_org_date_idx` ON `content_calendar` (`workspace_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `content_execution_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`platform` text(50) NOT NULL,
	`content_type` text(50),
	`title` text(200) NOT NULL,
	`planned_content_id` text,
	`was_planned` integer DEFAULT false NOT NULL,
	`status` text(20) DEFAULT 'published' NOT NULL,
	`published_url` text(500),
	`checklist_items` text,
	`performance_notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planned_content_id`) REFERENCES `content_calendar`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `content_execution_logs_user_date_idx` ON `content_execution_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `content_execution_logs_user_idx` ON `content_execution_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`type` text(20) NOT NULL,
	`participants` text NOT NULL,
	`last_message_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversations_org_idx` ON `conversations` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `customer_avatars` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`set_name` text(100) NOT NULL,
	`niche` text(200) NOT NULL,
	`description` text,
	`avatar_name` text(100) NOT NULL,
	`persona_data` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `avatar_workspace_set_idx` ON `customer_avatars` (`workspace_id`,`set_name`);--> statement-breakpoint
CREATE INDEX `avatar_active_idx` ON `customer_avatars` (`is_active`);--> statement-breakpoint
CREATE TABLE `daily_routines` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`is_private` integer DEFAULT true NOT NULL,
	`date` text NOT NULL,
	`exercise_completed` integer DEFAULT false,
	`exercise_type` text,
	`exercise_duration` integer,
	`gratitude_completed` integer DEFAULT false,
	`gratitude_entry` text,
	`meditation_completed` integer DEFAULT false,
	`meditation_duration` integer,
	`breathwork_completed` integer DEFAULT false,
	`breathwork_duration` integer,
	`self_image_update` text,
	`completion_rate` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routine_workspace_idx` ON `daily_routines` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `routine_user_idx` ON `daily_routines` (`user_id`);--> statement-breakpoint
CREATE INDEX `routine_date_idx` ON `daily_routines` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `routine_unique_user_date_idx` ON `daily_routines` (`workspace_id`,`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `dm_scripts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text(100) NOT NULL,
	`category` text(50) NOT NULL,
	`content` text NOT NULL,
	`use_case` text,
	`talking_points` text,
	`expected_outcomes` text,
	`success_tips` text,
	`order` integer DEFAULT 0 NOT NULL,
	`is_default_template` integer DEFAULT false NOT NULL,
	`times_used` integer DEFAULT 0 NOT NULL,
	`success_rate` text DEFAULT '0.00',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dm_scripts_org_idx` ON `dm_scripts` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `dm_scripts_category_idx` ON `dm_scripts` (`category`);--> statement-breakpoint
CREATE TABLE `execution_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`activity_title` text(200) NOT NULL,
	`activity_type` text(20),
	`planned_activity_id` text,
	`was_planned` integer DEFAULT false NOT NULL,
	`planned_duration_minutes` integer,
	`actual_duration_minutes` integer,
	`notes` text,
	`outcome` text,
	`completed_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planned_activity_id`) REFERENCES `monthly_activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `execution_logs_user_date_idx` ON `execution_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `execution_logs_planned_idx` ON `execution_logs` (`planned_activity_id`);--> statement-breakpoint
CREATE INDEX `execution_logs_user_idx` ON `execution_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `execution_streaks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`streak_type` text(50) NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_activity_date` text,
	`last_broken_date` text,
	`streak_goal` integer DEFAULT 30 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `execution_streaks_user_type_idx` ON `execution_streaks` (`user_id`,`streak_type`);--> statement-breakpoint
CREATE TABLE `income_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`description` text,
	`amount` integer,
	`kpis_stage` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `income_workspace_idx` ON `income_activities` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `income_user_idx` ON `income_activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `income_date_idx` ON `income_activities` (`date`);--> statement-breakpoint
CREATE INDEX `income_workspace_date_idx` ON `income_activities` (`workspace_id`,`date`);--> statement-breakpoint
CREATE TABLE `key_results` (
	`id` text PRIMARY KEY NOT NULL,
	`okr_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`description` text(200) NOT NULL,
	`metric_type` text(50),
	`target_value` text NOT NULL,
	`current_value` text DEFAULT '0' NOT NULL,
	`unit` text(20),
	`progress_percentage` integer DEFAULT 0 NOT NULL,
	`last_updated` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`okr_id`) REFERENCES `quarterly_okrs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `key_results_org_idx` ON `key_results` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `key_results_okr_idx` ON `key_results` (`okr_id`);--> statement-breakpoint
CREATE TABLE `kpi_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`exposure` integer DEFAULT 0 NOT NULL,
	`leads` integer DEFAULT 0 NOT NULL,
	`qualified_leads` integer DEFAULT 0 NOT NULL,
	`ss1_total` integer DEFAULT 0 NOT NULL,
	`ss1_six_boxes` integer DEFAULT 0 NOT NULL,
	`ss1_dms` integer DEFAULT 0 NOT NULL,
	`check_ins` integer DEFAULT 0 NOT NULL,
	`prescription_close` integer DEFAULT 0 NOT NULL,
	`closes` integer DEFAULT 0 NOT NULL,
	`upsells` integer DEFAULT 0 NOT NULL,
	`churn` integer DEFAULT 0 NOT NULL,
	`churn_reasons` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `kpi_workspace_idx` ON `kpi_snapshots` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `kpi_date_idx` ON `kpi_snapshots` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `kpi_workspace_date_idx` ON `kpi_snapshots` (`workspace_id`,`date`);--> statement-breakpoint
CREATE TABLE `loom_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text(200) NOT NULL,
	`category` text(50),
	`loom_url` text(500) NOT NULL,
	`description` text,
	`duration_seconds` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `loom_videos_org_idx` ON `loom_videos` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `market_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`target_market_description` text,
	`primary_segment` text,
	`secondary_segment` text,
	`niche_positioning` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `market_def_workspace_idx` ON `market_definitions` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `market_def_unique_org_idx` ON `market_definitions` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `message_frameworks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value_proposition` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `msg_framework_workspace_idx` ON `message_frameworks` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `msg_framework_unique_org_idx` ON `message_frameworks` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`message_text` text NOT NULL,
	`attachments` text,
	`is_announcement` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `monthly_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text(100) NOT NULL,
	`activity_type` text(20) NOT NULL,
	`category` text(50),
	`time_slot` text(20),
	`duration_minutes` integer,
	`description` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`actual_outcome` text,
	`client_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `monthly_activities_org_idx` ON `monthly_activities` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `monthly_activities_user_idx` ON `monthly_activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `monthly_activities_date_idx` ON `monthly_activities` (`date`);--> statement-breakpoint
CREATE INDEX `monthly_activities_user_date_idx` ON `monthly_activities` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `new_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`connection_name` text(100) NOT NULL,
	`connection_type` text(50) NOT NULL,
	`platform` text(50),
	`quality` text(50),
	`context` text,
	`follow_up_needed` integer DEFAULT false NOT NULL,
	`follow_up_date` text,
	`follow_up_completed` integer DEFAULT false NOT NULL,
	`client_id` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `new_connections_user_date_idx` ON `new_connections` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `new_connections_user_idx` ON `new_connections` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`notification_type` text(50) NOT NULL,
	`title` text(200) NOT NULL,
	`message` text,
	`link` text(500),
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE TABLE `offer_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`activity_type` text(50) NOT NULL,
	`performed_by` text,
	`ip_address` text(50),
	`user_agent` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `offer_activities_offer_idx` ON `offer_activities` (`offer_id`);--> statement-breakpoint
CREATE INDEX `offer_activities_org_idx` ON `offer_activities` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `offer_activities_type_idx` ON `offer_activities` (`activity_type`);--> statement-breakpoint
CREATE TABLE `offer_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text(100) NOT NULL,
	`category` text(50) NOT NULL,
	`description` text,
	`structure_type` text(20) NOT NULL,
	`sections` text NOT NULL,
	`default_terms` text,
	`is_default_template` integer DEFAULT false NOT NULL,
	`times_used` integer DEFAULT 0 NOT NULL,
	`average_acceptance_rate` text DEFAULT '0.00',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `offer_templates_org_idx` ON `offer_templates` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `offer_templates_category_idx` ON `offer_templates` (`category`);--> statement-breakpoint
CREATE TABLE `offer_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`changes_summary` text,
	`created_by` text,
	`content_snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `offer_versions_offer_idx` ON `offer_versions` (`offer_id`);--> statement-breakpoint
CREATE INDEX `offer_versions_org_idx` ON `offer_versions` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text,
	`template_id` text,
	`offer_id` text(20) NOT NULL,
	`title` text(200) NOT NULL,
	`unique_share_link` text(100) NOT NULL,
	`content` text NOT NULL,
	`custom_message` text,
	`total_value` text NOT NULL,
	`discount_amount` text DEFAULT '0.00',
	`final_value` text NOT NULL,
	`currency` text(3) DEFAULT 'USD' NOT NULL,
	`payment_terms` text(100),
	`due_date` text,
	`valid_until` text,
	`sent_date` text,
	`viewed_date` text,
	`decision_date` text,
	`status` text(20) DEFAULT 'draft' NOT NULL,
	`decision_reason` text,
	`is_password_protected` integer DEFAULT false NOT NULL,
	`password` text(100),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `offer_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `offers_offer_id_unique` ON `offers` (`offer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `offers_unique_share_link_unique` ON `offers` (`unique_share_link`);--> statement-breakpoint
CREATE INDEX `offers_org_idx` ON `offers` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `offers_client_idx` ON `offers` (`client_id`);--> statement-breakpoint
CREATE INDEX `offers_status_idx` ON `offers` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `offers_share_link_idx` ON `offers` (`unique_share_link`);--> statement-breakpoint
CREATE UNIQUE INDEX `offers_offer_id_idx` ON `offers` (`offer_id`);--> statement-breakpoint
CREATE TABLE `onboarding_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`task_name` text(200) NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`completed_by` text,
	`due_date` text,
	`order` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `onboarding_tasks_client_idx` ON `onboarding_tasks` (`client_id`);--> statement-breakpoint
CREATE INDEX `onboarding_tasks_org_idx` ON `onboarding_tasks` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `pain_points` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`message_framework_id` text NOT NULL,
	`description` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_framework_id`) REFERENCES `message_frameworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pain_point_workspace_idx` ON `pain_points` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `pain_point_framework_idx` ON `pain_points` (`message_framework_id`);--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`script_id` text NOT NULL,
	`persona_type` text(50) NOT NULL,
	`difficulty_level` text(20) NOT NULL,
	`client_context` text,
	`conversation_history` text NOT NULL,
	`duration_seconds` integer,
	`ai_feedback_score` integer,
	`ai_feedback_text` text,
	`what_went_well` text,
	`areas_to_improve` text,
	`missed_opportunities` text,
	`practice_date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`script_id`) REFERENCES `dm_scripts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `practice_sessions_org_idx` ON `practice_sessions` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `practice_sessions_user_idx` ON `practice_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `practice_sessions_script_idx` ON `practice_sessions` (`script_id`);--> statement-breakpoint
CREATE TABLE `quarterly_okrs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`owner_id` text,
	`quarter` text(2) NOT NULL,
	`year` integer NOT NULL,
	`objective_title` text(200) NOT NULL,
	`objective_description` text,
	`status` text(20) DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `quarterly_okrs_org_idx` ON `quarterly_okrs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `quarterly_okrs_quarter_year_idx` ON `quarterly_okrs` (`workspace_id`,`quarter`,`year`);--> statement-breakpoint
CREATE TABLE `script_usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`script_id` text NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text,
	`used_at` text NOT NULL,
	`outcome` text(30) NOT NULL,
	`notes` text,
	`what_worked` text,
	`what_didnt_work` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`script_id`) REFERENCES `dm_scripts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `script_usage_logs_org_idx` ON `script_usage_logs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `script_usage_logs_script_idx` ON `script_usage_logs` (`script_id`);--> statement-breakpoint
CREATE INDEX `script_usage_logs_user_idx` ON `script_usage_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `silent_time_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`activity_focus` text(200),
	`phone_was_silent` integer DEFAULT true NOT NULL,
	`quality_rating` integer,
	`notes` text,
	`accomplishments` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `silent_time_blocks_org_idx` ON `silent_time_blocks` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `silent_time_blocks_user_idx` ON `silent_time_blocks` (`user_id`);--> statement-breakpoint
CREATE INDEX `silent_time_blocks_date_idx` ON `silent_time_blocks` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`created_by` text NOT NULL,
	`assigned_to` text,
	`task_type` text(50),
	`linked_entity_id` text,
	`linked_section` text(50),
	`title` text(200) NOT NULL,
	`description` text,
	`priority` text(20) DEFAULT 'medium' NOT NULL,
	`status` text(20) DEFAULT 'todo' NOT NULL,
	`due_date` text,
	`completed_at` text,
	`estimated_time_minutes` integer,
	`actual_time_minutes` integer,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tasks_org_idx` ON `tasks` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `tasks_assigned_idx` ON `tasks` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text(20) DEFAULT 'member' NOT NULL,
	`department` text(50),
	`title` text(100),
	`status` text(20) DEFAULT 'active' NOT NULL,
	`invited_by` text,
	`invited_at` text,
	`joined_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `team_members_org_idx` ON `team_members` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `team_members_user_idx` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`vendor` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transaction_workspace_idx` ON `transactions` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `transaction_user_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transaction_category_idx` ON `transactions` (`category`);--> statement-breakpoint
CREATE INDEX `transaction_workspace_date_idx` ON `transactions` (`workspace_id`,`date`);--> statement-breakpoint
CREATE TABLE `user_principles` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`is_private` integer DEFAULT true NOT NULL,
	`principles` text,
	`purpose` text,
	`self_image` text,
	`show_principle_reminder` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `principles_workspace_idx` ON `user_principles` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `principles_user_idx` ON `user_principles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `principles_unique_user_idx` ON `user_principles` (`workspace_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`invited_by` text,
	`invited_at` text,
	`joined_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_workspace_unique_idx` ON `user_workspaces` (`user_id`,`workspace_id`);--> statement-breakpoint
CREATE INDEX `user_workspaces_user_idx` ON `user_workspaces` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_workspaces_workspace_idx` ON `user_workspaces` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`current_workspace_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`current_workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `user_current_workspace_idx` ON `users` (`current_workspace_id`);--> statement-breakpoint
CREATE TABLE `usps` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`message_framework_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_framework_id`) REFERENCES `message_frameworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usp_workspace_idx` ON `usps` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `usp_framework_idx` ON `usps` (`message_framework_id`);--> statement-breakpoint
CREATE TABLE `vision_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`vision_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text(100) NOT NULL,
	`target_date` text NOT NULL,
	`category` text(50),
	`description` text,
	`is_achieved` integer DEFAULT false NOT NULL,
	`achieved_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`vision_id`) REFERENCES `yearly_visions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vision_milestones_org_idx` ON `vision_milestones` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `vision_milestones_vision_idx` ON `vision_milestones` (`vision_id`);--> statement-breakpoint
CREATE TABLE `weekly_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`week_start_date` text NOT NULL,
	`week_end_date` text NOT NULL,
	`wins` text,
	`learnings` text,
	`challenges` text,
	`next_week_priorities` text,
	`gratitude` text,
	`weekly_revenue` text,
	`new_clients` integer,
	`content_published` integer,
	`scripts_practiced` integer,
	`completed_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `weekly_reviews_org_idx` ON `weekly_reviews` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `weekly_reviews_user_idx` ON `weekly_reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `weekly_reviews_week_start_idx` ON `weekly_reviews` (`user_id`,`week_start_date`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text NOT NULL,
	`owner_id` text NOT NULL,
	`calendly_access_token` text,
	`calendly_user_uri` text,
	`stripe_secret_key` text,
	`google_sheets_id` text,
	`meta_access_token` text,
	`meta_ad_account_id` text,
	`google_ads_client_id` text,
	`google_ads_client_secret` text,
	`google_ads_refresh_token` text,
	`google_ads_customer_id` text,
	`logo_url` text,
	`status` text DEFAULT 'trial' NOT NULL,
	`brand_voice_profile` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_subdomain_unique` ON `workspaces` (`subdomain`);--> statement-breakpoint
CREATE UNIQUE INDEX `subdomain_idx` ON `workspaces` (`subdomain`);--> statement-breakpoint
CREATE INDEX `workspace_owner_idx` ON `workspaces` (`owner_id`);--> statement-breakpoint
CREATE TABLE `yearly_visions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`theme_focus` text,
	`annual_revenue_target` text,
	`annual_profit_target` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `yearly_visions_org_idx` ON `yearly_visions` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `yearly_visions_year_idx` ON `yearly_visions` (`workspace_id`,`year`);