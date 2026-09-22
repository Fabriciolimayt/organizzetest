import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import Logo from "@/components/Logo";
import InputField from "@/components/InputField";
import SocialLoginButton from "@/components/SocialLoginButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PUBLIC_SITE_URL } from "@/lib/public-site";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import "./auth-paper.css";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const signupSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});
const loginSchema = signupSchema;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const Auth = ({ initialMode = "login" }: { initialMode?: "login" | "signup" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const nextParam = new URLSearchParams(location.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const from = safeNext || (location.state as { from?: string } | null)?.from || "/dashboard";

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === "signup" ? signupSchema : loginSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Verifica os dados", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}${from}` },
        });
        if (error) throw error;
        try {
          localStorage.setItem("organizze.firstRun", "1");
          localStorage.removeItem("organizze.tourCompleted");
        } catch {
          // Onboarding continues when browser storage is unavailable.
        }
        toast({ title: "Conta criada", description: "Bem-vindo!" });
        navigate(safeNext ?? "/onboarding/nome", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast({ title: "Erro", description: getErrorMessage(err) || "Algo falhou", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}${from}` });
      if (res.error) throw res.error;
    } catch (err: unknown) {
      toast({ title: "Erro Google", description: getErrorMessage(err) || "Algo falhou", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-paper entry-editorial">
      <picture className="auth-paper__art">
        <source media="(max-width: 899px)" srcSet="/images/auth/organizze-ledger-mobile.webp" />
        <img src="/images/auth/organizze-ledger.webp" width="1600" height="900" alt="" {...{ fetchpriority: "high" }} />
      </picture>

      <header className="auth-paper__header">
        <a href={PUBLIC_SITE_URL} rel="noreferrer" className="auth-paper__brand" aria-label="Organizze: página inicial"><Logo white /></a>
        <a href={PUBLIC_SITE_URL} rel="noreferrer" className="auth-paper__back" aria-label="Voltar ao início" title="Voltar ao início"><ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao início</span></a>
      </header>

      <main className="auth-paper__main">
        <div className="auth-paper__form-wrap">
          <div className="auth-paper__intro">
            <p className="auth-paper__eyebrow">O teu espaço financeiro</p>
            <h1>{mode === "signup" ? "O teu mês começa aqui." : "Continua de onde paraste."}</h1>
            <p className="auth-paper__description">
              {mode === "signup" ? "Cria a tua conta. Dá um lugar a cada despesa." : "Todas as despesas. Um mês mais claro."}
            </p>
          </div>

          <form className="auth-paper__form" onSubmit={handleSubmit} aria-label={mode === "signup" ? "Criar conta" : "Entrar"} aria-busy={busy}>
            <InputField label="E-mail" type="email" name="email" autoComplete="email" placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="auth-paper__password">
              <InputField id="auth-password" label="Senha" name="password" type={passwordVisible ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="8 caracteres ou mais" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="auth-paper__visibility" aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"} aria-controls="auth-password" aria-pressed={passwordVisible} title={passwordVisible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            <Button type="submit" disabled={busy} size="lg" className="auth-paper__submit">
              {busy ? <><LoaderCircle className="auth-paper__spinner" aria-hidden="true" /> A processar...</> : <>{mode === "signup" ? "Criar conta" : "Entrar"}<ArrowRight aria-hidden="true" /></>}
            </Button>
          </form>

          <div className="auth-paper__divider"><span />ou continua com<span /></div>
          <div className="auth-paper__social">
            <SocialLoginButton type="button" icon={<GoogleIcon />} onClick={handleGoogle} disabled={busy}>Continuar com Google</SocialLoginButton>
          </div>

          <p className="auth-paper__switch">
            {mode === "signup" ? "Já tens conta? " : "Ainda não tens conta? "}
            <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Entrar" : "Criar conta"}</button>
          </p>
        </div>
      </main>

      <footer className="auth-paper__footer"><LockKeyhole size={14} aria-hidden="true" /><span>Privado por espaço financeiro</span></footer>
    </div>
  );
};

export default Auth;
