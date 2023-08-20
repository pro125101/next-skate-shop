import * as z from "zod"

export const manageSubscriptionSchema = z.object({
  stripePriceId: z.string(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
  isSubscribed: z.boolean(),
  isCurrentPlan: z.boolean(),
})

export const createAccountLinkSchema = z.object({
  storeId: z.number(),
})
