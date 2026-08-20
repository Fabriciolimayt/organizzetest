import type { V2Insert, V2Row } from "@/integrations/supabase/v2";

export type MemberRole = V2Row<"space_members">["role"];
export type InvitationRole = Exclude<MemberRole, "owner">;

export type InvitationInsertInput = {
  spaceId: string;
  email: string;
  role: InvitationRole;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export function createInvitationToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function hashInvitationToken(token: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function buildInvitationInsert(
  input: InvitationInsertInput,
): V2Insert<"space_invitations"> {
  if ((input.role as MemberRole) === "owner") {
    throw new Error("Não é possível convidar outro proprietário.");
  }
  if (!/^[0-9a-f]{64}$/.test(input.tokenHash)) {
    throw new Error("O hash do convite é inválido.");
  }

  return {
    space_id: input.spaceId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: "pending",
    token_hash: `\\x${input.tokenHash}`,
    invited_by: input.invitedBy,
    expires_at: input.expiresAt,
  };
}

export function canManageHousehold(role: MemberRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canChangeMemberRole(
  actorRole: MemberRole | null | undefined,
  memberRole: MemberRole,
) {
  return canManageHousehold(actorRole) && memberRole !== "owner";
}

export function effectiveInvitationStatus(
  invitation: Pick<V2Row<"space_invitations">, "status" | "expires_at">,
  now = new Date(),
) {
  return invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= now.getTime()
    ? "expired" as const
    : invitation.status;
}
