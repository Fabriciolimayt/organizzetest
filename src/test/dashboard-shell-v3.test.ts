import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createElement, Fragment } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  signOut: vi.fn(),
  toast: vi.fn(),
  auth: { user: { id: "user-1", email: "trial@organizze.test" } },
  financial: {
    data: {
      spaceId: "space-1",
      spaces: [{ id: "space-1", name: "Casa" }],
    },
    isLoading: false,
  },
  subscription: {
    data: {
      id: "subscription-1",
      status: "trialing",
      current_period_end: "2099-09-30T00:00:00.000Z",
    },
    isLoading: false,
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => testState.auth,
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => testState.financial,
}));

vi.mock("@/hooks/useSubscriptionV2", () => ({
  useSubscriptionV2: () => testState.subscription,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: testState.toast }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: testState.signOut } },
}));

vi.mock("@/components/ui/tooltip", async () => {
  const { Fragment, createElement } = await import("react");
  const PassThrough = ({ children }: { children?: React.ReactNode }) => createElement(Fragment, null, children);
  return {
    Tooltip: PassThrough,
    TooltipContent: () => null,
    TooltipProvider: PassThrough,
    TooltipTrigger: PassThrough,
  };
});

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { TooltipProvider } from "@/components/ui/tooltip";

