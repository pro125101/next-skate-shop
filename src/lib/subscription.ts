import { type SubscriptionPlan } from "@/types"
import { clerkClient } from "@clerk/nextjs"
import dayjs from "dayjs"

import { storeSubscriptionPlans } from "@/config/subscriptions"
import { stripe } from "@/lib/stripe"
import { userPrivateMetadataSchema } from "@/lib/validations/auth"

export async function getUserSubscriptionPlan(userId: string) {
  const user = await clerkClient.users.getUser(userId)

  if (!user) {
    throw new Error("User not found.")
  }

  const userPrivateMetadata = userPrivateMetadataSchema.parse(
    user.privateMetadata
  )

  // Check if user is subscribed
  const isSubscribed =
    !!userPrivateMetadata.stripePriceId &&
    dayjs(userPrivateMetadata.stripeCurrentPeriodEnd).valueOf() + 86_400_000 >
      Date.now()

  const plan = isSubscribed
    ? storeSubscriptionPlans.find(
        (plan) => plan.stripePriceId === userPrivateMetadata.stripePriceId
      )
    : storeSubscriptionPlans[0]

  // Check if user has canceled subscription
  let isCanceled = false
  if (isSubscribed && !!userPrivateMetadata.stripeSubscriptionId) {
    try {
      const stripePlan = await stripe.subscriptions.retrieve(
        userPrivateMetadata.stripeSubscriptionId
      )
      isCanceled = stripePlan.cancel_at_period_end
    } catch (err) {
      console.error(err)
      // TODO: Find a better way to reset user privateMetadata
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          stripePriceId: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeCurrentPeriodEnd: null,
        },
      })
      return null
    }
  }

  return {
    ...plan,
    stripeSubscriptionId: userPrivateMetadata.stripeSubscriptionId,
    stripeCurrentPeriodEnd: userPrivateMetadata.stripeCurrentPeriodEnd,
    stripeCustomerId: userPrivateMetadata.stripeCustomerId,
    isSubscribed,
    isCanceled,
  }
}

export function getFeaturedStoreAndProductCounts(
  planId?: SubscriptionPlan["id"]
) {
  const plan = storeSubscriptionPlans.find((plan) => plan.id === planId)
  const features = plan?.features.map((feature) => feature.split(",")).flat()

  const featuredStoreCount =
    features?.find((feature) => feature.match(/store/i))?.match(/\d+/) ?? 0

  const featuredProductCount =
    features?.find((feature) => feature.match(/product/i))?.match(/\d+/) ?? 0

  return {
    featuredStoreCount,
    featuredProductCount,
  }
}

export function getDashboardRedirectPath(input: {
  storeCount: number
  subscriptionPlan?: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}): string {
  const { storeCount, subscriptionPlan } = input
  const isSubscriptionPlanActive = dayjs(
    subscriptionPlan?.stripeCurrentPeriodEnd
  ).isAfter(dayjs())

  const minStoresWithProductCount = {
    basic: 1,
    standard: 2,
    pro: 3,
  }[subscriptionPlan?.id ?? "basic"]

  return isSubscriptionPlanActive && storeCount >= minStoresWithProductCount
    ? "/dashboard/billing"
    : "/dashboard/stores/new"
}
