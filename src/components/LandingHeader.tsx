import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { LandingCopy } from "./landing/landingCopy";
import Logo from "./Logo";
import { Button } from "./ui/button";

type LandingHeaderProps = {
  copy?: LandingCopy;
};

const LandingHeader = ({ copy }: LandingHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);
  const navLinks = copy
    ? [
        { label: copy.header.method, href: "#month" },
        { label: copy.header.whatsapp, href: "#whatsapp" },
        { label: copy.header.plans, href: "#plans" },
      ]
    : [
        { label: "Método", href: "#metodo" },
        { label: "WhatsApp", href: "#whatsapp" },
        { label: "Privacidade", href: "#privacidade" },
      ];
  const signInLabel = copy?.header.signIn ?? "Entrar";
  const primaryCta = copy?.primaryCta ?? "Começar";

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = mobileOpen;

    if (mobileOpen) {
      mobileNavRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    } else if (wasOpen) {
      menuTriggerRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="reference-header sticky top-0 z-50 w-full text-foreground">
      <div className="mx-auto flex min-h-[68px] max-w-[1120px] items-center justify-between px-6 sm:px-10">
        <Logo white />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação pública">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="focus-ring flex min-h-11 items-center px-3 font-mono text-label uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/auth" className="focus-ring flex min-h-11 items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {signInLabel}
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">{primaryCta}</Link>
          </Button>
        </div>

        <button ref={menuTriggerRef} type="button" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} aria-controls="landing-mobile-menu" className="focus-ring flex size-11 items-center justify-center text-foreground lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav ref={mobileNavRef} id="landing-mobile-menu" aria-label="Menu público" className="flex flex-col gap-1 border-t border-border bg-background px-6 pb-5 lg:hidden">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="focus-ring flex min-h-11 items-center font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {link.label}
            </a>
          ))}
          <Link to="/auth" onClick={() => setMobileOpen(false)} className="focus-ring flex min-h-11 items-center text-sm font-medium text-foreground">{signInLabel}</Link>
          <Button asChild className="w-full">
            <Link to="/auth" onClick={() => setMobileOpen(false)}>{primaryCta}</Link>
          </Button>
        </nav>
      )}
    </header>
  );
};

export default LandingHeader;
