import LandingHeader from "@/components/LandingHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import phoneMockup from "@/assets/phone-mockup.png";

const mediaLogos = ["tecmundo", "techtudo", "exame.", "tecnoblog", "Canaltech", "GIZMODO"];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-foreground">
              Seu dinheiro sob controle,{" "}
              <br className="hidden sm:block" />
              <span className="text-primary">sem esforço</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Organize suas finanças pessoais de forma simples e inteligente. 
              Controle gastos, acompanhe investimentos e alcance seus objetivos.
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-base px-8 py-6 shadow-lg shadow-primary/25 gap-2">
                Começar agora
                <ArrowRight size={18} />
              </Button>
            </Link>

            {/* Benefit cards */}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm border border-border">
                <ShieldCheck size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Segurança</p>
                  <p className="text-xs text-muted-foreground">Dados protegidos e criptografados</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm border border-border">
                <Smartphone size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Acesso</p>
                  <p className="text-xs text-muted-foreground">Disponível em qualquer dispositivo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Illustrations */}
          <div className="relative flex items-center justify-center">
            <img
              src={heroIllustration}
              alt="Mulher relaxada gerenciando finanças"
              className="w-64 lg:w-80 z-10 relative"
            />
            <img
              src={dashboardMockup}
              alt="Dashboard financeiro"
              className="absolute -right-4 top-0 w-56 lg:w-72 rounded-2xl shadow-2xl z-20 animate-[float_6s_ease-in-out_infinite]"
            />
            <img
              src={phoneMockup}
              alt="App de finanças no celular"
              className="absolute -left-4 bottom-0 w-32 lg:w-40 rounded-2xl shadow-xl z-20 animate-[float_6s_ease-in-out_infinite_1s]"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-card border-y border-border py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-lg font-semibold text-muted-foreground mb-10">
            Na mídia, por quem confia no nosso trabalho
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
            {mediaLogos.map((name) => (
              <span
                key={name}
                className="text-xl lg:text-2xl font-bold text-muted-foreground/40 select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2026 organizze. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Index;
