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
  name: "list_expenses",
  title: "List expenses",
  description: "List the signed-in user's expenses, most recent first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 20)."),
    category: z.string().optional().describe("Filter by exact category name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("expenses")
      .select("id, amount, category, merchant, name, description, occurred_at, source")
      .eq("user_id", ctx.getUserId())
      .order("occurred_at", { ascending: false })
      .limit(limit ?? 20);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { expenses: data ?? [] },
    };
  },
});
