import { z } from "zod";

export const guildConfigSchema = z.object({
	guildId: z.string().min(1),
	unverifiedRoleId: z.string().min(1),
	verifiedRoleId: z.string().min(1),
	reviewerRoleId: z.string().min(1),
	verificationChannelId: z.string().min(1),
});

export const updateGuildConfigSchema = guildConfigSchema.partial();

export const guildConfigResponseSchema = z.object({
	success: z.literal(true),
	data: guildConfigSchema,
});

export type GuildConfig = z.infer<typeof guildConfigSchema>;
export type UpdateGuildConfig = z.infer<typeof updateGuildConfigSchema>;
