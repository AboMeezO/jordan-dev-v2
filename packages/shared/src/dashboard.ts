import { z } from "zod";

export const dashboardStatSchema = z.object({
	label: z.string().min(1),
	value: z.number().int().nonnegative(),
});

export const dashboardStatusCountSchema = z.object({
	label: z.string().min(1),
	value: z.number().int().nonnegative(),
});

export const dashboardRoleCountSchema = z.object({
	role: z.string().min(1),
	users: z.number().int().nonnegative(),
});

export const dashboardRecentUserSchema = z.object({
	id: z.string().min(1),
	clerkUserId: z.string().min(1),
	email: z.string().email().nullable(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().url().nullable(),
	createdAt: z.string().datetime(),
});

export const dashboardRecentVerificationEventSchema = z.object({
	id: z.string().min(1),
	type: z.string().min(1),
	status: z.string().min(1),
	message: z.string().nullable(),
	createdAt: z.string().datetime(),
	user: dashboardRecentUserSchema.nullable(),
});

export const dashboardOverviewSchema = z.object({
	stats: z.object({
		totalUsers: z.number().int().nonnegative(),
		totalRoles: z.number().int().nonnegative(),
		totalPermissions: z.number().int().nonnegative(),
		verifiedUsers: z.number().int().nonnegative(),
		unverifiedUsers: z.number().int().nonnegative(),
		pendingRoleGrants: z.number().int().nonnegative(),
	}),
	verificationStatusCounts: z.array(dashboardStatusCountSchema),
	usersByRole: z.array(dashboardRoleCountSchema),
	recentUsers: z.array(dashboardRecentUserSchema),
	recentVerificationEvents: z.array(dashboardRecentVerificationEventSchema),
	system: z.object({
		databaseReady: z.boolean(),
		generatedAt: z.string().datetime(),
	}),
});

export const dashboardOverviewResponseSchema = z.object({
	success: z.literal(true),
	data: dashboardOverviewSchema,
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type DashboardOverviewResponse = z.infer<
	typeof dashboardOverviewResponseSchema
>;
