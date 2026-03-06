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
    <header className="w-full py-4 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo />
        
        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/signup" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Login
          </Link>
          <Link to="/signup">
            <Button>Comece já!</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden mt-4 pb-4 flex flex-col gap-4 px-2">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground">
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
