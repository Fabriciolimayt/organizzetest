import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import {
  buildTransactionInsert,
  filterTransactions,
  invalidateFinancialQueries,
  softDeletePatch,
} from "@/hooks/useTransactionsV2";
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

describe("V2 transaction behavior", () => {
  it("uses the shared page hierarchy and destructive confirmation", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/DashboardLancamentos.tsx"), "utf8");
    expect(source).toContain("<PageHeader");
    expect(source).toContain("<FinancialRow");
    expect(source).toContain("AlertDialog");
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