const readSource = (path: string) => {
  const absolutePath = resolve(process.cwd(), path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
};

const source = [
  readSource("src/components/dashboard/DashboardNav.tsx"),
  readSource("src/components/dashboard/DashboardLayout.tsx"),
].join("\n");
const layoutSource = readSource("src/components/dashboard/DashboardLayout.tsx");
const navSource = readSource("src/components/dashboard/DashboardNav.tsx");

const LocationProbe = () => {
  const location = useLocation();
  return createElement("output", { "data-testid": "location" }, location.pathname);
};

const OutletProbe = () => {
  const location = useLocation();
  return createElement("p", { "data-testid": "outlet" }, `Outlet: ${location.pathname}`);
};

const renderShell = (initialPath = "/dashboard") => render(
  createElement(
    TooltipProvider,
    {
      delayDuration: 0,
      children: createElement(
        MemoryRouter,
        {
          initialEntries: [initialPath],
          future: { v7_startTransition: true, v7_relativeSplatPath: true },
        },
        createElement(
          Fragment,
          null,
          createElement(
            Routes,
            null,
            createElement(
              Route,
              { path: "/dashboard", element: createElement(DashboardLayout) },
              createElement(Route, { index: true, element: createElement(OutletProbe) }),
              createElement(Route, { path: "*", element: createElement(OutletProbe) }),
            ),
          ),
          createElement(LocationProbe),
        ),
      ),
    },
  ),
);

const openCompactAccountMenu = async () => {
  const trigger = screen.getByRole("button", { name: "Abrir menu da conta" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
  return screen.findByRole("menu");
};

describe("dashboard shell v3", () => {
  beforeEach(() => {
    testState.signOut.mockReset();
    testState.signOut.mockResolvedValue({ error: null });
    testState.toast.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("groups desktop navigation and limits mobile primary navigation to five destinations", () => {
    expect(source).toContain('label: "Acompanhar"');
    expect(source).toContain('label: "Planear"');
    expect(source).toContain('label: "Partilhar e automatizar"');
    expect(source).toContain("mobilePrimaryLinks");
    expect(source).toContain('aria-label="Navegação principal"');
    expect(source).toContain('aria-label="Navegação móvel"');
  });

  it("keeps all destinations inside the dark functional shell", () => {
    expect(source).toContain("bg-sidebar");
    expect(source).toContain("Navegação principal");
    expect(source).toContain("Navegação móvel");
    expect(source).toContain("Abrir menu da conta");
    expect(source).toContain("restartTour");
  });

  it("keeps a compact desktop rail and a single content scroll owner", () => {
    expect(layoutSource).toContain("lg:grid-cols-[228px_minmax(0,1fr)]");
    expect(layoutSource).toContain('data-scroll-owner="dashboard-content"');
    expect(layoutSource).toContain('className="min-h-0 min-w-0 overflow-y-auto overscroll-contain"');
    expect(layoutSource).toContain("grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden");
    expect(layoutSource).toContain("min-h-0 min-w-0 flex-1 overflow-y-auto px-3");
    expect(source).not.toContain("text-sidebar-foreground/40");
  });

  it("restores drawer focus and keeps its mobile account link touchable", () => {
    expect(layoutSource).toContain("onCloseAutoFocus");
    expect(layoutSource).toContain("navigationTriggerRef.current?.focus()");
    expect(layoutSource).toContain('className="inline-flex min-h-11 items-center text-xs text-marker hover:underline"');
  });

  it("keeps the five-item mobile navigation and routes Registos to lançamentos", () => {
    const mobileLinks = navSource.slice(
      navSource.indexOf("export const mobilePrimaryLinks"),
      navSource.indexOf("type DashboardNavProps"),
    );

    expect(mobileLinks.match(/primaryNavGroups|label: "Menu"/g)).toHaveLength(5);
    expect(mobileLinks).toContain('{ ...primaryNavGroups[0].links[1], label: "Registos" }');
    expect(navSource).toContain('{ to: "/dashboard/lancamentos", label: "Lançamentos"');
  });

  it("renders the Outlet, trial state, and exactly five working mobile destinations", () => {
    renderShell();

    expect(screen.getByTestId("outlet")).toHaveTextContent("Outlet: /dashboard");
    expect(screen.getByText("Período experimental")).toBeInTheDocument();

    const mobileNav = screen.getByRole("navigation", { name: "Navegação móvel" });
    expect(within(mobileNav).getAllByRole("link")).toHaveLength(4);
    expect(within(mobileNav).getAllByRole("button")).toHaveLength(1);

    fireEvent.click(within(mobileNav).getByRole("link", { name: "Registos" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/lancamentos");
    expect(screen.getByTestId("outlet")).toHaveTextContent("Outlet: /dashboard/lancamentos");
  });

  it("keeps desktop navigation destinations at the 44px target minimum", () => {
    renderShell();

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(desktopNav).getByRole("link", { name: "Visão geral" })).toHaveClass("min-h-11");
  });

  it("navigates from the drawer and closes it after route selection", async () => {
    renderShell();
    const menuButton = within(screen.getByRole("navigation", { name: "Navegação móvel" }))
      .getByRole("button", { name: "Abrir menu" });

    menuButton.focus();
    fireEvent.click(menuButton);
    const drawer = await screen.findByRole("dialog");
    fireEvent.click(within(drawer).getByRole("link", { name: "Planos" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/planos");
    expect(screen.getByTestId("outlet")).toHaveTextContent("Outlet: /dashboard/planos");
  });

  it("closes the drawer with Escape and restores focus to its opener", async () => {
    renderShell();
    const menuButton = within(screen.getByRole("navigation", { name: "Navegação móvel" }))
      .getByRole("button", { name: "Abrir menu" });

    menuButton.focus();
    fireEvent.click(menuButton);
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());
  });

  it("keeps both account destinations wired through the rendered menu", async () => {
    renderShell();

    let menu = await openCompactAccountMenu();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Gerir assinatura" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/assinatura");

    menu = await openCompactAccountMenu();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Diagnóstico WhatsApp" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/diagnostico-whatsapp");
  });

  it("dispatches restartTour and displays the current trial label in the account menu", async () => {
    const restartListener = vi.fn();
    window.addEventListener("organizze:start-tour", restartListener);
    renderShell();

    const menu = await openCompactAccountMenu();
    expect(within(menu).getByText("Período experimental")).toBeInTheDocument();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Reiniciar tutorial" }));

    expect(restartListener).toHaveBeenCalledTimes(1);
    window.removeEventListener("organizze:start-tour", restartListener);
  });

  it("signs out locally and preserves destructive error recovery", async () => {
    const signOutError = new Error("network unavailable");
    testState.signOut.mockResolvedValue({ error: signOutError });
    renderShell();

    const menu = await openCompactAccountMenu();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Terminar sessão" }));

    await waitFor(() => expect(testState.signOut).toHaveBeenCalledWith({ scope: "local" }));
    expect(testState.toast).toHaveBeenCalledWith({
      title: "Não foi possível terminar a sessão",
      description: "Tenta novamente dentro de alguns instantes.",
      variant: "destructive",
    });
  });

  it("drives MonthSelector handlers and enforces both disabled branches", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const view = render(createElement(MonthSelector, { month: "Agosto 2026", onPrevious, onNext }));

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Mês seguinte" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    view.rerender(createElement(MonthSelector, { month: "Agosto 2026", onNext, disableNext: true }));
    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mês seguinte" })).toBeDisabled();
  });
});
