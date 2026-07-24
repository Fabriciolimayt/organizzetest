import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Settings, Bell, User, MessageCircle, BarChart3, X, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import Blobs from "@/components/Blobs";
import { Progress } from "@/components/ui/progress";

const navLinks = [
  { to: "/dashboard", label: "visão geral", end: true },
  { to: "/dashboard/orcamento", label: "orçamento" },
  { to: "/dashboard/lancamentos", label: "lançamentos" },
  { to: "/dashboard/relatorios", label: "relatórios" },
  { to: "/dashboard/planos", label: "planos" },
  { to: "/dashboard/grupos", label: "grupos" },
  { to: "/dashboard/whatsapp", label: "whatsapp" },
  { to: "/dashboard/limite-de-gastos", label: "limites" },
  { to: "/dashboard/diagnostico-whatsapp", label: "diagnóstico" },
];

const DashboardLayout = () => {
  const [showBanner, setShowBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10">
        <Blobs variant="subtle" />
      </div>

      {/* Top Header — glass */}
      <header className="glass-panel sticky top-0 z-50 border-b border-[hsl(var(--glass-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-tour={`nav-${l.to.split("/").pop()}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-full transition-all ${
                    isActive
                      ? "btn-gradient text-primary-foreground font-semibold shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)]"
                      : "text-foreground/70 font-medium hover:text-foreground hover:bg-[hsl(var(--glass-highlight))]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--glass-highlight))] transition-colors hidden sm:flex">
              <Settings size={18} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--glass-highlight))] transition-colors hidden sm:flex">
              <Bell size={18} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--glass-highlight))] transition-colors">
              <User size={18} />
            </button>
            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-[hsl(var(--glass-border))] pb-2 px-4">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm rounded-md ${
                    isActive ? "text-primary font-bold" : "text-foreground/70"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Promo Banner — glass w/ gold accent */}
      {showBanner && (
        <div className="glass-panel border-b border-[hsl(var(--glass-border))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-2xl hidden sm:block">🎯</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  Agora é pra valer — <span className="text-gradient-gold">Organize seu 2026</span> com desconto especial!
                </p>
                <p className="text-xs text-muted-foreground">
                  Aproveite condições exclusivas para começar o ano no controle.
                </p>
              </div>
            </div>
            <button className="shrink-0 btn-gradient text-xs font-semibold px-4 py-2 rounded-full">
              Ativar desconto
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Status Sub-header — glass */}
      <div className="glass-panel border-b border-[hsl(var(--glass-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4 text-xs flex-wrap">
          <span className="bg-[hsl(var(--glass-highlight))] text-foreground/80 px-2 py-0.5 rounded-full font-medium border border-[hsl(var(--glass-border))]">
            Teste grátis
          </span>
          <span className="text-muted-foreground">Plano manual</span>
          <span className="text-foreground/80 font-medium">7 dias restantes</span>
          <div className="w-24">
            <Progress value={70} className="h-1.5 bg-[hsl(var(--glass-bg))] [&>div]:bg-gradient-to-r [&>div]:from-[hsl(var(--gold))] [&>div]:to-[hsl(var(--primary-glow))]" />
          </div>
          <Link to="/planos" className="text-primary-glow font-medium hover:underline ml-auto">
            Ver planos
          </Link>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative">
        <Outlet />
      </main>

      {/* Floating Buttons — glass */}
      <button
        data-tour="help"
        onClick={() => window.dispatchEvent(new CustomEvent("organizze:start-tour"))}
        aria-label="Reiniciar tutorial"
        className="glass fixed bottom-6 left-6 w-12 h-12 rounded-full flex items-center justify-center hover:glow-primary transition-shadow z-40"
      >
        <MessageCircle size={20} className="text-primary-glow" />
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("organizze:start-tour"))}
        className="btn-gradient fixed bottom-6 right-6 px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold z-40"
      >
        <BarChart3 size={16} />
        Primeiros passos
      </button>
    </div>
  );
};

export default DashboardLayout;
