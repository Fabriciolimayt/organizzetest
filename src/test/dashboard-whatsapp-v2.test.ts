import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/pages/DashboardWhatsApp.tsx"),
  "utf8",
);

describe("DashboardWhatsApp app_v2 contract", () => {
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
