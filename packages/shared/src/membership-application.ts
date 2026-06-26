import { z } from "zod";

export const applicationStatusSchema = z.enum([
	"DRAFTING",
	"SUBMITTED",
	"UNDER_REVIEW",
	"APPROVED",
	"REJECTED",
]);

export const referralSourceSchema = z.enum([
	"REDDIT",
	"FRIEND_INVITE",
	"WEB_SEARCH",
	"GITHUB",
	"OTHER",
]);

export const experienceLevelSchema = z.enum([
	"JUNIOR",
	"MID",
	"SENIOR",
	"STAFF",
]);

export const createApplicationSchema = z.object({
	guildId: z.string().min(1),
	displayName: z.string().min(1).max(100),
	githubHandle: z.string().min(1).max(100),
	strongestProject: z.string().min(1).max(200),
	projectExplanation: z.string().min(1).max(2000),
	techStack: z.string().min(1).max(500),
	experienceLevel: experienceLevelSchema,
	purposeOfJoining: z.string().min(1).max(1000),
	selfIntroduction: z.string().min(1).max(2000),
	linkedInUrl: z.string().url().max(500).nullable().optional(),
	portfolioUrl: z.string().url().max(500).nullable().optional(),
	referralSource: referralSourceSchema,
	referralOtherText: z.string().max(500).nullable().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const submitApplicationSchema = z.object({
	applicationId: z.string().min(1),
});

export const claimReviewSchema = z.object({
	applicationId: z.string().min(1),
});

export const approveApplicationSchema = z.object({
	applicationId: z.string().min(1),
});

export const rejectApplicationSchema = z.object({
	applicationId: z.string().min(1),
	reason: z.string().min(1).max(1000),
});

export const applicationSummarySchema = z.object({
	id: z.string().min(1),
	userId: z.string().min(1),
	guildId: z.string().min(1),
	status: applicationStatusSchema,
	displayName: z.string().min(1),
	githubHandle: z.string().min(1),
	experienceLevel: experienceLevelSchema,
	createdAt: z.string().datetime(),
});

export const applicationDetailSchema = z.object({
	id: z.string().min(1),
	userId: z.string().min(1),
	discordUserId: z.string().nullable(),
	guildId: z.string().min(1),
	status: applicationStatusSchema,
	displayName: z.string().min(1),
	githubHandle: z.string().min(1),
	strongestProject: z.string().min(1),
	projectExplanation: z.string().min(1),
	techStack: z.string().min(1),
	experienceLevel: experienceLevelSchema,
	purposeOfJoining: z.string().min(1),
	selfIntroduction: z.string().min(1),
	linkedInUrl: z.string().nullable(),
	portfolioUrl: z.string().nullable(),
	referralSource: referralSourceSchema,
	referralOtherText: z.string().nullable(),
	reviewedBy: z.string().nullable(),
	reviewedAt: z.string().datetime().nullable(),
	rejectionReason: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const applicationListSchema = z.object({
	applications: z.array(applicationSummarySchema),
	total: z.number().int().nonnegative(),
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
});

export const applicationDetailResponseSchema = z.object({
	success: z.literal(true),
	data: applicationDetailSchema,
});

export const applicationListResponseSchema = z.object({
	success: z.literal(true),
	data: applicationListSchema,
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ReferralSource = z.infer<typeof referralSourceSchema>;
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;
export type CreateApplicationRequest = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationRequest = z.infer<typeof updateApplicationSchema>;
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;
export type ApplicationList = z.infer<typeof applicationListSchema>;
