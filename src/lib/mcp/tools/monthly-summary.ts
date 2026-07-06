import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "monthly_summary",
  title: "Monthly expense summary",
  description: "Return total spend and per-category breakdown for a given month (defaults to current).",
  inputSchema: {
    year: z.number().int().min(2000).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional().describe("1-12"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ year, month }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const now = new Date();
    const y = year ?? now.getUTCFullYear();
    const m = month ?? now.getUTCMonth() + 1;
    const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
    const end = new Date(Date.UTC(y, m, 1)).toISOString();

    const { data, error } = await supabaseForUser(ctx)
      .from("expenses")
      .select("amount, category")
      .eq("user_id", ctx.getUserId())
      .gte("occurred_at", start)
      .lt("occurred_at", end);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const row of data ?? []) {
      const amt = Number(row.amount) || 0;
      total += amt;
      byCategory[row.category] = (byCategory[row.category] ?? 0) + amt;
    }
    const summary = { year: y, month: m, total, byCategory };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
