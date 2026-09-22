import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageValues = new Map<string, string>();
const localStorageMock: Storage = {
  clear: () => storageValues.clear(),
  getItem: (key) => storageValues.get(key) ?? null,
  key: (index) => Array.from(storageValues.keys())[index] ?? null,
  removeItem: (key) => storageValues.delete(key),
  setItem: (key, value) => storageValues.set(key, String(value)),
  get length() { return storageValues.size; },
};
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorageMock });

const testState = vi.hoisted(() => {
  const transactionInsert = vi.fn();
  const connectionQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: "connection-1", status: "active" }, error: null }),
  };
  connectionQuery.select.mockReturnValue(connectionQuery);
  connectionQuery.eq.mockReturnValue(connectionQuery);

  return {
    connectionQuery,
    transactionInsert,
    from: vi.fn((table: string) => {
      if (table === "whatsapp_connections") return connectionQuery;
      return { insert: transactionInsert };
    }),
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => ({
    data: {
      canWrite: true,
      userId: "user-1",
      spaceId: "space-1",
      currency: "EUR",
      categories: [{ id: "category-general", name: "Geral", transaction_type: "expense" }],
    },
  }),
}));

vi.mock("@/hooks/useSubscriptionV2", () => ({
  useSubscriptionV2: () => ({
    data: { status: "active", current_period_end: "2099-01-01T00:00:00.000Z" },
    isLoading: false,
  }),
}));

