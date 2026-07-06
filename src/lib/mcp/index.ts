import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listExpensesTool from "./tools/list-expenses";
import createExpenseTool from "./tools/create-expense";
import monthlySummaryTool from "./tools/monthly-summary";

// Issuer MUST be the direct supabase.co host, built from the project ref
// (Vite inlines VITE_SUPABASE_PROJECT_ID at build time, keeping this import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "organizze-mcp",
  title: "Organizze",
  version: "0.1.0",
  instructions:
    "Tools for the Organizze personal-finance app. Use `list_expenses` to read the signed-in user's expenses, `create_expense` to add a new one, and `monthly_summary` for totals by category.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listExpensesTool, createExpenseTool, monthlySummaryTool],
});
