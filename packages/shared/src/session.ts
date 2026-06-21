import { z } from "zod";

import { permissionSchema } from "./permissions.js";

export const sessionUserSchema = z.object({
	id: z.string().min(1),
	clerkUserId: z.string().min(1),
	email: z.string().email().nullable(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().url().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const sessionBootstrapSchema = z.object({
	user: sessionUserSchema,
	permissions: z.array(permissionSchema),
});

export const sessionBootstrapResponseSchema = z.object({
	success: z.literal(true),
	data: sessionBootstrapSchema,
	meta: z.record(z.string(), z.unknown()).optional(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type SessionBootstrap = z.infer<typeof sessionBootstrapSchema>;
export type SessionBootstrapResponse = z.infer<
	typeof sessionBootstrapResponseSchema
>;
