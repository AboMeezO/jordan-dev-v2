import { z } from "zod";

export const completeVerificationRequestSchema = z.object({
	discordUserId: z.string().min(1),
	guildId: z.string().min(1),
});

export const verificationProfileSchema = z.object({
	clerkUserId: z.string().min(1),
	discordUserId: z.string().min(1),
	email: z.string().email().nullable(),
	guildId: z.string().min(1),
});

export const verificationStatusSchema = z.enum([
	"PENDING",
	"VERIFIED",
	"FAILED",
	"ROLE_GRANT_PENDING",
	"ROLE_GRANT_FAILED",
]);

export const roleGrantStatusSchema = z.enum([
	"PENDING",
	"COMPLETED",
	"FAILED",
]);

export const verificationResultSchema = z.object({
	profile: verificationProfileSchema,
	status: verificationStatusSchema,
	roleGranted: z.boolean(),
	roleGrantPending: z.boolean(),
	roleGrantJobId: z.string().min(1).nullable(),
});

export type CompleteVerificationRequest = z.infer<
	typeof completeVerificationRequestSchema
>;
export type VerificationProfile = z.infer<
	typeof verificationProfileSchema
>;
export type VerificationResult = z.infer<
	typeof verificationResultSchema
>;
export type VerificationStatus = z.infer<
	typeof verificationStatusSchema
>;
export type RoleGrantStatus = z.infer<
	typeof roleGrantStatusSchema
>;
