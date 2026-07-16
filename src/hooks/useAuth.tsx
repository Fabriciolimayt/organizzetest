import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { session: Session | null; user: User | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true });

const FIRSTRUN_KEY = "organizze.firstRun";
const COMPLETED_KEY = "organizze.tourCompleted";
const LAST_USER_KEY = "organizze.lastUserId";

/** Detects a "brand new" user: created_at ≈ last_sign_in_at (within 60s). */
function markFirstRunIfNew(user: User | null) {
  if (!user) return;
  try {
    const created = user.created_at ? new Date(user.created_at).getTime() : 0;
    const lastSignIn = (user as any).last_sign_in_at
      ? new Date((user as any).last_sign_in_at).getTime()
      : created;
    const isNew = created && Math.abs(lastSignIn - created) < 60_000;
    const prevUser = localStorage.getItem(LAST_USER_KEY);
    const userChanged = prevUser !== user.id;

    if (isNew || userChanged) {
      // Fresh signup OR different user on this device → force tour again.
      if (!localStorage.getItem(COMPLETED_KEY + ":" + user.id)) {
        localStorage.setItem(FIRSTRUN_KEY, "1");
      }
    }
    localStorage.setItem(LAST_USER_KEY, user.id);
  } catch {}
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      markFirstRunIfNew(s?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      markFirstRunIfNew(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ session, user: session?.user ?? null, loading }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
