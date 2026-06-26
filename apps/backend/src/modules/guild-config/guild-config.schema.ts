import { z } from "zod";

export const guildConfigUpsertSchema = z.object({
	guildId: z.string().min(1),
	unverifiedRoleId: z.string().min(1),
	verifiedRoleId: z.string().min(1),
	reviewerRoleId: z.string().min(1),
	verificationChannelId: z.string().min(1),
});
