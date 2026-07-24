import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Conexão Bancária", href: "#" },
  { label: "Quem somos", href: "#" },
  { label: "Recursos", href: "#" },
  { label: "Planos", href: "#" },
  { label: "Blog", href: "#" },
];

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50 glass-panel border-b border-[hsl(var(--glass-border))]">
      <div className="max-w-7xl mx-auto py-3 px-6 lg:px-12 flex items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-[hsl(var(--glass-highlight))] px-3 py-1.5 rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/signup" className="text-sm font-medium text-foreground/80 hover:text-primary-glow transition-colors">
            Login
          </Link>
          <Link to="/signup">
            <Button>Comece já!</Button>
          </Link>
        </div>

        <button className="lg:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden pb-4 px-6 flex flex-col gap-3 border-t border-[hsl(var(--glass-border))]">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-foreground/80 pt-2">
              {link.label}
            </a>
          ))}
          <Link to="/signup" className="text-sm font-medium text-foreground">Login</Link>
          <Link to="/signup"><Button className="w-full">Comece já!</Button></Link>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
