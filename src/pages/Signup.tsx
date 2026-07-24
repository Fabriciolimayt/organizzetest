import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Blobs from "@/components/Blobs";
import InputField from "@/components/InputField";
import SocialLoginButton from "@/components/SocialLoginButton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Signup = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Blobs variant="hero" />
      </div>

      <div className="w-full max-w-md glass-card p-8 flex flex-col items-center gap-6 relative">
        <Logo />
        <div className="text-center">
          <h1 className="font-serif text-3xl font-normal text-foreground tracking-tight">
            Crie sua conta <span className="text-gradient-gold">como quiser</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Comece o seu plano em menos de um minuto.</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <SocialLoginButton icon={<FacebookIcon />}>
            Criar conta usando o Facebook
          </SocialLoginButton>
          <SocialLoginButton icon={<GoogleIcon />}>
            Criar conta usando o Google
          </SocialLoginButton>
        </div>

        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-[hsl(var(--glass-border))]" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-[hsl(var(--glass-border))]" />
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (agreed) navigate("/onboarding/nome"); }}>
          <InputField label="Seu e-mail" type="email" placeholder="seuemail@exemplo.com" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Senha" type="password" placeholder="••••••••" />
            <InputField label="Repetir senha" type="password" placeholder="••••••••" />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              Li e concordo com os{" "}
              <a href="#" className="text-primary-glow hover:underline">termos de uso</a>.
            </span>
          </label>

          <Button disabled={!agreed} size="lg" className="w-full">
            Começar a usar
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Já sou cadastrado.{" "}
          <Link to="/" className="text-primary-glow hover:underline font-medium">
            Quero fazer login!
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
