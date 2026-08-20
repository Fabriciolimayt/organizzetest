import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  rpc: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => testState.auth,
}));

vi.mock("@/integrations/supabase/v2", () => ({
  supabaseV2: { rpc: testState.rpc },
}));

import {
  buildInvitationInsert,
  canChangeMemberRole,
  canManageHousehold,
  createInvitationToken,
  effectiveInvitationStatus,
  hashInvitationToken,
} from "@/lib/finance/invitations";
import { mergeSpacesWithMemberships, spacesQueryKeys } from "@/hooks/useSpacesV2";
import AcceptInvitation from "@/pages/AcceptInvitation";

const renderInvitation = (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        {
          initialEntries: [path],
          future: { v7_startTransition: true, v7_relativeSplatPath: true },
        },
        createElement(AcceptInvitation),
      ),
    ),
  );
};

describe("household spaces and invitations V2", () => {
  beforeEach(() => {
    testState.auth.user = null;
    testState.auth.loading = false;
    testState.rpc.mockReset();
    sessionStorage.clear();
  });

  it("creates a cryptographically random base64url token with at least 32 bytes", () => {
    const token = createInvitationToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(token).not.toContain("=");
    expect(createInvitationToken()).not.toBe(token);
  });

  it("hashes invitation tokens with SHA-256 as lowercase hexadecimal", async () => {
    const token = "organizze-invitation-token";

    expect(await hashInvitationToken(token)).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(await hashInvitationToken(token)).toHaveLength(64);
  });

  it("builds a PostgreSQL bytea insert without retaining the raw token", () => {
    const invitationInsert = buildInvitationInsert({
      spaceId: "space-1",
      email: "  Pessoa@Example.COM ",
      role: "member",
      tokenHash: "ab".repeat(32),
      invitedBy: "user-1",
      expiresAt: "2026-08-27T12:00:00.000Z",
    });

    expect(invitationInsert).toEqual({
      space_id: "space-1",
      email: "pessoa@example.com",
      role: "member",
      status: "pending",
      token_hash: `\\x${"ab".repeat(32)}`,
      invited_by: "user-1",
      expires_at: "2026-08-27T12:00:00.000Z",
    });
    expect(invitationInsert).not.toHaveProperty("token");
  });

  it("never permits an invitation or role change to create another owner", () => {
    expect(() => buildInvitationInsert({
      spaceId: "space-1",
      email: "pessoa@example.com",
      role: "owner" as "member",
      tokenHash: "ab".repeat(32),
      invitedBy: "user-1",
      expiresAt: "2026-08-27T12:00:00.000Z",
    })).toThrow("proprietário");

    expect(canChangeMemberRole("owner", "owner")).toBe(false);
    expect(canChangeMemberRole("admin", "owner")).toBe(false);
    expect(canChangeMemberRole("admin", "member")).toBe(true);
    expect(canChangeMemberRole("member", "viewer")).toBe(false);
  });

  it("limits household administration to owners and admins", () => {
    expect(canManageHousehold("owner")).toBe(true);
    expect(canManageHousehold("admin")).toBe(true);
    expect(canManageHousehold("member")).toBe(false);
    expect(canManageHousehold("viewer")).toBe(false);
  });

  it("joins only spaces that have a real membership and preserves its role", () => {
    const spaces = [
      { id: "space-family", name: "Casa", kind: "family" as const },
      { id: "space-orphan", name: "Sem acesso", kind: "family" as const },
      { id: "space-personal", name: "Pessoal", kind: "personal" as const },
    ];
    const memberships = [
      { space_id: "space-personal", role: "owner" as const },
      { space_id: "space-family", role: "admin" as const },
    ];

    expect(mergeSpacesWithMemberships(spaces, memberships)).toEqual([
      { id: "space-family", name: "Casa", kind: "family", role: "admin" },
      { id: "space-personal", name: "Pessoal", kind: "personal", role: "owner" },
    ]);
  });

  it("isolates the spaces cache between authenticated users", () => {
    expect(spacesQueryKeys.all("user-a")).not.toEqual(spacesQueryKeys.all("user-b"));
  });

  it("requires authentication without forwarding the raw token to auth", async () => {
    renderInvitation("/convite?token=secret-token");

    const login = screen.getByRole("link", { name: /entrar para aceitar/i });
    expect(login).toHaveAttribute("href", "/auth?next=%2Fconvite");
    expect(login.getAttribute("href")).not.toContain("secret-token");
    await waitFor(() => expect(sessionStorage.getItem("organizze.pendingInvitationToken")).toBe("secret-token"));
  });

  it("presents an elapsed pending invitation as expired", () => {
    expect(effectiveInvitationStatus({ status: "pending", expires_at: "2026-08-19T12:00:00.000Z" }, new Date("2026-08-20T12:00:00.000Z"))).toBe("expired");
    expect(effectiveInvitationStatus({ status: "revoked", expires_at: "2026-08-19T12:00:00.000Z" }, new Date("2026-08-20T12:00:00.000Z"))).toBe("revoked");
  });

  it("returns to a pending invitation after account creation", () => {
    const auth = readFileSync(resolve(process.cwd(), "src/pages/Auth.tsx"), "utf8");
    expect(auth).toMatch(/navigate\(safeNext \?\? "\/onboarding\/nome"/);
  });

  it("accepts through the RPC once and keeps failures indistinguishable", async () => {
    testState.auth.user = { id: "user-1" };
    testState.rpc.mockResolvedValue({ data: { id: "member-1" }, error: null });
    renderInvitation("/convite?token=secret-token");

    fireEvent.click(screen.getByRole("button", { name: /aceitar convite/i }));

    await waitFor(() => expect(testState.rpc).toHaveBeenCalledWith(
      "accept_space_invitation",
      { token: "secret-token" },
    ));
    expect(testState.rpc).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/espaço foi adicionado/i)).toBeInTheDocument();
  });

  it("registers the invitation acceptance route", () => {
    const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toMatch(/path="\/convite"\s+element={<AcceptInvitation\s*\/>}/);
  });
});