vi.mock("@/integrations/supabase/v2", () => ({
  supabaseV2: { from: testState.from },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock("@/lib/whatsapp", () => ({ fileToCompressedBase64: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import DashboardWhatsApp from "@/pages/DashboardWhatsApp";

const source = readFileSync(
  resolve(process.cwd(), "src/pages/DashboardWhatsApp.tsx"),
  "utf8",
);
const diagnosticSource = readFileSync(
  resolve(process.cwd(), "src/pages/DashboardDiagnosticoWhatsApp.tsx"),
  "utf8",
);

const renderWhatsApp = () => render(
  createElement(
    MemoryRouter,
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
    createElement(DashboardWhatsApp),
  ),
);

describe("DashboardWhatsApp rendered behavior", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("organizze.whatsapp", JSON.stringify({ verified: true }));
    testState.connectionQuery.select.mockReset().mockReturnValue(testState.connectionQuery);
    testState.connectionQuery.eq.mockReset().mockReturnValue(testState.connectionQuery);
    testState.connectionQuery.maybeSingle.mockReset().mockResolvedValue({
      data: { id: "connection-1", status: "active" },
      error: null,
    });
    testState.from.mockReset().mockImplementation((table: string) => {
      if (table === "whatsapp_connections") return testState.connectionQuery;
      return { insert: testState.transactionInsert };
    });
    testState.transactionInsert.mockReset();
    testState.transactionInsert.mockResolvedValue({ error: null });
    scrollIntoView.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the diagnostic feed and records a manual composer expense", async () => {
    renderWhatsApp();

    expect(await screen.findByRole("heading", { name: "Registo de teste" })).toBeInTheDocument();
    const composer = screen.getByPlaceholderText('Ex.: "Gastei 12€ no almoço"');
    fireEvent.change(composer, { target: { value: "Almoço 12€" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar despesa" }));

    expect(await screen.findByText("1 item registado")).toBeInTheDocument();
    expect(screen.getByText("Almoço")).toBeInTheDocument();
    expect(composer).toHaveValue("");
    expect(testState.transactionInsert).toHaveBeenCalledWith(expect.objectContaining({
      amount: 12,
      description: "Almoço",
      source: "app",
      created_by: "user-1",
    }));
  });

  it("auto-follows appended history smoothly when reduced motion is not requested", async () => {
    renderWhatsApp();
    expect(document.querySelector("[data-whatsapp-history-end]")).toBeInstanceOf(HTMLElement);
    scrollIntoView.mockClear();

    fireEvent.change(screen.getByPlaceholderText('Ex.: "Gastei 12€ no almoço"'), { target: { value: "Cafe 3€" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar despesa" }));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "end", behavior: "smooth" }));
  });

  it("auto-follows appended history without smooth motion when reduced motion is requested", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    renderWhatsApp();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "end", behavior: "auto" }));
  });
});

describe("DashboardWhatsApp app_v2 contract", () => {
  it("keeps the processed-result dashboard action at the practical touch target", () => {
    expect(source).toContain('to="/dashboard" className="inline-flex min-h-11');
  });

  it("never writes financial data through the legacy store", () => {
    expect(source).not.toContain("addExpenses");
    expect(source).not.toContain("ExpenseEntry");
    expect(source).not.toContain("organizze.expenses");
  });

  it("writes simulator expenses exclusively to app_v2 transactions", () => {
    expect(source).toContain('import { supabaseV2 } from "@/integrations/supabase/v2"');
    expect(source).toContain('supabaseV2.from("transactions").insert');
    expect(source).toContain('source: "app"');
    expect(source).toContain('transaction_type: "expense"');
    expect(source).toContain('status: "cleared"');
  });

  it("uses the globally selected writable space and reads summaries from V2", () => {
    expect(source).toContain("useFinancialContext()");
    expect(source).toContain("context?.canWrite");
    expect(source).toContain("spaceId: context.spaceId");
    expect(source).toContain('category.transaction_type === "expense"');
    expect(source).toContain('supabaseV2.from("transactions")');
    expect(source).toMatch(/supabaseV2\s*\n?\s*\.from\("whatsapp_connections"\)/);
  });
});

describe("DashboardDiagnosticoWhatsApp functional preservation", () => {
  it("keeps the original polling and diagnostic Edge Function methods", () => {
    expect(diagnosticSource).toContain('supabase.functions.invoke("whatsapp-diagnostico", { method: "GET" })');
    expect(diagnosticSource).toContain('supabase.functions.invoke("whatsapp-diagnostico", { method: "POST" })');
    expect(diagnosticSource).toContain("setInterval(load, 5000)");
    expect(diagnosticSource).toContain("return () => clearInterval(id)");
  });

  it("keeps refresh and test callbacks wired to their original handlers", () => {
    expect(diagnosticSource).toContain("onClick={load}");
    expect(diagnosticSource).toContain("onClick={sendTest}");
  });
});

describe("DashboardWhatsApp functional preservation", () => {
  it("reads connection status exclusively through supabaseV2", () => {
    expect(source).toMatch(/supabaseV2\s*\n?\s*\.from\("whatsapp_connections"\)/);
    expect(source).toContain('.eq("linked_user_id", user.id)');
    expect(source).toContain('.eq("status", "active")');
  });

  it("posts expenses with source:app through supabaseV2 only", () => {
    expect(source).toContain('source: "app"');
    expect(source).toContain('supabaseV2.from("transactions").insert');
    expect(source).toContain("created_by: ctx.userId");
    expect(source).toContain("currency: ctx.currency");
    expect(source).toContain("occurred_at: validOccurredAt(occurredAt)");
    expect(source).toContain('transaction_type: "expense"');
    expect(source).toContain('status: "cleared"');
  });

  it("keeps receipt analysis on process-receipt-v2 with its original payload", () => {
    expect(source).toContain('supabase.functions.invoke("process-receipt-v2"');
    expect(source).toContain("image_base64: base64");
    expect(source).toContain('mime_type: file.type || "image/jpeg"');
    expect(source).not.toContain('supabase.functions.invoke("gemini-analyze-receipt"');
  });

  it("keeps the local manual text parser instead of adding a new Edge Function", () => {
    expect(source).toContain("raw.match(/(\\d+(?:[.,]\\d+)?)/)");
    expect(source).toContain('parseFloat(match[1].replace(",", "."))');
    expect(source).toContain('category: "Geral"');
    expect(source).not.toContain('supabase.functions.invoke("gemini-parse-expense"');
  });

  it("preserves category aliases and creates the resolved original category", () => {
    expect(source).toContain("CATEGORY_ALIASES[normalizedName(item.category)] || item.category");
    expect(source).toContain("name: targetCategory");
  });

  it("keeps the original monthly summary query and calculation", () => {
    expect(source).toContain('.select("amount, category_id, transaction_type")');
    expect(source).toContain('.gte("occurred_at", startOfMonth)');
    expect(source).toContain('.neq("status", "void")');
    expect(source).toContain('t.transaction_type === "expense"');
  });

  it("waits for subscription loading before gating the workspace", () => {
    expect(source).toContain("capabilitiesForSubscription");
    expect(source).toContain("!subscription.isLoading && !capabilitiesForSubscription(subscription.data).whatsapp");
  });

  it("preserves local history storage and the processed-items destination", () => {
    expect(source).toContain("localStorage.setItem(STORAGE, JSON.stringify(bubbles))");
    expect(source).toContain('<Link to="/dashboard"');
  });
});
