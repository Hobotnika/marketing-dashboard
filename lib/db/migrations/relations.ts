import { relations } from "drizzle-orm/relations";
import { users, apiLogs, organizations, ads, aiPrompts, customerAvatars, adRatings, kpiSnapshots, aiPromptTemplates, aiAnalyses, dailyRoutines, userPrinciples, cashFlowSnapshots, incomeActivities, transactions, competitors, contentCalendar, marketDefinitions, messageFrameworks, painPoints, usps, churnRiskInterventions, clients, clientHealthMetrics, clientMilestones, clientStageHistory, onboardingTasks, dmScripts, practiceSessions, scriptUsageLogs, keyResults, quarterlyOkrs, monthlyActivities, silentTimeBlocks, visionMilestones, yearlyVisions, weeklyReviews, offerActivities, offers, offerTemplates, offerVersions, connectionGoals, contentExecutionLogs, executionLogs, executionStreaks, loomVideos, newConnections, activityFeed, comments, conversations, messages, notifications, tasks, teamMembers } from "./schema";

export const apiLogsRelations = relations(apiLogs, ({one}) => ({
	user: one(users, {
		fields: [apiLogs.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [apiLogs.organizationId],
		references: [organizations.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	apiLogs: many(apiLogs),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id]
	}),
	ads: many(ads),
	aiPrompts: many(aiPrompts),
	kpiSnapshots: many(kpiSnapshots),
	aiAnalyses: many(aiAnalyses),
	aiPromptTemplates: many(aiPromptTemplates),
	dailyRoutines: many(dailyRoutines),
	userPrinciples: many(userPrinciples),
	cashFlowSnapshots: many(cashFlowSnapshots),
	incomeActivities: many(incomeActivities),
	transactions: many(transactions),
	competitors: many(competitors),
	contentCalendars: many(contentCalendar),
	marketDefinitions: many(marketDefinitions),
	messageFrameworks: many(messageFrameworks),
	churnRiskInterventions: many(churnRiskInterventions),
	clientHealthMetrics: many(clientHealthMetrics),
	clientMilestones: many(clientMilestones),
	clientStageHistories: many(clientStageHistory),
	clients: many(clients),
	onboardingTasks: many(onboardingTasks),
	dmScripts: many(dmScripts),
	practiceSessions: many(practiceSessions),
	scriptUsageLogs: many(scriptUsageLogs),
	monthlyActivities: many(monthlyActivities),
	quarterlyOkrs_ownerId: many(quarterlyOkrs, {
		relationName: "quarterlyOkrs_ownerId_users_id"
	}),
	quarterlyOkrs_userId: many(quarterlyOkrs, {
		relationName: "quarterlyOkrs_userId_users_id"
	}),
	silentTimeBlocks: many(silentTimeBlocks),
	weeklyReviews: many(weeklyReviews),
	yearlyVisions: many(yearlyVisions),
	offerActivities: many(offerActivities),
	offerTemplates: many(offerTemplates),
	offerVersions: many(offerVersions),
	offers: many(offers),
	connectionGoals: many(connectionGoals),
	contentExecutionLogs: many(contentExecutionLogs),
	executionLogs: many(executionLogs),
	executionStreaks: many(executionStreaks),
	loomVideos: many(loomVideos),
	newConnections: many(newConnections),
	activityFeeds: many(activityFeed),
	comments: many(comments),
	messages: many(messages),
	notifications: many(notifications),
	tasks_assignedTo: many(tasks, {
		relationName: "tasks_assignedTo_users_id"
	}),
	tasks_createdBy: many(tasks, {
		relationName: "tasks_createdBy_users_id"
	}),
	teamMembers_invitedBy: many(teamMembers, {
		relationName: "teamMembers_invitedBy_users_id"
	}),
	teamMembers_userId: many(teamMembers, {
		relationName: "teamMembers_userId_users_id"
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	apiLogs: many(apiLogs),
	users: many(users),
	ads: many(ads),
	aiPrompts: many(aiPrompts),
	customerAvatars: many(customerAvatars),
	adRatings: many(adRatings),
	kpiSnapshots: many(kpiSnapshots),
	aiAnalyses: many(aiAnalyses),
	aiPromptTemplates: many(aiPromptTemplates),
	dailyRoutines: many(dailyRoutines),
	userPrinciples: many(userPrinciples),
	cashFlowSnapshots: many(cashFlowSnapshots),
	incomeActivities: many(incomeActivities),
	transactions: many(transactions),
	competitors: many(competitors),
	contentCalendars: many(contentCalendar),
	marketDefinitions: many(marketDefinitions),
	messageFrameworks: many(messageFrameworks),
	painPoints: many(painPoints),
	usps: many(usps),
	churnRiskInterventions: many(churnRiskInterventions),
	clientHealthMetrics: many(clientHealthMetrics),
	clientMilestones: many(clientMilestones),
	clientStageHistories: many(clientStageHistory),
	clients: many(clients),
	onboardingTasks: many(onboardingTasks),
	dmScripts: many(dmScripts),
	practiceSessions: many(practiceSessions),
	scriptUsageLogs: many(scriptUsageLogs),
	keyResults: many(keyResults),
	monthlyActivities: many(monthlyActivities),
	quarterlyOkrs: many(quarterlyOkrs),
	silentTimeBlocks: many(silentTimeBlocks),
	visionMilestones: many(visionMilestones),
	weeklyReviews: many(weeklyReviews),
	yearlyVisions: many(yearlyVisions),
	offerActivities: many(offerActivities),
	offerTemplates: many(offerTemplates),
	offerVersions: many(offerVersions),
	offers: many(offers),
	connectionGoals: many(connectionGoals),
	contentExecutionLogs: many(contentExecutionLogs),
	executionLogs: many(executionLogs),
	executionStreaks: many(executionStreaks),
	loomVideos: many(loomVideos),
	newConnections: many(newConnections),
	activityFeeds: many(activityFeed),
	comments: many(comments),
	conversations: many(conversations),
	messages: many(messages),
	notifications: many(notifications),
	tasks: many(tasks),
	teamMembers: many(teamMembers),
}));

export const adsRelations = relations(ads, ({one, many}) => ({
	user: one(users, {
		fields: [ads.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [ads.organizationId],
		references: [organizations.id]
	}),
	adRatings: many(adRatings),
}));

export const aiPromptsRelations = relations(aiPrompts, ({one}) => ({
	user: one(users, {
		fields: [aiPrompts.createdBy],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [aiPrompts.organizationId],
		references: [organizations.id]
	}),
}));

export const customerAvatarsRelations = relations(customerAvatars, ({one}) => ({
	organization: one(organizations, {
		fields: [customerAvatars.organizationId],
		references: [organizations.id]
	}),
}));

export const adRatingsRelations = relations(adRatings, ({one}) => ({
	organization: one(organizations, {
		fields: [adRatings.organizationId],
		references: [organizations.id]
	}),
	ad: one(ads, {
		fields: [adRatings.adId],
		references: [ads.id]
	}),
}));

export const kpiSnapshotsRelations = relations(kpiSnapshots, ({one}) => ({
	user: one(users, {
		fields: [kpiSnapshots.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [kpiSnapshots.organizationId],
		references: [organizations.id]
	}),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({one}) => ({
	aiPromptTemplate: one(aiPromptTemplates, {
		fields: [aiAnalyses.promptTemplateId],
		references: [aiPromptTemplates.id]
	}),
	user: one(users, {
		fields: [aiAnalyses.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [aiAnalyses.organizationId],
		references: [organizations.id]
	}),
}));

export const aiPromptTemplatesRelations = relations(aiPromptTemplates, ({one, many}) => ({
	aiAnalyses: many(aiAnalyses),
	user: one(users, {
		fields: [aiPromptTemplates.createdBy],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [aiPromptTemplates.organizationId],
		references: [organizations.id]
	}),
}));

export const dailyRoutinesRelations = relations(dailyRoutines, ({one}) => ({
	user: one(users, {
		fields: [dailyRoutines.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [dailyRoutines.organizationId],
		references: [organizations.id]
	}),
}));

export const userPrinciplesRelations = relations(userPrinciples, ({one}) => ({
	user: one(users, {
		fields: [userPrinciples.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [userPrinciples.organizationId],
		references: [organizations.id]
	}),
}));

export const cashFlowSnapshotsRelations = relations(cashFlowSnapshots, ({one}) => ({
	user: one(users, {
		fields: [cashFlowSnapshots.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [cashFlowSnapshots.organizationId],
		references: [organizations.id]
	}),
}));

export const incomeActivitiesRelations = relations(incomeActivities, ({one}) => ({
	user: one(users, {
		fields: [incomeActivities.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [incomeActivities.organizationId],
		references: [organizations.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [transactions.organizationId],
		references: [organizations.id]
	}),
}));

export const competitorsRelations = relations(competitors, ({one}) => ({
	user: one(users, {
		fields: [competitors.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [competitors.organizationId],
		references: [organizations.id]
	}),
}));

export const contentCalendarRelations = relations(contentCalendar, ({one, many}) => ({
	user: one(users, {
		fields: [contentCalendar.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [contentCalendar.organizationId],
		references: [organizations.id]
	}),
	contentExecutionLogs: many(contentExecutionLogs),
}));

export const marketDefinitionsRelations = relations(marketDefinitions, ({one}) => ({
	user: one(users, {
		fields: [marketDefinitions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [marketDefinitions.organizationId],
		references: [organizations.id]
	}),
}));

export const messageFrameworksRelations = relations(messageFrameworks, ({one, many}) => ({
	user: one(users, {
		fields: [messageFrameworks.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [messageFrameworks.organizationId],
		references: [organizations.id]
	}),
	painPoints: many(painPoints),
	usps: many(usps),
}));

export const painPointsRelations = relations(painPoints, ({one}) => ({
	messageFramework: one(messageFrameworks, {
		fields: [painPoints.messageFrameworkId],
		references: [messageFrameworks.id]
	}),
	organization: one(organizations, {
		fields: [painPoints.organizationId],
		references: [organizations.id]
	}),
}));

export const uspsRelations = relations(usps, ({one}) => ({
	messageFramework: one(messageFrameworks, {
		fields: [usps.messageFrameworkId],
		references: [messageFrameworks.id]
	}),
	organization: one(organizations, {
		fields: [usps.organizationId],
		references: [organizations.id]
	}),
}));

export const churnRiskInterventionsRelations = relations(churnRiskInterventions, ({one}) => ({
	user: one(users, {
		fields: [churnRiskInterventions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [churnRiskInterventions.organizationId],
		references: [organizations.id]
	}),
	client: one(clients, {
		fields: [churnRiskInterventions.clientId],
		references: [clients.id]
	}),
}));

export const clientsRelations = relations(clients, ({one, many}) => ({
	churnRiskInterventions: many(churnRiskInterventions),
	clientHealthMetrics: many(clientHealthMetrics),
	clientMilestones: many(clientMilestones),
	clientStageHistories: many(clientStageHistory),
	user: one(users, {
		fields: [clients.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [clients.organizationId],
		references: [organizations.id]
	}),
	onboardingTasks: many(onboardingTasks),
	scriptUsageLogs: many(scriptUsageLogs),
	monthlyActivities: many(monthlyActivities),
	offers: many(offers),
	newConnections: many(newConnections),
}));

export const clientHealthMetricsRelations = relations(clientHealthMetrics, ({one}) => ({
	user: one(users, {
		fields: [clientHealthMetrics.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [clientHealthMetrics.organizationId],
		references: [organizations.id]
	}),
	client: one(clients, {
		fields: [clientHealthMetrics.clientId],
		references: [clients.id]
	}),
}));

export const clientMilestonesRelations = relations(clientMilestones, ({one}) => ({
	user: one(users, {
		fields: [clientMilestones.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [clientMilestones.organizationId],
		references: [organizations.id]
	}),
	client: one(clients, {
		fields: [clientMilestones.clientId],
		references: [clients.id]
	}),
}));

export const clientStageHistoryRelations = relations(clientStageHistory, ({one}) => ({
	user: one(users, {
		fields: [clientStageHistory.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [clientStageHistory.organizationId],
		references: [organizations.id]
	}),
	client: one(clients, {
		fields: [clientStageHistory.clientId],
		references: [clients.id]
	}),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({one}) => ({
	user: one(users, {
		fields: [onboardingTasks.completedBy],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [onboardingTasks.organizationId],
		references: [organizations.id]
	}),
	client: one(clients, {
		fields: [onboardingTasks.clientId],
		references: [clients.id]
	}),
}));

export const dmScriptsRelations = relations(dmScripts, ({one, many}) => ({
	user: one(users, {
		fields: [dmScripts.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [dmScripts.organizationId],
		references: [organizations.id]
	}),
	practiceSessions: many(practiceSessions),
	scriptUsageLogs: many(scriptUsageLogs),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({one}) => ({
	dmScript: one(dmScripts, {
		fields: [practiceSessions.scriptId],
		references: [dmScripts.id]
	}),
	user: one(users, {
		fields: [practiceSessions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [practiceSessions.organizationId],
		references: [organizations.id]
	}),
}));

export const scriptUsageLogsRelations = relations(scriptUsageLogs, ({one}) => ({
	client: one(clients, {
		fields: [scriptUsageLogs.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [scriptUsageLogs.userId],
		references: [users.id]
	}),
	dmScript: one(dmScripts, {
		fields: [scriptUsageLogs.scriptId],
		references: [dmScripts.id]
	}),
	organization: one(organizations, {
		fields: [scriptUsageLogs.organizationId],
		references: [organizations.id]
	}),
}));

export const keyResultsRelations = relations(keyResults, ({one}) => ({
	organization: one(organizations, {
		fields: [keyResults.organizationId],
		references: [organizations.id]
	}),
	quarterlyOkr: one(quarterlyOkrs, {
		fields: [keyResults.okrId],
		references: [quarterlyOkrs.id]
	}),
}));

export const quarterlyOkrsRelations = relations(quarterlyOkrs, ({one, many}) => ({
	keyResults: many(keyResults),
	user_ownerId: one(users, {
		fields: [quarterlyOkrs.ownerId],
		references: [users.id],
		relationName: "quarterlyOkrs_ownerId_users_id"
	}),
	user_userId: one(users, {
		fields: [quarterlyOkrs.userId],
		references: [users.id],
		relationName: "quarterlyOkrs_userId_users_id"
	}),
	organization: one(organizations, {
		fields: [quarterlyOkrs.organizationId],
		references: [organizations.id]
	}),
}));

export const monthlyActivitiesRelations = relations(monthlyActivities, ({one, many}) => ({
	client: one(clients, {
		fields: [monthlyActivities.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [monthlyActivities.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [monthlyActivities.organizationId],
		references: [organizations.id]
	}),
	executionLogs: many(executionLogs),
}));

export const silentTimeBlocksRelations = relations(silentTimeBlocks, ({one}) => ({
	user: one(users, {
		fields: [silentTimeBlocks.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [silentTimeBlocks.organizationId],
		references: [organizations.id]
	}),
}));

export const visionMilestonesRelations = relations(visionMilestones, ({one}) => ({
	organization: one(organizations, {
		fields: [visionMilestones.organizationId],
		references: [organizations.id]
	}),
	yearlyVision: one(yearlyVisions, {
		fields: [visionMilestones.visionId],
		references: [yearlyVisions.id]
	}),
}));

export const yearlyVisionsRelations = relations(yearlyVisions, ({one, many}) => ({
	visionMilestones: many(visionMilestones),
	user: one(users, {
		fields: [yearlyVisions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [yearlyVisions.organizationId],
		references: [organizations.id]
	}),
}));

export const weeklyReviewsRelations = relations(weeklyReviews, ({one}) => ({
	user: one(users, {
		fields: [weeklyReviews.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [weeklyReviews.organizationId],
		references: [organizations.id]
	}),
}));

export const offerActivitiesRelations = relations(offerActivities, ({one}) => ({
	user: one(users, {
		fields: [offerActivities.performedBy],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [offerActivities.organizationId],
		references: [organizations.id]
	}),
	offer: one(offers, {
		fields: [offerActivities.offerId],
		references: [offers.id]
	}),
}));

export const offersRelations = relations(offers, ({one, many}) => ({
	offerActivities: many(offerActivities),
	offerVersions: many(offerVersions),
	offerTemplate: one(offerTemplates, {
		fields: [offers.templateId],
		references: [offerTemplates.id]
	}),
	client: one(clients, {
		fields: [offers.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [offers.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [offers.organizationId],
		references: [organizations.id]
	}),
}));

export const offerTemplatesRelations = relations(offerTemplates, ({one, many}) => ({
	user: one(users, {
		fields: [offerTemplates.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [offerTemplates.organizationId],
		references: [organizations.id]
	}),
	offers: many(offers),
}));

export const offerVersionsRelations = relations(offerVersions, ({one}) => ({
	user: one(users, {
		fields: [offerVersions.createdBy],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [offerVersions.organizationId],
		references: [organizations.id]
	}),
	offer: one(offers, {
		fields: [offerVersions.offerId],
		references: [offers.id]
	}),
}));

export const connectionGoalsRelations = relations(connectionGoals, ({one}) => ({
	user: one(users, {
		fields: [connectionGoals.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [connectionGoals.organizationId],
		references: [organizations.id]
	}),
}));

export const contentExecutionLogsRelations = relations(contentExecutionLogs, ({one}) => ({
	contentCalendar: one(contentCalendar, {
		fields: [contentExecutionLogs.plannedContentId],
		references: [contentCalendar.id]
	}),
	user: one(users, {
		fields: [contentExecutionLogs.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [contentExecutionLogs.organizationId],
		references: [organizations.id]
	}),
}));

export const executionLogsRelations = relations(executionLogs, ({one}) => ({
	monthlyActivity: one(monthlyActivities, {
		fields: [executionLogs.plannedActivityId],
		references: [monthlyActivities.id]
	}),
	user: one(users, {
		fields: [executionLogs.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [executionLogs.organizationId],
		references: [organizations.id]
	}),
}));

export const executionStreaksRelations = relations(executionStreaks, ({one}) => ({
	user: one(users, {
		fields: [executionStreaks.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [executionStreaks.organizationId],
		references: [organizations.id]
	}),
}));

export const loomVideosRelations = relations(loomVideos, ({one}) => ({
	user: one(users, {
		fields: [loomVideos.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [loomVideos.organizationId],
		references: [organizations.id]
	}),
}));

export const newConnectionsRelations = relations(newConnections, ({one}) => ({
	client: one(clients, {
		fields: [newConnections.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [newConnections.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [newConnections.organizationId],
		references: [organizations.id]
	}),
}));

export const activityFeedRelations = relations(activityFeed, ({one}) => ({
	user: one(users, {
		fields: [activityFeed.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [activityFeed.organizationId],
		references: [organizations.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	comment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
		relationName: "comments_parentCommentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentCommentId_comments_id"
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [comments.organizationId],
		references: [organizations.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	organization: one(organizations, {
		fields: [conversations.organizationId],
		references: [organizations.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	organization: one(organizations, {
		fields: [messages.organizationId],
		references: [organizations.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [notifications.organizationId],
		references: [organizations.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	user_assignedTo: one(users, {
		fields: [tasks.assignedTo],
		references: [users.id],
		relationName: "tasks_assignedTo_users_id"
	}),
	user_createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: "tasks_createdBy_users_id"
	}),
	organization: one(organizations, {
		fields: [tasks.organizationId],
		references: [organizations.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user_invitedBy: one(users, {
		fields: [teamMembers.invitedBy],
		references: [users.id],
		relationName: "teamMembers_invitedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
		relationName: "teamMembers_userId_users_id"
	}),
	organization: one(organizations, {
		fields: [teamMembers.organizationId],
		references: [organizations.id]
	}),
}));