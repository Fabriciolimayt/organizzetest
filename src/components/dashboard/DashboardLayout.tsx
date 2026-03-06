import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Settings, Bell, User, MessageCircle, BarChart3, X, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import { Progress } from "@/components/ui/progress";

const navLinks = [
  { to: "/dashboard", label: "visão geral", end: true },
  { to: "/dashboard/lancamentos", label: "lançamentos" },
  { to: "/dashboard/relatorios", label: "relatórios" },
  { to: "/dashboard/limite-de-gastos", label: "limite de gastos" },
  { to: "/dashboard/conexao-bancaria", label: "conexão bancária" },
];

const DashboardLayout = () => {
  const [showBanner, setShowBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Top Header */}
      <header className="bg-primary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo white />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? "text-primary-foreground font-bold"
                      : "text-primary-foreground/80 font-medium hover:text-primary-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="text-primary-foreground/80 hover:text-primary-foreground transition-colors hidden sm:block">
              <Settings size={20} />
            </button>
            <button className="text-primary-foreground/80 hover:text-primary-foreground transition-colors hidden sm:block">
              <Bell size={20} />
            </button>
            <button className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <User size={20} />
            </button>
            <button
              className="md:hidden text-primary-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-primary-foreground/20 pb-2 px-4">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm rounded-md ${
                    isActive
                      ? "text-primary-foreground font-bold"
                      : "text-primary-foreground/80"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Promo Banner */}
      {showBanner && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-2xl hidden sm:block">🎯</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  Agora é pra valer — Organize seu 2026 com desconto especial!
                </p>
                <p className="text-xs text-muted-foreground">
                  Aproveite condições exclusivas para começar o ano no controle.
                </p>
              </div>
            </div>
            <button className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors">
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

      {/* Status Sub-header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4 text-xs flex-wrap">
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
            Teste grátis
          </span>
          <span className="text-muted-foreground">Plano manual</span>
          <span className="text-muted-foreground font-medium">7 dias restantes</span>
          <div className="w-24">
            <Progress value={70} className="h-1.5 bg-muted [&>div]:bg-amber-400" />
          </div>
          <Link to="/planos" className="text-primary font-medium hover:underline ml-auto">
            Ver planos
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Floating Buttons */}
      <button className="fixed bottom-6 left-6 w-12 h-12 bg-card rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow border border-border z-40">
        <MessageCircle size={20} className="text-primary" />
      </button>
      <button className="fixed bottom-6 right-6 bg-foreground text-primary-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity z-40">
        <BarChart3 size={16} />
        Primeiros passos
      </button>
    </div>
  );
};

export default DashboardLayout;
