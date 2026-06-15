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

export const verificationResultSchema = z.object({
  profile: verificationProfileSchema,
  roleGranted: z.boolean(),
});

export type CompleteVerificationRequest = z.infer<typeof completeVerificationRequestSchema>;
export type VerificationProfile = z.infer<typeof verificationProfileSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
