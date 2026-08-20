import type { Database } from "@/integrations/supabase/types";

export type SubscriptionStatus = Database["app_v2"]["Enums"]["subscription_status"];

export type SubscriptionLike = {
  status: SubscriptionStatus | null | undefined;
  current_period_end?: string | null;
};

const PAID_STATUSES: SubscriptionStatus[] = ["trialing", "active"];

export function isSubscriptionCurrent(
  subscription: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription?.status) return false;
  if (!PAID_STATUSES.includes(subscription.status)) return false;
  const end = subscription.current_period_end;
  if (!end) return true;
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return false;
  return endDate.getTime() > now.getTime();
}

export function capabilitiesForSubscription(
  subscription: SubscriptionStatus | SubscriptionLike | null | undefined,
  now: Date = new Date(),
) {
  const normalized: SubscriptionLike | null =
    typeof subscription === "string" ? { status: subscription } : subscription ?? null;
  const paid = isSubscriptionCurrent(normalized, now);
  return { whatsapp: paid, unlimitedPlans: paid, unlimitedGroups: paid };
}

export function selectPreferredSubscription<T extends SubscriptionLike>(
  subscriptions: T[],
  now: Date = new Date(),
): T | null {
  return subscriptions.find((subscription) => isSubscriptionCurrent(subscription, now)) ?? subscriptions[0] ?? null;
}
