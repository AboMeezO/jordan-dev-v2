import { z } from "zod";

export const userListItemSchema = z.object({
	id: z.string().min(1),
	clerkUserId: z.string().min(1),
	email: z.string().email().nullable(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().url().nullable(),
	createdAt: z.string().datetime(),
	roles: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
		}),
	),
});

export const userListRequestSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(100)
		.default(20),
	search: z.string().optional(),
	roleId: z.string().optional(),
});

export const userListResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		users: z.array(userListItemSchema),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		limit: z.number().int().positive(),
	}),
});

export const userDetailSchema = z.object({
	id: z.string().min(1),
	clerkUserId: z.string().min(1),
	email: z.string().email().nullable(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().url().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	roles: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
		}),
	),
});

export const userDetailResponseSchema = z.object({
	success: z.literal(true),
	data: userDetailSchema,
});

export const updateUserSchema = z.object({
	displayName: z.string().min(1).max(100).optional(),
	email: z.string().email().optional(),
});

export const updateUserResponseSchema = z.object({
	success: z.literal(true),
	data: userDetailSchema,
});

export const userRoleAssignmentSchema = z.object({
	roleIds: z.array(z.string().min(1)),
});

export const userRoleAssignmentResponseSchema = z.object({
	success: z.literal(true),
	data: userDetailSchema,
});

export type UserListItem = z.infer<
	typeof userListItemSchema
>;
export type UserListRequest = z.infer<
	typeof userListRequestSchema
>;
export type UserListResponse = z.infer<
	typeof userListResponseSchema
>;
export type UserDetail = z.infer<typeof userDetailSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserRoleAssignment = z.infer<
	typeof userRoleAssignmentSchema
>;
