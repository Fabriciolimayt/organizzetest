import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, Fragment, type ComponentType } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: testState.getUser } },
}));

vi.mock("@/integrations/supabase/v2", () => ({
  supabaseV2: { from: testState.from, rpc: testState.rpc },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: testState.toast,
  useToast: () => ({ toasts: [], toast: testState.toast, dismiss: vi.fn() }),
}));

import AutomationDiagram from "@/components/onboarding/AutomationDiagram";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastViewport } from "@/components/ui/toast";
import OnboardingIdioma from "@/pages/OnboardingIdioma";
import OnboardingMoeda from "@/pages/OnboardingMoeda";
import OnboardingNome from "@/pages/OnboardingNome";
import OnboardingWhatsApp from "@/pages/OnboardingWhatsApp";
import OnboardingWhatsAppVerificar from "@/pages/OnboardingWhatsAppVerificar";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const LocationProbe = () => {
  const location = useLocation();
  return createElement("output", { "data-testid": "location" }, `${location.pathname}${location.search}`);
};

const renderPage = (Page: ComponentType, initialPath: string) => render(
  createElement(
    MemoryRouter,
    {
      initialEntries: [initialPath],
      future: { v7_startTransition: true, v7_relativeSplatPath: true },
    },
    createElement(Fragment, null, createElement(Page), createElement(LocationProbe)),
  ),
);

const setTableResults = ({
  memberships = [{ space_id: "space-owner", role: "owner" }],
  connection = null as null | { status: string; verified_at: string },
  connectionError = null as Error | null,
} = {}) => {
  testState.maybeSingle.mockResolvedValue({ data: connection, error: connectionError });
  testState.from.mockImplementation((table: string) => {
    if (table === "space_members") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: memberships, error: null }),
        })),
      };
    }

    if (table === "whatsapp_connections") {
      const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: testState.maybeSingle };
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      return chain;
    }

    throw new Error(`Unexpected table: ${table}`);
  });
};

const verification = {
  code: "moedas-verify-8F42C7A1",
  phone: "+351912345678",
  instanceName: "organizze-space-owner",
  expiresAt: "2099-01-01T00:00:00.000Z",
  spaceId: "space-owner",
  countryCode: "PT",
  countryName: "Portugal",
  ddi: "+351",
  status: "pending",
};

