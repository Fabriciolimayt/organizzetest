import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { financeQueryKeys } from "@/hooks/finance-query-keys";
import { supabaseV2 } from "@/integrations/supabase/v2";

export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type FinancialMembership = {
  space_id: string;
  role: MemberRole;
};

export type FinancialSpace = {
  id: string;
  name: string;
  role: MemberRole;
  canWrite: boolean;
};

export type FinancialContextData = {
  userId: string;
  spaceId: string;
  role: MemberRole;
  canWrite: boolean;
  currency: string;
  locale: string;
  timezone: string;
  categories: Array<{
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    transaction_type: "expense" | "income" | "transfer";
  }>;
  spaces: FinancialSpace[];
};

const ROLE_PRIORITY: Record<MemberRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

const canWriteRole = (role: MemberRole) => role !== "viewer";

export function selectPreferredMembership(
  memberships: FinancialMembership[],
  selectedSpaceId?: string | null,
): FinancialMembership | undefined {
  const selected = selectedSpaceId
    ? memberships.find((membership) => membership.space_id === selectedSpaceId)
    : undefined;
  if (selected) return selected;

  return [...memberships].sort((a, b) => {
    const roleDifference = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    return roleDifference || a.space_id.localeCompare(b.space_id);
  })[0];
}

export function useFinancialContext() {
  const { user, loading: authLoading } = useAuth();
  const preferenceKey = user ? `organizze.activeSpace:${user.id}` : null;
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!preferenceKey) {
      setSelectedSpaceId(null);
      return;
    }
    try {
      setSelectedSpaceId(localStorage.getItem(preferenceKey));
    } catch {
      setSelectedSpaceId(null);
    }
  }, [preferenceKey]);

  const query = useQuery({
    queryKey: financeQueryKeys.context(user?.id, selectedSpaceId),
    enabled: Boolean(user) && !authLoading,
    queryFn: async (): Promise<FinancialContextData> => {
      if (!user) throw new Error("Inicia sessão para consultar as tuas finanças.");

      const { data: membershipRows, error: membershipError } = await supabaseV2
        .from("space_members")
        .select("space_id, role")
        .eq("user_id", user.id);
      if (membershipError) throw membershipError;

      const memberships = (membershipRows ?? []) as FinancialMembership[];
      const membership = selectPreferredMembership(memberships, selectedSpaceId);
      if (!membership) throw new Error("Não foi encontrado um espaço financeiro para esta conta.");

      const spaceIds = memberships.map((item) => item.space_id);
      const [{ data: spaceRows, error: spacesError }, { data: categoryRows, error: categoriesError }] = await Promise.all([
        supabaseV2
          .from("spaces")
          .select("id, name, currency, locale, timezone")
          .in("id", spaceIds),
        supabaseV2
          .from("categories")
          .select("id, name, color, icon, transaction_type")
          .eq("space_id", membership.space_id)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (spacesError) throw spacesError;
      if (categoriesError) throw categoriesError;

      const selectedSpace = (spaceRows ?? []).find((space) => space.id === membership.space_id);
      if (!selectedSpace) throw new Error("O espaço financeiro selecionado não está disponível.");

      const rolesBySpace = new Map(memberships.map((item) => [item.space_id, item.role]));
      const spaces: FinancialSpace[] = (spaceRows ?? []).map((space) => {
        const role = rolesBySpace.get(space.id) ?? "viewer";
        return { id: space.id, name: space.name, role, canWrite: canWriteRole(role) };
      });

      return {
        userId: user.id,
        spaceId: selectedSpace.id,
        role: membership.role,
        canWrite: canWriteRole(membership.role),
        currency: selectedSpace.currency,
        locale: selectedSpace.locale,
        timezone: selectedSpace.timezone,
        categories: categoryRows ?? [],
        spaces,
      };
    },
    staleTime: 30_000,
  });

  const selectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    if (!preferenceKey) return;
    try {
      localStorage.setItem(preferenceKey, spaceId);
    } catch {
      // The selected space remains in memory when browser storage is unavailable.
    }
  };

  return { ...query, selectSpace };
}
