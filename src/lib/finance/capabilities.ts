import type { Database } from "@/integrations/supabase/types";

export type SubscriptionStatus = Database["app_v2"]["Enums"]["subscription_status"];

export function capabilitiesForSubscription(status: SubscriptionStatus | null | undefined) {
  const paid = status === "trialing" || status === "active";
  return { whatsapp: paid, unlimitedPlans: paid, unlimitedGroups: paid };
}

export function selectPreferredSubscription<T extends { status: SubscriptionStatus }>(subscriptions: T[]): T | null {
  return subscriptions.find(({ status }) => status === "active" || status === "trialing") ?? subscriptions[0] ?? null;
}
