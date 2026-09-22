// Synthetic data only. Never import application clients, credentials or .env files.
export const NOW = "2026-09-21T12:00:00.000Z";
export const USER_ID = "00000000-0000-4000-8000-000000000001";
const SPACE_ID = "00000000-0000-4000-8000-000000000010";
const stamp = { created_at: "2026-01-01T12:00:00.000Z", updated_at: NOW };
const owned = { ...stamp, space_id: SPACE_ID, created_by: USER_ID };
export const USER = {
  id: USER_ID, aud: "authenticated", role: "authenticated", email: "editorial.qa@example.invalid",
  email_confirmed_at: stamp.created_at, created_at: stamp.created_at, updated_at: NOW,
  last_sign_in_at: NOW, app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { name: "Alexandra de Albuquerque - conta sintetica QA" }, identities: [],
};

export function syntheticSession() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: USER_ID, aud: "authenticated", role: "authenticated", exp: 4102444800 })}.synthetic-not-a-valid-signature`,
    refresh_token: "synthetic-invalid-refresh-token", expires_in: 3600,
    expires_at: 4102444800, token_type: "bearer", user: USER,
  };
}

const categories = [
  { id: "qa-food", name: "Alimentacao e compras para a casa", color: "#176874", icon: "ShoppingBasket" },
  { id: "qa-home", name: "Habitacao", color: "#A84234", icon: "House" },
  { id: "qa-travel", name: "Transportes", color: "#816022", icon: "Train" },
].map((category, i) => ({ ...stamp, ...category, space_id: SPACE_ID, transaction_type: "expense", sort_order: i, is_active: true, is_system: false }));

const transaction = (id, description, amount, type, category, status, date) => ({
  ...owned, id, description, amount, transaction_type: type, category_id: category,
  status, merchant: "Estabelecimento sintetico QA", currency: "EUR", source: "app",
  occurred_at: `${date}T12:00:00.000Z`, deleted_at: null, metadata: {}, whatsapp_message_id: null,
});
const tables = {
  spaces: [{ ...stamp, id: SPACE_ID, owner_user_id: USER_ID, name: "Casa Alexandra de Albuquerque - espaco sintetico QA", kind: "family", locale: "pt-PT", currency: "EUR", timezone: "Europe/Lisbon", settings: {} }],
  space_members: [{ ...stamp, id: "qa-member", space_id: SPACE_ID, user_id: USER_ID, role: "owner", joined_at: stamp.created_at }],
  profiles: [{ ...stamp, user_id: USER_ID, display_name: USER.user_metadata.name }],
  space_invitations: [{ ...stamp, id: "qa-invitation", space_id: SPACE_ID, email: "convidado.qa@example.invalid", role: "viewer", status: "pending", invited_by: USER_ID, accepted_by: null, accepted_at: null, expires_at: "2026-10-01T12:00:00.000Z" }],
  categories,
  transactions: [
    transaction("qa-income", "Rendimento sintetico QA", 1234567.89, "income", null, "cleared", "2026-09-01"),
    transaction("qa-food-transaction", "Supermercado QA - descricao longa para verificar reflow", 245.67, "expense", "qa-food", "cleared", "2026-09-19"),
    transaction("qa-home-transaction", "Renda QA", 1250, "expense", "qa-home", "pending", "2026-09-20"),
    transaction("qa-transfer", "Transferencia QA", 150, "transfer", null, "cleared", "2026-09-18"),
    transaction("qa-void", "Compra anulada QA", 99, "expense", "qa-travel", "void", "2026-09-17"),
    transaction("qa-previous", "Mes anterior QA", 200, "expense", "qa-food", "cleared", "2026-08-12"),
  ],
  budget_plans: [{ ...owned, id: "qa-plan", name: "Plano familiar sintetico - setembro e compromissos", period_start: "2026-09-01", period_end: "2026-09-30", expected_income: 1234567.89, is_active: true, currency: "EUR" }],
  budget_allocations: categories.map((category, i) => ({ ...stamp, id: `qa-allocation-${i}`, space_id: SPACE_ID, budget_plan_id: "qa-plan", category_id: category.id, amount: null, percentage: [40, 40, 20][i] })),
  spending_limits: categories.map((category, i) => ({ ...stamp, id: `qa-limit-${i}`, space_id: SPACE_ID, category_id: category.id, amount: [300, 1000, 500][i], currency: "EUR", period: "monthly", starts_on: "2026-09-01" })),
  financial_goals: [{ ...owned, id: "qa-goal", name: "Reserva de seguranca familiar - objetivo sintetico de longo prazo", target_amount: 9876543.21, current_amount: 1234567.89, currency: "EUR", target_date: "2027-12-31", is_completed: false }],
  subscriptions: [{ ...stamp, id: "qa-subscription", user_id: USER_ID, provider: "stripe", provider_customer_id: null, provider_subscription_id: null, product_id: null, price_id: null, status: "active", amount: 9.99, currency: "EUR", current_period_start: "2026-09-01T00:00:00.000Z", current_period_end: "2026-10-01T00:00:00.000Z", cancel_at_period_end: false, environment: "test" }],
  whatsapp_connections: [{ ...stamp, id: "qa-whatsapp", space_id: SPACE_ID, linked_user_id: USER_ID, phone_e164: "+12025550123", provider: "qa", instance_name: "synthetic", monthly_report_opt_in: false, report_preferences: {}, status: "active", verified_at: NOW, last_seen_at: NOW }],
};
const emptyTables = new Set(["transactions", "budget_plans", "budget_allocations", "spending_limits", "financial_goals", "space_invitations", "whatsapp_connections"]);
export const DATA_TABLES = [...emptyTables];

// A deliberately small PostgREST subset, with unsupported columns/operators rejected.
export function readFixture(url, headers, state) {
  if (url.pathname === "/auth/v1/user") return { body: USER };
  if (url.pathname === "/functions/v1/whatsapp-diagnostico") return {
    body: { secrets: { DATAFY_TOKEN: true, DATAFY_WEBHOOK_SECRET: false, WHATSAPP_VERIFY_TOKEN: true, WHATSAPP_PHONE_ID: true, GEMINI_API_KEY: false }, linkedPhone: null, linkedAt: null,
      events: state === "empty" ? [] : [{ id: "qa-event", event_type: "qa.synthetic.read_only", phone: null, success: true, summary: "Evento sintetico para QA visual. Nenhuma mensagem enviada.", error: null, created_at: NOW }] },
  };
  const match = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
  if (!match || !Object.hasOwn(tables, match[1])) throw new Error("Uncovered fixture path");
  const table = match[1];
  if (headers["accept-profile"] !== "app_v2") throw new Error("Uncovered database schema");
  const columns = new Set(Object.keys(tables[table][0]));
  let rows = state === "empty" && emptyTables.has(table) ? [] : structuredClone(tables[table]);
  for (const [key, value] of url.searchParams) {
    if (["select", "order", "limit", "offset"].includes(key)) continue;
    if (!columns.has(key)) throw new Error(`Uncovered filter column: ${key}`);
    const separator = value.indexOf(".");
    const operator = value.slice(0, separator);
    const operand = value.slice(separator + 1);
    if (!["eq", "neq", "is", "in", "gte", "lte", "gt", "lt"].includes(operator)) throw new Error(`Uncovered filter operator: ${operator}`);
    rows = rows.filter((row) => {
      const actual = row[key];
      if (operator === "is") return operand === "null" ? actual === null : String(actual) === operand;
      if (operator === "in") return operand.slice(1, -1).split(",").includes(String(actual));
      if (operator === "eq") return String(actual) === operand;
      if (operator === "neq") return String(actual) !== operand;
      if (operator === "gte") return actual >= operand;
      if (operator === "lte") return actual <= operand;
      if (operator === "gt") return actual > operand;
      return actual < operand;
    });
  }
  const orders = (url.searchParams.get("order") || "").split(",").filter(Boolean).map((item) => item.split("."));
  for (const [column, direction] of orders) if (!columns.has(column) || !["asc", "desc"].includes(direction)) throw new Error("Uncovered order");
  rows.sort((a, b) => {
    for (const [column, direction] of orders) {
      const comparison = a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0;
      if (comparison) return comparison * (direction === "desc" ? -1 : 1);
    }
    return 0;
  });
  const total = rows.length;
  const offset = Number(url.searchParams.get("offset") || 0);
  rows = rows.slice(offset, offset + Number(url.searchParams.get("limit") || rows.length));
  const select = url.searchParams.get("select") || "*";
  if (select !== "*") {
    const selected = select.split(",").map((column) => column.trim());
    if (selected.some((column) => !columns.has(column))) throw new Error("Uncovered projection");
    rows = rows.map((row) => Object.fromEntries(selected.map((column) => [column, row[column]])));
  }
  const single = headers.accept?.includes("application/vnd.pgrst.object+json");
  if (single && rows.length > 1) throw new Error("Fixture single response has multiple rows");
  return { body: single ? rows[0] ?? null : rows, headers: { "content-range": rows.length ? `${offset}-${offset + rows.length - 1}/${total}` : `*/${total}` } };
}
