export const financeQueryKeys = {
  root: ["finance-v2"] as const,
  context: (userId: string | undefined, selectedSpaceId: string | null) =>
    ["finance-v2", "context", userId, selectedSpaceId] as const,
  transactions: (spaceId: string | undefined, monthKey?: string, bounds?: object) =>
    monthKey === undefined
      ? ["finance-v2", "transactions", spaceId] as const
      : ["finance-v2", "transactions", spaceId, monthKey, bounds ?? {}] as const,
  dashboard: (spaceId: string | undefined, monthKey?: string) =>
    monthKey === undefined
      ? ["finance-v2", "dashboard", spaceId] as const
      : ["finance-v2", "dashboard", spaceId, monthKey] as const,
  reports: (spaceId: string | undefined, monthKey?: string) =>
    monthKey === undefined
      ? ["finance-v2", "reports", spaceId] as const
      : ["finance-v2", "reports", spaceId, monthKey] as const,
  budgets: (spaceId: string | undefined, monthKey?: string) =>
    monthKey === undefined
      ? ["finance-v2", "budgets", spaceId] as const
      : ["finance-v2", "budgets", spaceId, monthKey] as const,
  plans: (spaceId: string | undefined) =>
    ["finance-v2", "plans", spaceId] as const,
  spaces: (userId: string | undefined) =>
    ["finance-v2", "spaces", userId] as const,
  limits: (spaceId: string | undefined) =>
    ["finance-v2", "limits", spaceId] as const,
  goals: (spaceId: string | undefined) =>
    ["finance-v2", "goals", spaceId] as const,
  subscription: (userId: string | undefined) =>
    ["finance-v2", "subscription", userId] as const,
};
