import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { capabilitiesForSubscription, selectPreferredSubscription } from "@/lib/finance/capabilities";

const testState = vi.hoisted(() => ({
  checkoutProps: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "person@example.com" }, loading: false }),
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => ({
    data: { locale: "pt-PT", currency: "EUR" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSubscriptionV2", () => ({
  useSubscriptionV2: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/components/PaymentTestModeBanner", () => ({ PaymentTestModeBanner: () => null }));
vi.mock("@/components/StripeEmbeddedCheckout", () => ({
  StripeEmbeddedCheckout: (props: unknown) => {
    testState.checkoutProps(props);
    return null;
  },
}));

import DashboardAssinatura from "@/pages/DashboardAssinatura";

describe("subscription capabilities", () => {
  const now = new Date("2026-08-20T12:00:00.000Z");

  it("grants paid capabilities only to current trialing and active subscriptions", () => {
    expect(capabilitiesForSubscription(null)).toEqual({ whatsapp: false, unlimitedPlans: false, unlimitedGroups: false });
    expect(capabilitiesForSubscription({ status: "trialing", current_period_end: "2026-09-04T12:00:00.000Z" }, now))
      .toEqual({ whatsapp: true, unlimitedPlans: true, unlimitedGroups: true });
    expect(capabilitiesForSubscription({ status: "trialing", current_period_end: "2026-08-20T11:59:59.000Z" }, now).whatsapp)
      .toBe(false);
    expect(capabilitiesForSubscription({ status: "active", current_period_end: null }, now).whatsapp).toBe(true);
    expect(capabilitiesForSubscription({ status: "past_due", current_period_end: null }, now).whatsapp).toBe(false);
  });

  it("keeps a lifetime entitlement ahead of newer inactive billing records", () => {
    const lifetime = { id: "lifetime", provider: "complimentary", status: "active" as const, current_period_end: null };
    const canceled = { id: "stripe", provider: "stripe", status: "canceled" as const, current_period_end: "2026-09-01T00:00:00Z" };

    expect(selectPreferredSubscription([canceled, lifetime], now)).toBe(lifetime);
    expect(selectPreferredSubscription([canceled], now)).toBe(canceled);
    expect(selectPreferredSubscription([])).toBeNull();
  });

  it("does not prefer an expired trial over a current entitlement", () => {
    const expiredTrial = { id: "trial", status: "trialing" as const, current_period_end: "2026-08-20T11:59:59.000Z" };
    const active = { id: "paid", status: "active" as const, current_period_end: "2026-09-20T12:00:00.000Z" };

    expect(selectPreferredSubscription([expiredTrial, active], now)).toBe(active);
  });
});

const subscriptionSource = readFileSync(
  resolve(process.cwd(), "src/pages/DashboardAssinatura.tsx"),
  "utf8",
);
const checkoutSource = readFileSync(
  resolve(process.cwd(), "src/components/StripeEmbeddedCheckout.tsx"),
  "utf8",
);
const bannerSource = readFileSync(
  resolve(process.cwd(), "src/components/PaymentTestModeBanner.tsx"),
  "utf8",
);

describe("DashboardAssinatura rendered checkout behavior", () => {
  beforeEach(() => {
    testState.checkoutProps.mockReset();
  });

  afterEach(() => cleanup());

  const renderSubscription = () => render(
    createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      createElement(DashboardAssinatura),
    ),
  );

  it("opens the real checkout control as an accessible modal and restores focus on Escape", async () => {
    renderSubscription();
    const trigger = screen.getByRole("button", { name: "Assinar Pro" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Finalizar subscrição com Stripe" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    expect(testState.checkoutProps).toHaveBeenCalledWith({
      priceId: "pro_monthly_eur",
      userId: "user-1",
      customerEmail: "person@example.com",
      returnUrl: `${window.location.origin}/dashboard/assinatura?session_id={CHECKOUT_SESSION_ID}`,
    });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes through the accessible close button and restores focus to its trigger", async () => {
    renderSubscription();
    const trigger = screen.getByRole("button", { name: "Assinar Premium Elite" });
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Finalizar subscrição com Stripe" });

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe("DashboardAssinatura functional preservation", () => {
  it("uses capabilitiesForSubscription and PaymentTestModeBanner", () => {
    expect(subscriptionSource).toContain("capabilitiesForSubscription");
    expect(subscriptionSource).toContain("PaymentTestModeBanner");
  });

  it("renders Stripe embedded checkout", () => {
    expect(subscriptionSource).toContain("StripeEmbeddedCheckout");
    expect(subscriptionSource).toContain("checkoutPriceId");
    expect(subscriptionSource).toContain("onClick={() => setCheckoutPriceId(priceId)}");
    expect(subscriptionSource).toContain("if (!open) setCheckoutPriceId(null)");
    expect(subscriptionSource).toContain("priceId={checkoutPriceId}");
    expect(subscriptionSource).toContain("userId={user?.id}");
    expect(subscriptionSource).toContain("customerEmail={user?.email ?? undefined}");
    expect(subscriptionSource).toContain("returnUrl={returnUrl}");
  });

  it("keeps the checkout Edge Function name and payload", () => {
    expect(checkoutSource).toContain('supabase.functions.invoke("create-checkout"');
    expect(checkoutSource).toContain("body: { priceId, quantity, customerEmail, userId, returnUrl, environment: getStripeEnvironment() }");
    expect(checkoutSource).toContain("options={{ fetchClientSecret }}");
  });

  it("preserves missing-token, test-mode, and live banner behavior", () => {
    expect(bannerSource).toContain("if (!clientToken)");
    expect(bannerSource).toContain('clientToken.startsWith("pk_test_")');
    expect(bannerSource).toContain("return null");
  });
});
