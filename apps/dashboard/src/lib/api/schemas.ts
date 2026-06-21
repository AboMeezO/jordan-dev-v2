import { z } from 'zod'

export const apiErrorSchema = z.object({
  code: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  message: z.string(),
})

export const emptyResponseSchema = z.undefined()
