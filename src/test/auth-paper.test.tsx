import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  useAuth: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithPassword: mocks.signInWithPassword, signUp: mocks.signUp } },
}));
vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: mocks.signInWithOAuth } },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast }));

import Auth from "@/pages/Auth";

const email = "person@example.com";
const password = " secure-password ";
const firstRunKey = "organizze.firstRun";
const tourKey = "organizze.tourCompleted";
const invitationKey = "organizze.pendingInvitationToken";
const modeNames = { login: "Entrar", signup: "Criar conta" };
type Mode = keyof typeof modeNames;
type AuthEntry = { search?: string; from?: string; pathname?: string };

function RouterLocation() {
  const location = useLocation();
  const navigationType = useNavigationType();
  return (
    <output aria-label="Current location" data-navigation-type={navigationType}>
      {location.pathname}{location.search}{location.hash}
    </output>
  );
}

function AuthHarness({ search = "", from, pathname = "/auth" }: AuthEntry) {
  return (
    <MemoryRouter
      initialEntries={[{ pathname, search, state: from ? { from } : null }]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RouterLocation />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Auth initialMode="signup" />} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>
  );
}

const renderAuth = (entry: AuthEntry = {}) => render(<AuthHarness {...entry} />);
const currentLocation = () => screen.getByRole("status", { name: "Current location" });
const googleButton = () => screen.getByRole("button", { name: "Continuar com Google" });

function fillCredentials(nextEmail = email, nextPassword = password) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: nextEmail } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: nextPassword } });
}

function submit(mode: Mode = "login") {
  fireEvent.click(within(screen.getByRole("form", { name: modeNames[mode] }))
    .getByRole("button", { name: modeNames[mode] }));
}

function expectNoAuthCalls() {
  expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  expect(mocks.signUp).not.toHaveBeenCalled();
  expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.signUp.mockResolvedValue({ error: null });
  mocks.signInWithOAuth.mockResolvedValue({ error: null });
  mocks.useAuth.mockReturnValue({ session: null });
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request in Auth test"); }));
});

afterEach(() => {
  cleanup();
  const fetch = globalThis.fetch;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
  expect(fetch).not.toHaveBeenCalled();
});

