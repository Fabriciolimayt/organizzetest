import { QueryClient } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  queryCalls: [] as Array<{ range: { key: string }; filters: Record<string, string> }>,
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  toast: vi.fn(),
  financial: {
    data: {
      currency: "EUR",
      locale: "pt-PT",
      timezone: "UTC",
      canWrite: true,
      categories: [{ id: "food", name: "Alimentação", transaction_type: "expense", color: null }],
    },
    isLoading: false,
  },
  query: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as Error | null,
    context: { isLoading: false, error: null as Error | null },
    refetch: vi.fn(),
  },
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => testState.financial,
}));

vi.mock("@/hooks/useTransactionsV2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useTransactionsV2")>();
  return {
    ...actual,
    useTransactionsV2: (range: { key: string }, filters: Record<string, string>) => {
      testState.queryCalls.push({ range, filters });
      return testState.query;
    },
    useCreateTransactionV2: () => ({ mutateAsync: testState.createTransaction, isPending: false }),
    useUpdateTransactionV2: () => ({ mutateAsync: testState.updateTransaction, isPending: false }),
    useDeleteTransactionV2: () => ({ mutateAsync: testState.deleteTransaction, isPending: false }),
  };
});

vi.mock("@/hooks/use-toast", () => ({ toast: testState.toast }));

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import {
  buildTransactionInsert,
  filterTransactions,
  invalidateFinancialQueries,
  softDeletePatch,
  type TransactionFormValues,
} from "@/hooks/useTransactionsV2";
import DashboardLancamentos from "@/pages/DashboardLancamentos";
import { calendarDateInTimeZone, calendarDateToUtc } from "@/lib/finance/month";

const transaction = {
  id: "tx-1",
  space_id: "space-1",
  created_by: "user-1",
  category_id: "food",
  transaction_type: "expense" as const,
  source: "app" as const,
  status: "cleared" as const,
  amount: 45,
  currency: "EUR",
  description: "Supermercado",
  merchant: "Continente",
  whatsapp_message_id: null,
  occurred_at: "2026-08-20T12:00:00.000Z",
  metadata: {},
  deleted_at: null,
  created_at: "2026-08-20T12:00:00.000Z",
  updated_at: "2026-08-20T12:00:00.000Z",
};

const renderTransactions = () => render(createElement(MemoryRouter, null, createElement(DashboardLancamentos)));

const metricValue = (label: string) => screen.getByText(label).nextElementSibling as HTMLElement;

const selectOption = (scope: HTMLElement, label: string, option: string) => {
  fireEvent.keyDown(within(scope).getByLabelText(label), { key: "Enter" });
  fireEvent.click(screen.getByRole("option", { name: option }));
};

