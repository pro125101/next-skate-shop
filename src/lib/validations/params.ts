import * as z from "zod"

export const searchParamsSchema = z.object({
  page: z.string().default("1"),
  per_page: z.string().default("10"),
  sort: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  store: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})
