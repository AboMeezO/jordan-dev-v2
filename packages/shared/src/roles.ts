import { z } from "zod";

import { permissionSchema } from "./permissions.js";

export const roleListItemSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable(),
	createdAt: z.string().datetime(),
	userCount: z.number().int().nonnegative(),
});

export const roleListResponseSchema = z.object({
	success: z.literal(true),
	data: z.array(roleListItemSchema),
});

export const roleDetailSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	permissions: z.array(permissionSchema),
	userCount: z.number().int().nonnegative(),
});

export const roleDetailResponseSchema = z.object({
	success: z.literal(true),
	data: roleDetailSchema,
});

export const createRoleSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().max(200).optional(),
	permissions: z.array(permissionSchema).default([]),
});

export const createRoleResponseSchema = z.object({
	success: z.literal(true),
	data: roleDetailSchema,
});

export const updateRoleSchema = z.object({
	name: z.string().min(1).max(50).optional(),
	description: z.string().max(200).nullable().optional(),
});

export const updateRoleResponseSchema = z.object({
	success: z.literal(true),
	data: roleDetailSchema,
});

export const deleteRoleResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		deleted: z.literal(true),
	}),
});

export const rolePermissionAssignmentSchema = z.object({
	permissionIds: z.array(permissionSchema),
});

export const rolePermissionAssignmentResponseSchema = z.object({
	success: z.literal(true),
	data: roleDetailSchema,
});

export type RoleListItem = z.infer<typeof roleListItemSchema>;
export type RoleListResponse = z.infer<typeof roleListResponseSchema>;
export type RoleDetail = z.infer<typeof roleDetailSchema>;
export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type RolePermissionAssignment = z.infer<typeof rolePermissionAssignmentSchema>;
