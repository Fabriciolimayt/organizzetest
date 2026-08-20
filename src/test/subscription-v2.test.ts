import { describe, expect, it } from "vitest";

import {
  capabilitiesForSubscription,
  isSubscriptionCurrent,
  selectPreferredSubscription,
} from "@/lib/finance/capabilities";

const NOW = new Date("2026-08-20T12:00:00Z");
const FUTURE = "2026-09-04T12:00:00Z";
const PAST = "2026-08-01T12:00:00Z";

describe("subscription capabilities", () => {
  it("grants paid capabilities only to trialing and active subscriptions", () => {
    expect(capabilitiesForSubscription(null, NOW)).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
    expect(capabilitiesForSubscription("trialing", NOW)).toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
    expect(capabilitiesForSubscription("active", NOW)).toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
    expect(capabilitiesForSubscription("past_due", NOW)).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
    expect(capabilitiesForSubscription("canceled", NOW).unlimitedPlans).toBe(false);
  });

  it("unlocks capabilities for a running 15 day trial", () => {
    const trial = { status: "trialing" as const, current_period_end: FUTURE };
    expect(isSubscriptionCurrent(trial, NOW)).toBe(true);
    expect(capabilitiesForSubscription(trial, NOW)).toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
  });

  it("blocks capabilities once the trial period has ended", () => {
    const expiredTrial = { status: "trialing" as const, current_period_end: PAST };
    expect(isSubscriptionCurrent(expiredTrial, NOW)).toBe(false);
    expect(capabilitiesForSubscription(expiredTrial, NOW)).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
  });

  it("treats a null current_period_end as lifetime access", () => {
    const lifetime = { status: "active" as const, current_period_end: null };
    expect(isSubscriptionCurrent(lifetime, NOW)).toBe(true);
    expect(capabilitiesForSubscription(lifetime, NOW).whatsapp).toBe(true);
  });

  it("prefers a current subscription over expired or inactive records", () => {
    const expiredTrial = { id: "trial", status: "trialing" as const, current_period_end: PAST };
    const activePaid = { id: "paid", status: "active" as const, current_period_end: FUTURE };
    const lifetime = { id: "lifetime", status: "active" as const, current_period_end: null };
    const canceled = { id: "stripe", status: "canceled" as const, current_period_end: FUTURE };

    expect(selectPreferredSubscription([expiredTrial, activePaid], NOW)).toBe(activePaid);
    expect(selectPreferredSubscription([canceled, lifetime], NOW)).toBe(lifetime);
    expect(selectPreferredSubscription([expiredTrial], NOW)).toBe(expiredTrial);
    expect(selectPreferredSubscription([canceled], NOW)).toBe(canceled);
    expect(selectPreferredSubscription([], NOW)).toBeNull();
  });
});