describe("Invisible Ledger onboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    testState.getUser.mockReset();
    testState.from.mockReset();
    testState.rpc.mockReset();
    testState.maybeSingle.mockReset();
    testState.toast.mockReset();
    testState.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    testState.rpc.mockResolvedValue({ data: null, error: null });
    setTableResults();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps routes and presents automation rather than chat", () => {
    expect(read("src/pages/OnboardingNome.tsx")).toContain('/onboarding/idioma');
    expect(read("src/pages/OnboardingIdioma.tsx")).toContain('/onboarding/moeda');
    expect(read("src/pages/OnboardingMoeda.tsx")).toContain('/onboarding/whatsapp');
    const whatsapp = read("src/pages/OnboardingWhatsApp.tsx");
    expect(whatsapp).toContain('/onboarding/whatsapp/verificar');
    expect(whatsapp).toContain("AutomationDiagram");
    expect(whatsapp).not.toContain("chat-bubble");
  });

  it("renders three semantic automation stages with optional labels", () => {
    render(createElement(AutomationDiagram, { sourceLabel: "Recibo recebido", resultLabel: "Agosto organizado" }));
    expect(screen.getByRole("heading", { name: "Como uma despesa é organizada" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Organizze")).toBeInTheDocument();
    expect(screen.getByText("Categorizado")).toBeInTheDocument();
    expect(screen.getByText("Recibo recebido")).toBeInTheDocument();
    expect(screen.getByText("Agosto organizado")).toBeInTheDocument();
  });

  it("stores the entered name and continues to language", () => {
    renderPage(OnboardingNome, "/onboarding/nome");
    fireEvent.change(screen.getByLabelText("O teu nome"), { target: { value: "  Ana Maria  " } });
    expect(screen.getByText("Usaremos o nome introduzido nas mensagens da app.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(localStorage.getItem("organizze.name")).toBe("Ana Maria");
    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/idioma");
  });

  it("stores the selected language and continues to currency", () => {
    renderPage(OnboardingIdioma, "/onboarding/idioma");
    fireEvent.click(screen.getByRole("button", { name: /English/ }));
    expect(screen.getByRole("button", { name: /English/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(localStorage.getItem("organizze.locale")).toBe("en");
    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/moeda");
  });

  it("stores the selected currency and continues to WhatsApp", () => {
    renderPage(OnboardingMoeda, "/onboarding/moeda");
    fireEvent.click(screen.getByRole("button", { name: /USD Dólar/ }));
    expect(screen.getByRole("button", { name: /USD Dólar/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(localStorage.getItem("organizze.currency")).toBe("USD");
    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/whatsapp");
  });

  it("describes an invalid phone using the selected country's existing minimum", () => {
    renderPage(OnboardingWhatsApp, "/onboarding/whatsapp");
    const phone = screen.getByLabelText("Número de WhatsApp");
    fireEvent.change(phone, { target: { value: "912" } });
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      "Introduz o número nacional, sem repetir o indicativo. O número de Portugal precisa de pelo menos 9 dígitos.",
    );
    expect(screen.getByText("O número de Portugal precisa de pelo menos 9 dígitos.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Verificar com WhatsApp" })).toBeDisabled();
  });

  it("creates the exact WhatsApp link payload, stores verification, and continues", async () => {
    testState.rpc.mockResolvedValue({
      data: [{ code: "moedas-verify-8F42C7A1", instance_name: "organizze-space-owner", expires_at: "2026-08-23T12:30:00.000Z" }],
      error: null,
    });
    renderPage(OnboardingWhatsApp, "/onboarding/whatsapp");
    fireEvent.change(screen.getByLabelText("Número de WhatsApp"), { target: { value: "912 345 678" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar com WhatsApp" }));

    await waitFor(() => expect(testState.rpc).toHaveBeenCalledWith(
      "create_whatsapp_link",
      { phone_e164: "+351912345678", space_id: "space-owner" },
    ));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/whatsapp/verificar"));
    expect(JSON.parse(localStorage.getItem("organizze.waVerification") || "null")).toEqual({
      code: "moedas-verify-8F42C7A1",
      phone: "+351912345678",
      instanceName: "organizze-space-owner",
      expiresAt: "2026-08-23T12:30:00.000Z",
      spaceId: "space-owner",
      countryCode: "PT",
      countryName: "Portugal",
      ddi: "+351",
      status: "pending",
    });
  });

  it("keeps the optional WhatsApp skip destination", () => {
    renderPage(OnboardingWhatsApp, "/onboarding/whatsapp");
    fireEvent.click(screen.getByRole("button", { name: "Saltar por agora" }));
    expect(testState.rpc).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard?tour=1");
  });

  it("redirects missing verification state back to WhatsApp", async () => {
    renderPage(OnboardingWhatsAppVerificar, "/onboarding/whatsapp/verificar");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/whatsapp"));
    expect(testState.from).not.toHaveBeenCalled();
  });

  it("renders expiration and keeps the reconnect destination", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T12:00:00.000Z"));
    localStorage.setItem("organizze.waVerification", JSON.stringify({ ...verification, expiresAt: "2026-08-23T11:59:59.000Z" }));
    renderPage(OnboardingWhatsAppVerificar, "/onboarding/whatsapp/verificar");
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("alert")).toHaveTextContent("Este código expirou");
    expect(screen.getByRole("button", { name: "Abrir WhatsApp com o código" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar ligação" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/whatsapp");
  });

  it("polls every 3000ms and clears the exact interval on unmount", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T12:00:00.000Z"));
    localStorage.setItem("organizze.waVerification", JSON.stringify(verification));
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const view = renderPage(OnboardingWhatsAppVerificar, "/onboarding/whatsapp/verificar");
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/À espera da tua mensagem/).closest('[role="status"]')).toBeInTheDocument();
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    const intervalId = intervalSpy.mock.results[0].value;
    view.unmount();
    expect(clearSpy).toHaveBeenCalledWith(intervalId);
  });

  it("writes verification results before the 600ms dashboard redirect", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T12:00:00.000Z"));
    localStorage.setItem("organizze.waVerification", JSON.stringify(verification));
    localStorage.setItem("organizze.tourCompleted", "1");
    setTableResults({ connection: { status: "active", verified_at: "2026-08-23T12:00:03.000Z" } });
    renderPage(OnboardingWhatsAppVerificar, "/onboarding/whatsapp/verificar");

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(testState.rpc).toHaveBeenCalledWith("update_whatsapp_preferences", {
      space_id: "space-owner",
      monthly_report_opt_in: true,
      preferences: { day: 25, timezone: "Europe/Lisbon" },
    });
    expect(JSON.parse(localStorage.getItem("organizze.whatsapp") || "null")).toEqual({
      phone: "+351912345678",
      ddi: "+351",
      countryCode: "PT",
      countryName: "Portugal",
      spaceId: "space-owner",
      instanceName: "organizze-space-owner",
      status: "verified",
      verifiedAt: "2026-08-23T12:00:03.000Z",
    });
    expect(localStorage.getItem("organizze.firstRun")).toBe("1");
    expect(localStorage.getItem("organizze.tourCompleted")).toBeNull();
    expect(localStorage.getItem("organizze.waVerification")).toBeNull();
    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/whatsapp/verificar");
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("cancels the pending dashboard redirect when verification unmounts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T12:00:00.000Z"));
    localStorage.setItem("organizze.waVerification", JSON.stringify(verification));
    setTableResults({ connection: { status: "active", verified_at: "2026-08-23T12:00:03.000Z" } });
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const view = renderPage(OnboardingWhatsAppVerificar, "/onboarding/whatsapp/verificar");

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const redirectIndex = timeoutSpy.mock.calls.findIndex(([, delay]) => delay === 600);
    expect(redirectIndex).toBeGreaterThanOrEqual(0);
    const redirectId = timeoutSpy.mock.results[redirectIndex].value;

    view.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(redirectId);
  });

  it("uses the approved 12px label token across Task 7 surfaces", () => {
    const sources = [
      "src/components/onboarding/AutomationDiagram.tsx",
      "src/components/onboarding/OnboardingWizardLayout.tsx",
      "src/pages/OnboardingNome.tsx",
      "src/pages/OnboardingWhatsApp.tsx",
      "src/pages/OnboardingWhatsAppVerificar.tsx",
    ].map(read);
    sources.forEach((source) => {
      expect(source).not.toContain("text-[10px]");
      expect(source).toContain("text-label");
    });
  });

  it("reserves the full onboarding toast close target beside wrapping content", () => {
    render(createElement(
      ToastProvider,
      null,
      createElement(
        Toast,
        { open: true },
        createElement(
          ToastDescription,
          null,
          "Não foi possível confirmar a ligação ao WhatsApp. Tenta novamente dentro de alguns instantes.",
        ),
        createElement(ToastClose, { "aria-label": "Fechar aviso" }),
      ),
      createElement(ToastViewport),
    ));
    expect(screen.getByText(/Não foi possível confirmar/).closest("li")).toHaveClass("pr-12");
    expect(screen.getByRole("button", { name: "Fechar aviso" })).toHaveClass("size-11");
  });
});