describe("Auth paper credentials", () => {
  it("opens the landing signup destination in account creation mode", async () => {
    renderAuth({ pathname: "/signup", search: "?next=%2Fconvite" });
    expect(screen.getByRole("heading", { name: "O teu mês começa aqui." })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "new-password");
    expectNoAuthCalls();
    fillCredentials();
    submit("signup");
    await waitFor(() => expect(currentLocation()).toHaveTextContent(/^\/convite$/));
    expect(mocks.signUp).toHaveBeenCalledExactlyOnceWith({
      email, password, options: { emailRedirectTo: `${window.location.origin}/convite` },
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("logs in with a trimmed email and unchanged password, then redirects only when a session arrives", async () => {
    localStorage.setItem(tourKey, "1");
    const { rerender } = renderAuth();
    fillCredentials(`  ${email}  `);
    submit();

    await waitFor(() => expect(screen.getByRole("form", { name: "Entrar" })).toHaveAttribute("aria-busy", "false"));
    expect(mocks.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email, password });
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(currentLocation()).toHaveTextContent(/^\/auth$/);
    expect(localStorage.getItem(firstRunKey)).toBeNull();
    expect(localStorage.getItem(tourKey)).toBe("1");

    mocks.useAuth.mockReturnValue({ session: { user: { id: "user-1" } } });
    rerender(<AuthHarness />);

    await waitFor(() => expect(currentLocation()).toHaveTextContent(/^\/dashboard$/));
    expect(currentLocation()).toHaveAttribute("data-navigation-type", "REPLACE");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  describe.each<Mode>(["login", "signup"])("%s validation", (mode) => {
    it.each([
      { label: "empty credentials", email: "", password: "" },
      { label: "invalid email", email: "not-an-email", password },
      { label: "overlong email", email: `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(59)}.com`, password },
      { label: "short password", email, password: "1234567" },
      { label: "overlong password", email, password: "x".repeat(73) },
    ])("rejects $label without calling an SDK", (credentials) => {
      renderAuth();
      if (mode === "signup") fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
      fillCredentials(credentials.email, credentials.password);

      // Submit directly to exercise Zod even when native email/required validation would block the button.
      fireEvent.submit(screen.getByRole("form", { name: modeNames[mode] }));

      expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
        title: "Verifica os dados",
        description: expect.any(String),
        variant: "destructive",
      });
      expectNoAuthCalls();
      expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "false");
      expect(screen.getByRole("button", { name: modeNames[mode] })).toBeEnabled();
      expect(currentLocation()).toHaveTextContent(/^\/auth$/);
      expect(localStorage.getItem(firstRunKey)).toBeNull();
    });
  });
});

const destinations = [
  { label: "default dashboard", entry: {}, destination: "/dashboard", signupDestination: "/onboarding/nome" },
  { label: "protected-route state", entry: { from: "/dashboard/contas" }, destination: "/dashboard/contas", signupDestination: "/onboarding/nome" },
  { label: "safe invitation next before route state", entry: { search: "?next=%2Fconvite", from: "/dashboard/contas" }, destination: "/convite", signupDestination: "/convite" },
  { label: "local next with query and fragment", entry: { search: `?next=${encodeURIComponent("/convite?source=email#aceitar")}` }, destination: "/convite?source=email#aceitar", signupDestination: "/convite?source=email#aceitar" },
  { label: "rejected protocol-relative next", entry: { search: "?next=%2F%2Fevil.example%2Fconvite" }, destination: "/dashboard", signupDestination: "/onboarding/nome" },
  { label: "route state after rejecting protocol-relative next", entry: { search: "?next=%2F%2Fevil.example", from: "/dashboard/contas" }, destination: "/dashboard/contas", signupDestination: "/onboarding/nome" },
  { label: "rejected absolute next", entry: { search: `?next=${encodeURIComponent("https://evil.example/convite")}` }, destination: "/dashboard", signupDestination: "/onboarding/nome" },
];

describe("Auth paper redirects", () => {
  it.each(destinations)("preserves signup callback, flags and navigation for $label", async ({ entry, destination, signupDestination }) => {
    localStorage.setItem(firstRunKey, "0");
    localStorage.setItem(tourKey, "1");
    localStorage.setItem(`${tourKey}:other-user`, "1");
    sessionStorage.setItem(invitationKey, "pending-invitation-token");
    renderAuth(entry);
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    fillCredentials(`  ${email}  `);
    submit("signup");

    await waitFor(() => expect(currentLocation().textContent).toBe(signupDestination));
    expect(mocks.signUp).toHaveBeenCalledExactlyOnceWith({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${destination}` },
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({ title: "Conta criada", description: "Bem-vindo!" });
    expect(localStorage.getItem(firstRunKey)).toBe("1");
    expect(localStorage.getItem(tourKey)).toBeNull();
    expect(localStorage.getItem(`${tourKey}:other-user`)).toBe("1");
    expect(sessionStorage.getItem(invitationKey)).toBe("pending-invitation-token");
    expect(currentLocation()).toHaveAttribute("data-navigation-type", "REPLACE");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("still completes signup when browser storage is unavailable", async () => {
    renderAuth();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    fillCredentials();
    submit("signup");

    await waitFor(() => expect(currentLocation()).toHaveTextContent(/^\/onboarding\/nome$/));
    expect(mocks.signUp).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({ title: "Conta criada", description: "Bem-vindo!" });
  });

  it.each(destinations)("replaces Auth with $label for an existing session", async ({ entry, destination }) => {
    mocks.useAuth.mockReturnValue({ session: { user: { id: "user-1" } } });
    renderAuth(entry);

    await waitFor(() => expect(currentLocation().textContent).toBe(destination));
    expect(currentLocation()).toHaveAttribute("data-navigation-type", "REPLACE");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expectNoAuthCalls();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it.each(destinations)("uses the correct Google callback for $label without submitting credentials", async ({ entry, destination }) => {
    renderAuth(entry);
    fireEvent.click(googleButton());

    await waitFor(() => expect(googleButton()).toBeEnabled());
    expect(mocks.signInWithOAuth).toHaveBeenCalledExactlyOnceWith("google", {
      redirect_uri: `${window.location.origin}${destination}`,
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "false");
    expect(currentLocation().textContent).toBe(`/auth${entry.search ?? ""}`);
    expect(localStorage.getItem(firstRunKey)).toBeNull();
  });
});

describe.each([
  { method: "login", sdk: mocks.signInWithPassword, errorTitle: "Erro" },
  { method: "signup", sdk: mocks.signUp, errorTitle: "Erro" },
  { method: "google", sdk: mocks.signInWithOAuth, errorTitle: "Erro Google" },
] as const)("Auth paper $method busy/error state", ({ method, sdk, errorTitle }) => {
  it.each(["returned", "rejected"] as const)("blocks duplicate button requests and recovers from a %s error", async (failure) => {
    const request = deferred<{ error: Error | null }>();
    sdk.mockReturnValueOnce(request.promise);
    localStorage.setItem(tourKey, "1");
    renderAuth();
    if (method === "signup") fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    fillCredentials();
    if (method === "google") fireEvent.click(googleButton());
    else submit(method);

    const form = screen.getByRole("form");
    const pendingButton = screen.getByRole("button", { name: "A processar..." });
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(pendingButton).toBeDisabled();
    expect(googleButton()).toBeDisabled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(localStorage.getItem(firstRunKey)).toBeNull();
    expect(localStorage.getItem(tourKey)).toBe("1");
    fireEvent.click(pendingButton);
    fireEvent.click(googleButton());
    expect(sdk).toHaveBeenCalledTimes(1);
    for (const other of [mocks.signInWithPassword, mocks.signUp, mocks.signInWithOAuth]) {
      if (other !== sdk) expect(other).not.toHaveBeenCalled();
    }

    const error = new Error("Authentication failed");
    await act(async () => {
      if (failure === "returned") request.resolve({ error });
      else request.reject(error);
    });

    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
      title: errorTitle,
      description: error.message,
      variant: "destructive",
    });
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(within(form).getByRole("button", { name: method === "signup" ? "Criar conta" : "Entrar" })).toBeEnabled();
    expect(googleButton()).toBeEnabled();
    expect(screen.getByLabelText("E-mail")).toHaveValue(email);
    expect(screen.getByLabelText("Senha")).toHaveValue(password);
    expect(currentLocation()).toHaveTextContent(/^\/auth$/);
    expect(localStorage.getItem(firstRunKey)).toBeNull();
    expect(localStorage.getItem(tourKey)).toBe("1");

    if (method === "google") fireEvent.click(googleButton());
    else submit(method);
    await waitFor(() => {
      if (method === "signup") expect(currentLocation()).toHaveTextContent(/^\/onboarding\/nome$/);
      else expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "false");
    });
    expect(sdk).toHaveBeenCalledTimes(2);
    expect(mocks.toast).toHaveBeenCalledTimes(method === "signup" ? 2 : 1);
  });
});

describe("Auth paper form controls", () => {
  it("retains both values across mode switches and selects the matching password autocomplete", async () => {
    renderAuth();
    fillCredentials();
    const emailInput = screen.getByLabelText("E-mail");
    const passwordInput = screen.getByLabelText("Senha");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("name", "email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(emailInput).toBeRequired();
    expect(passwordInput).toHaveAttribute("name", "password");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    expect(passwordInput).toBeRequired();

    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByRole("form", { name: "Criar conta" })).toBeInTheDocument();
    expect(emailInput).toHaveValue(email);
    expect(passwordInput).toHaveValue(password);
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    expectNoAuthCalls();

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("form", { name: "Entrar" })).toBeInTheDocument();
    expect(emailInput).toHaveValue(email);
    expect(passwordInput).toHaveValue(password);
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    expectNoAuthCalls();
    submit();
    await waitFor(() => expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "false"));
    expect(mocks.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email, password });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it.each<Mode>(["login", "signup"])("toggles password visibility accessibly in %s without submitting or changing its value", (mode) => {
    renderAuth();
    if (mode === "signup") fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    fillCredentials();
    const input = screen.getByLabelText("Senha");
    const toggle = screen.getByRole("button", { name: "Mostrar senha" });
    const autocomplete = mode === "signup" ? "new-password" : "current-password";
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle).toHaveAttribute("aria-controls", input.id);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBe(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("autocomplete", autocomplete);
    expect(input).toHaveValue(password);
    expectNoAuthCalls();

    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName("Mostrar senha");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", autocomplete);
    expect(input).toHaveValue(password);
    expectNoAuthCalls();
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