describe("V2 transaction behavior", () => {
  beforeEach(() => {
    testState.queryCalls.length = 0;
    testState.createTransaction.mockReset();
    testState.createTransaction.mockResolvedValue(undefined);
    testState.updateTransaction.mockReset();
    testState.updateTransaction.mockResolvedValue(undefined);
    testState.deleteTransaction.mockReset();
    testState.deleteTransaction.mockResolvedValue(undefined);
    testState.toast.mockReset();
    testState.query.refetch.mockReset();
    testState.query.data = [transaction];
    testState.query.error = null;
    testState.query.context.error = null;
    testState.financial.data.canWrite = true;
  });

  afterEach(() => cleanup());

  it("uses the shared page hierarchy and destructive confirmation", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/DashboardLancamentos.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).toContain("<FinancialRow");
    expect(source).toContain("AlertDialog");
  });

  it("renders a desktop ledger table and readable mobile rows", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/DashboardLancamentos.tsx"), "utf8");
    expect(source).toContain('aria-label="Tabela de lançamentos"');
    expect(source).toContain("md:block");
    expect(source).toContain("md:hidden");
  });

  it("drives filters and month navigation through the rendered query hook", () => {
    renderTransactions();
    const initialMonth = testState.queryCalls.at(-1)?.range.key;

    fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar lançamentos" }), {
      target: { value: "continente" },
    });
    expect(testState.queryCalls.at(-1)?.filters.search).toBe("continente");

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(testState.queryCalls.at(-1)?.range.key).not.toBe(initialMonth);
  });

  it("returns keyboard focus to the new or edit trigger after closing the dialog", async () => {
    renderTransactions();
    const triggers = [
      screen.getByRole("button", { name: "Novo lançamento" }),
      screen.getAllByRole("button", { name: "Editar Supermercado" })[0],
    ];
    for (const trigger of triggers) {
      trigger.focus();
      fireEvent.click(trigger);
      const dialog = await screen.findByRole("dialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
    expect(testState.createTransaction).not.toHaveBeenCalled();
    expect(testState.updateTransaction).not.toHaveBeenCalled();
  });

  it("creates a transaction and renders its refetch-driven row and totals", async () => {
    testState.createTransaction.mockImplementation(async (values: TransactionFormValues) => {
      testState.query.data = [...testState.query.data, {
        ...transaction,
        id: "tx-created",
        category_id: values.categoryId,
        transaction_type: values.transactionType,
        status: values.status,
        amount: values.amount,
        description: values.description,
        merchant: values.merchant,
        occurred_at: values.occurredAt,
      }];
    });
    renderTransactions();
    expect(metricValue("Receitas")).toHaveTextContent("0,00 €");

    fireEvent.click(screen.getByRole("button", { name: "Novo lançamento" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Receita" }));
    fireEvent.change(within(dialog).getByLabelText("Descrição"), { target: { value: "Bónus" } });
    fireEvent.change(within(dialog).getByLabelText("Valor (EUR)"), { target: { value: "100" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(testState.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      description: "Bónus",
      amount: 100,
      categoryId: null,
      transactionType: "income",
      status: "cleared",
    })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getAllByText("Bónus")).toHaveLength(2);
    expect(metricValue("Receitas")).toHaveTextContent("100,00 €");
    expect(metricValue("Saldo líquido")).toHaveTextContent("55,00 €");
  });

  it("wires both responsive edit surfaces to real updates, including void status", async () => {
    testState.updateTransaction.mockImplementation(async ({ id, values }: { id: string; values: TransactionFormValues }) => {
      testState.query.data = testState.query.data.map((row) => row.id === id ? {
        ...row,
        category_id: values.categoryId,
        transaction_type: values.transactionType,
        status: values.status,
        amount: values.amount,
        description: values.description,
        merchant: values.merchant,
        occurred_at: values.occurredAt,
      } : row);
    });
    renderTransactions();
    expect(screen.getByRole("heading", { name: "Extrato", level: 2 })).toBeInTheDocument();
    expect(metricValue("Despesas")).toHaveTextContent("45,00 €");

    const editButtons = screen.getAllByRole("button", { name: "Editar Supermercado" });
    expect(editButtons).toHaveLength(2);
    editButtons.forEach((button) => {
      expect(button).toHaveClass("size-11");
      expect(button).not.toHaveClass("size-10");
    });

    fireEvent.click(editButtons[0]);
    let dialog = await screen.findByRole("dialog");
    const orderedFields = [
      within(dialog).getByLabelText("Descrição"),
      within(dialog).getByLabelText("Valor (EUR)"),
      within(dialog).getByLabelText("Data"),
      within(dialog).getByLabelText("Categoria"),
      within(dialog).getByLabelText("Estado"),
      within(dialog).getByLabelText("Comerciante (opcional)"),
    ];
    orderedFields.slice(0, -1).forEach((field, index) => {
      expect(field.compareDocumentPosition(orderedFields[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    fireEvent.change(within(dialog).getByLabelText("Descrição"), { target: { value: "Supermercado revisto" } });
    selectOption(dialog, "Estado", "Anulado");
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(testState.updateTransaction).toHaveBeenCalledWith({
      id: "tx-1",
      values: expect.objectContaining({ description: "Supermercado revisto", status: "void" }),
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getAllByText("Anulado")).toHaveLength(2);
    expect(metricValue("Despesas")).toHaveTextContent("0,00 €");

    fireEvent.click(screen.getAllByRole("button", { name: "Editar Supermercado revisto" })[1]);
    dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Descrição"), { target: { value: "Supermercado final" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(testState.updateTransaction).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("Supermercado final")).toHaveLength(2);
  });

  it("drives both responsive destructive callbacks and updates totals after deletion", async () => {
    testState.query.data = [
      transaction,
      { ...transaction, id: "tx-2", description: "Combustível", merchant: "Posto", amount: 30 },
    ];
    testState.deleteTransaction.mockImplementation(async (id: string) => {
      testState.query.data = testState.query.data.filter((row) => row.id !== id);
    });
    renderTransactions();
    expect(metricValue("Despesas")).toHaveTextContent("75,00 €");

    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar Supermercado" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Eliminar Supermercado" })).not.toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar Combustível" })[1]);
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(screen.getByText("Nenhum lançamento corresponde a este período e filtros.")).toBeInTheDocument());

    expect(testState.deleteTransaction.mock.calls.map(([id]) => id)).toEqual(["tx-1", "tx-2"]);
    expect(metricValue("Despesas")).toHaveTextContent("0,00 €");
  });

  it("renders permission and retry states without exposing write callbacks", () => {
    testState.financial.data.canWrite = false;
    renderTransactions();
    expect(screen.getByRole("button", { name: "Novo lançamento" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Editar Supermercado" })).not.toBeInTheDocument();

    cleanup();
    testState.financial.data.canWrite = true;
    testState.query.error = new Error("offline");
    renderTransactions();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(testState.query.refetch).toHaveBeenCalledTimes(1);
  });

  it("builds a valid app transaction and rejects foreign categories", () => {
    expect(buildTransactionInsert({
      description: "  Supermercado ",
      merchant: " Continente ",
      amount: 45,
      categoryId: "food",
      transactionType: "expense",
      status: "pending",
      occurredAt: "2026-08-20T12:00:00.000Z",
    }, {
      userId: "user-1",
      spaceId: "space-1",
      currency: "EUR",
      categoryIds: new Set(["food"]),
    })).toMatchObject({
      space_id: "space-1",
      created_by: "user-1",
      category_id: "food",
      transaction_type: "expense",
      source: "app",
      status: "pending",
      amount: 45,
      currency: "EUR",
      description: "Supermercado",
      merchant: "Continente",
    });

    expect(() => buildTransactionInsert({
      description: "Despesa",
      merchant: "",
      amount: 10,
      categoryId: "foreign",
      transactionType: "expense",
      status: "cleared",
      occurredAt: "2026-08-20T12:00:00.000Z",
    }, {
      userId: "user-1",
      spaceId: "space-1",
      currency: "EUR",
      categoryIds: new Set(["food"]),
    })).toThrow("categoria");
  });

  it("preserves transfer type and status in a validated form payload", () => {
    expect(buildTransactionInsert({
      description: "Transferência interna",
      merchant: "",
      amount: 100,
      categoryId: null,
      transactionType: "transfer",
      status: "void",
      occurredAt: "2026-08-20T12:00:00.000Z",
    }, {
      userId: "user-1",
      spaceId: "space-1",
      currency: "EUR",
      categoryIds: new Set(),
    })).toMatchObject({ transaction_type: "transfer", status: "void", category_id: null });
  });

  it("round-trips calendar dates in timezones east and west of UTC", () => {
    const aucklandInstant = calendarDateToUtc("2026-01-02", "Pacific/Auckland");
    const losAngelesInstant = calendarDateToUtc("2026-01-02", "America/Los_Angeles");
    expect(calendarDateInTimeZone(aucklandInstant, "Pacific/Auckland")).toBe("2026-01-02");
    expect(calendarDateInTimeZone(losAngelesInstant, "America/Los_Angeles")).toBe("2026-01-02");
    expect(aucklandInstant.toISOString()).toBe("2026-01-01T23:00:00.000Z");
    expect(losAngelesInstant.toISOString()).toBe("2026-01-02T20:00:00.000Z");
  });

  it("filters a monthly result without changing the source rows", () => {
    const rows = [
      transaction,
      { ...transaction, id: "tx-2", transaction_type: "income" as const, description: "Salário", merchant: null, category_id: null, amount: 2000 },
    ];

    expect(filterTransactions(rows, { search: "continente", type: "expense", categoryId: "food", status: "cleared" })).toEqual([transaction]);
    expect(filterTransactions(rows, { search: "salário", type: "all", categoryId: "all", status: "all" }).map((row) => row.id)).toEqual(["tx-2"]);
    expect(rows).toHaveLength(2);
  });

  it("creates a deterministic soft-delete patch", () => {
    expect(softDeletePatch(new Date("2026-08-21T09:30:00.000Z"))).toEqual({
      deleted_at: "2026-08-21T09:30:00.000Z",
    });
  });

  it("invalidates every financial view affected by a transaction", async () => {
    const client = new QueryClient();
    const keys = [
      financeQueryKeys.transactions("space-1"),
      financeQueryKeys.dashboard("space-1"),
      financeQueryKeys.reports("space-1"),
      financeQueryKeys.budgets("space-1"),
    ];
    keys.forEach((key) => client.setQueryData(key, { loaded: true }));

    await invalidateFinancialQueries(client, "space-1");

    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([true, true, true, true]);
  });
});
