import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { financeQueryKeys } from "@/hooks/finance-query-keys";
import {
  buildInvitationInsert,
  canChangeMemberRole,
  createInvitationToken,
  hashInvitationToken,
  type InvitationRole,
  type MemberRole,
} from "@/lib/finance/invitations";
import { supabaseV2, type V2Row } from "@/integrations/supabase/v2";

type Space = V2Row<"spaces">;
type SpaceMember = V2Row<"space_members"> & { display_name?: string | null };
type SpaceInvitation = Omit<V2Row<"space_invitations">, "token_hash">;

type MembershipSummary = Pick<SpaceMember, "space_id" | "role"> & { id?: string };

export type SpaceWithMembership = Space & {
  membershipId?: string;
  role: MemberRole;
};

export const spacesQueryKeys = {
  root: ["finance", "spaces"] as const,
  all: (userId?: string) => ["finance", "spaces", "user", userId] as const,
  members: (spaceId?: string) => ["finance", "spaces", spaceId, "members"] as const,
  invitations: (spaceId?: string) => ["finance", "spaces", spaceId, "invitations"] as const,
};

export function mergeSpacesWithMemberships<
  SpaceValue extends { id: string; name: string },
  MembershipValue extends { space_id: string; role: MemberRole; id?: string },
>(spaces: SpaceValue[], memberships: MembershipValue[]) {
  const membershipBySpace = new Map(memberships.map((membership) => [membership.space_id, membership]));

  return spaces
    .flatMap((space) => {
      const membership = membershipBySpace.get(space.id);
      return membership
        ? [{ ...space, role: membership.role, ...(membership.id ? { membershipId: membership.id } : {}) }]
        : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function invalidateSpaceData(queryClient: ReturnType<typeof useQueryClient>, spaceId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: spacesQueryKeys.root }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
    spaceId
      ? queryClient.invalidateQueries({ queryKey: spacesQueryKeys.members(spaceId) })
      : Promise.resolve(),
    spaceId
      ? queryClient.invalidateQueries({ queryKey: spacesQueryKeys.invitations(spaceId) })
      : Promise.resolve(),
  ]);
}

export function useSpacesV2() {
  const { user } = useAuth();

  return useQuery({
    queryKey: spacesQueryKeys.all(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SpaceWithMembership[]> => {
      if (!user?.id) return [];

      const { data: memberships, error: membershipError } = await supabaseV2
        .from("space_members")
        .select("id, space_id, role")
        .eq("user_id", user.id);
      if (membershipError) throw membershipError;

      const membershipRows = (memberships ?? []) as MembershipSummary[];
      const spaceIds = membershipRows.map((membership) => membership.space_id);
      if (!spaceIds.length) return [];

      const { data: spaces, error: spacesError } = await supabaseV2
        .from("spaces")
        .select("*")
        .in("id", spaceIds);
      if (spacesError) throw spacesError;

      return mergeSpacesWithMemberships(spaces ?? [], membershipRows) as SpaceWithMembership[];
    },
  });
}

export function useSpaceMembersV2(spaceId?: string) {
  return useQuery({
    queryKey: spacesQueryKeys.members(spaceId),
    enabled: Boolean(spaceId),
    queryFn: async (): Promise<SpaceMember[]> => {
      if (!spaceId) return [];
      const { data, error } = await supabaseV2
        .from("space_members")
        .select("*")
        .eq("space_id", spaceId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      const members = data ?? [];
      if (!members.length) return [];
      const { data: profiles, error: profileError } = await supabaseV2
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", members.map((member) => member.user_id));
      if (profileError) throw profileError;
      const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
      return members.map((member) => ({ ...member, display_name: names.get(member.user_id) ?? null }));
    },
  });
}

export function useSpaceInvitationsV2(spaceId?: string, enabled = true) {
  return useQuery({
    queryKey: spacesQueryKeys.invitations(spaceId),
    enabled: Boolean(spaceId) && enabled,
    queryFn: async (): Promise<SpaceInvitation[]> => {
      if (!spaceId) return [];
      const { data, error } = await supabaseV2
        .from("space_invitations")
        .select("id, space_id, email, role, status, invited_by, accepted_by, accepted_at, expires_at, created_at, updated_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSpaceV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const normalizedName = name.trim();
      if (!normalizedName) throw new Error("Indica um nome para o espaço.");
      const { data, error } = await supabaseV2.rpc("create_space", {
        name: normalizedName,
        kind: "family",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => invalidateSpaceData(queryClient),
  });
}

export function useCreateSpaceInvitationV2() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaceId,
      email,
      role,
      expiresInDays = 7,
    }: {
      spaceId: string;
      email: string;
      role: InvitationRole;
      expiresInDays?: number;
    }) => {
      if (!user?.id) throw new Error("Inicia sessão para criar um convite.");
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error("Indica um e-mail válido.");
      }
      if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
        throw new Error("A validade do convite deve ficar entre 1 e 30 dias.");
      }

      const token = createInvitationToken();
      const tokenHash = await hashInvitationToken(token);
      const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
      const insert = buildInvitationInsert({
        spaceId,
        email: normalizedEmail,
        role,
        tokenHash,
        invitedBy: user.id,
        expiresAt,
      });

      const { data, error } = await supabaseV2
        .from("space_invitations")
        .insert(insert)
        .select("id, space_id, email, role, status, invited_by, accepted_by, accepted_at, expires_at, created_at, updated_at")
        .single();
      if (error) throw error;

      return { invitation: data, token, path: `/convite?token=${encodeURIComponent(token)}` };
    },
    onSuccess: async ({ invitation }) => invalidateSpaceData(queryClient, invitation.space_id),
  });
}

export function useRevokeSpaceInvitationV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ spaceId, invitationId }: { spaceId: string; invitationId: string }) => {
      const { data, error } = await supabaseV2
        .from("space_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId)
        .eq("space_id", spaceId)
        .eq("status", "pending")
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => invalidateSpaceData(queryClient, variables.spaceId),
  });
}

export function useUpdateSpaceMemberRoleV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      spaceId,
      memberId,
      currentRole,
      role,
    }: {
      spaceId: string;
      memberId: string;
      currentRole: MemberRole;
      role: InvitationRole;
    }) => {
      if (!canChangeMemberRole("admin", currentRole)) {
        throw new Error("O papel do proprietário não pode ser alterado.");
      }
      const { data, error } = await supabaseV2
        .from("space_members")
        .update({ role })
        .eq("id", memberId)
        .eq("space_id", spaceId)
        .neq("role", "owner")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => invalidateSpaceData(queryClient, variables.spaceId),
  });
}

export function useAcceptSpaceInvitationV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const normalizedToken = token.trim();
      if (!normalizedToken) throw new Error("O convite está indisponível.");
      const { data, error } = await supabaseV2.rpc("accept_space_invitation", {
        token: normalizedToken,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => invalidateSpaceData(queryClient),
  });
}
