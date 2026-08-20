import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Método", href: "#metodo" },
  { label: "WhatsApp", href: "#whatsapp" },
  { label: "Privacidade", href: "#privacidade" },
];

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/15 bg-ink text-white">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between px-6 lg:px-16">
        <Logo white />

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="focus-ring px-3 py-2 font-mono text-[10px] font-semibold uppercase text-white/55 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-white/65 transition-colors hover:text-white">
            Entrar
          </Link>
          <Link to="/auth">
            <Button className="border-marker !bg-marker !text-foreground shadow-none hover:!bg-marker/90">Começar</Button>
          </Link>
        </div>

        <button type="button" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} className="focus-ring flex size-11 items-center justify-center text-white lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-3 border-t border-white/15 bg-ink px-6 pb-5 lg:hidden">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="pt-3 font-mono text-xs font-semibold uppercase text-white/65">
              {link.label}
            </a>
          ))}
          <Link to="/auth" className="py-1 text-sm font-medium text-white">Entrar</Link>
          <Link to="/auth"><Button className="w-full border-marker !bg-marker !text-foreground shadow-none">Começar</Button></Link>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
