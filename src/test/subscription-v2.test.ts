import { describe, expect, it } from "vitest";

import { capabilitiesForSubscription, selectPreferredSubscription } from "@/lib/finance/capabilities";

describe("subscription capabilities", () => {
  it("grants paid capabilities only to trialing and active subscriptions", () => {
    expect(capabilitiesForSubscription(null)).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
    expect(capabilitiesForSubscription("trialing")).toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
    expect(capabilitiesForSubscription("active")).toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
    expect(capabilitiesForSubscription("past_due")).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
    expect(capabilitiesForSubscription("canceled").unlimitedPlans).toBe(false);
  });

  it("keeps a lifetime entitlement ahead of newer inactive billing records", () => {
    const lifetime = { id: "lifetime", provider: "complimentary", status: "active" as const, current_period_end: null };
    const canceled = { id: "stripe", provider: "stripe", status: "canceled" as const, current_period_end: "2026-09-01T00:00:00Z" };

    expect(selectPreferredSubscription([canceled, lifetime])).toBe(lifetime);
    expect(selectPreferredSubscription([canceled])).toBe(canceled);
    expect(selectPreferredSubscription([])).toBeNull();
  });
});
