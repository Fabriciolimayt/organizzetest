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
  name: "create_expense",
  title: "Create expense",
  description: "Create a new expense entry for the signed-in user.",
  inputSchema: {
    amount: z.number().positive().describe("Expense amount (positive number)."),
    category: z.string().trim().min(1).describe("Category name, e.g. 'alimentação'."),
    merchant: z.string().trim().optional().describe("Merchant / store name."),
    description: z.string().trim().optional().describe("Free-form note."),
    occurred_at: z
      .string()
      .optional()
      .describe("ISO timestamp when the expense occurred. Defaults to now."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ amount, category, merchant, description, occurred_at }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("expenses")
      .insert({
        user_id: ctx.getUserId(),
        amount,
        category,
        merchant,
        description,
        occurred_at: occurred_at ?? new Date().toISOString(),
        source: "mcp",
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Expense created: ${data.id}` }],
      structuredContent: { expense: data },
    };
  },
});
