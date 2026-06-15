import { z } from 'zod'

export const verificationResultSchema = z.object({
  profile: z.object({
    clerkUserId: z.string().min(1),
    discordUserId: z.string().min(1),
    email: z.string().email().nullable(),
    guildId: z.string().min(1),
  }),
  roleGranted: z.boolean(),
})
