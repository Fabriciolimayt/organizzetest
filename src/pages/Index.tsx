import LandingHeader from "@/components/LandingHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Users,
  Layers,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const problems = [
  {
    icon: "📊",
    title: "A planilha que você abandonou",
    desc: "Começou em janeiro. Abriu duas vezes. Tá perdida em algum lugar do seu desktop.",
  },
  {
    icon: "🔄",
    title: "A armadilha do 'mês que vem'",
    desc: "Todo mês a mesma promessa. O próximo mês nunca chega com um plano de verdade.",
  },
  {
    icon: "👁️",
    title: "Gasto cego",
    desc: "O saldo do banco não te diz nada sobre o que você realmente pode gastar.",
  },
];

const steps = [
  {
    n: "01",
    icon: "💰",
    title: "Defina sua renda",
    desc: "Informe quanto entra todo mês. Salário, freelas, tudo.",
    sample: "R$ 5.400 / mês",
  },
  {
    n: "02",
    icon: "📊",
    title: "Escolha sua divisão",
    desc: "Use 50/30/20 ou ajuste as porcentagens do jeito que faz sentido pra você.",
    sample: "50% essencial · 30% lazer · 20% poupança",
  },
  {
    n: "03",
    icon: "📱",
    title: "Registre os gastos",
    desc: "Pelo app ou pelo WhatsApp. Veja o progresso em tempo real.",
    sample: "Mercado R$ 320 · Uber R$ 18 · Netflix R$ 39",
  },
];

const features = [
  { tag: "50/30/20", icon: <BarChart3 size={18} />, title: "Orçamento inteligente", desc: "Defina sua renda, escolha um modelo e veja como dividir entre todas as suas categorias." },
  { tag: "Tempo real", icon: <Zap size={18} />, title: "Controle de gastos", desc: "Vermelho quando passou do limite. Verde quando tá no controle. Simples assim." },
  { tag: "WhatsApp", icon: <MessageCircle size={18} />, title: "Lançamento por WhatsApp", desc: "Manda foto do recibo ou texto rápido. A despesa é registrada sem abrir o app." },
  { tag: "Família", icon: <Users size={18} />, title: "Grupos compartilhados", desc: "Divida o orçamento com seu parceiro ou família. Todo mundo vê o mesmo plano." },
  { tag: "Cenários", icon: <Layers size={18} />, title: "Múltiplos planos", desc: "Mês normal, mês de viagem, modo poupança. Crie cenários e alterne na hora." },
  { tag: "Seguro", icon: <ShieldCheck size={18} />, title: "Seguro por padrão", desc: "Seus dados financeiros são criptografados. Só você pode ver. Sempre." },
];

const plans = [
  {
    badge: "Pra quem tá começando",
    name: "Grátis",
    price: "R$ 0",
    period: "para sempre",
    cta: "Criar conta grátis",
    highlighted: false,
    features: ["Dashboard completo", "7 categorias de orçamento", "2 planos de orçamento", "1 grupo familiar"],
  },
  {
    badge: "Mais popular",
    name: "Mensal",
    price: "R$ 14,90",
    period: "/mês",
    cta: "Iniciar teste de 30 dias",
    highlighted: true,
    features: ["Tudo do Grátis, e mais:", "📱 Lançamento por WhatsApp", "📊 Planos ilimitados", "👥 Grupos ilimitados", "📅 Relatório mensal no dia 25"],
  },
  {
    badge: "Melhor custo-benefício",
    name: "Anual",
    price: "R$ 149,90",
    period: "/ano",
    cta: "Iniciar teste de 30 dias",
    highlighted: false,
    features: ["Tudo do Grátis, e mais:", "📱 Lançamento por WhatsApp", "📊 Planos ilimitados", "👥 Grupos ilimitados", "💰 Economize R$ 28,90/ano"],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-20 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-7">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pare de adivinhar para onde vai seu dinheiro
            </span>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.05] text-foreground tracking-tight">
              Você sabe que tá gastando demais.{" "}
              <span className="text-primary">Você só não sabe onde.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              O <strong className="text-foreground">organizze</strong> é seu planejador de orçamento mensal.
              Defina sua renda, divida em categorias, acompanhe o que você realmente gasta —
              e receba um relatório no WhatsApp todo dia 25.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link to="/signup">
                <Button size="lg" className="text-base px-7 py-6 shadow-lg shadow-primary/25 gap-2">
                  Criar conta grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="ghost" className="text-base px-6 py-6">
                  Veja como funciona
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Sem cartão de crédito · 30 dias de teste grátis
            </p>
          </div>

          {/* WhatsApp mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-[#0b141a] rounded-[2.5rem] p-3 shadow-2xl border-8 border-foreground/90">
              <div className="bg-[#075e54] rounded-t-[1.8rem] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">o</div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">organizze</p>
                  <p className="text-white/70 text-xs">● online</p>
                </div>
              </div>
              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] px-3 py-4 space-y-3 min-h-[420px]">
                <div className="text-center">
                  <span className="text-[10px] bg-white/80 px-2 py-1 rounded text-muted-foreground">Hoje</span>
                </div>
                <div className="ml-auto bg-[#dcf8c6] rounded-lg px-3 py-2 text-sm max-w-[80%] shadow-sm">
                  Gastei R$ 45 no mercado 🛒
                  <span className="block text-[10px] text-muted-foreground text-right mt-0.5">14:32 ✓✓</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm">
                  <p className="text-primary text-xs font-semibold mb-1">✦ organizze</p>
                  <p className="font-medium">✅ Despesa registrada!</p>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span>🛒 Alimentação</span><span className="font-semibold">R$ 45</span>
                  </div>
                  <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 rounded px-2 py-1">
                    ⚠️ R$ 298 de R$ 320 gastos
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] bg-white/80 px-2 py-1 rounded text-muted-foreground">25 de Janeiro</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm">
                  <p className="text-primary text-xs font-semibold mb-1">✦ organizze</p>
                  <p className="font-medium mb-2">📊 Relatório de Janeiro</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>💰 Renda</span><span className="font-semibold">R$ 5.400</span></div>
                    <div className="flex justify-between"><span>💸 Gasto</span><span className="font-semibold text-destructive">R$ 4.625</span></div>
                    <div className="flex justify-between"><span>🎯 Poupado</span><span className="font-semibold text-primary">R$ 775</span></div>
                  </div>
                  <p className="text-[11px] mt-2 text-primary">No caminho certo 🎉</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute -left-4 top-12 bg-card border border-border rounded-full px-4 py-2 text-xs font-medium shadow-lg animate-[float_6s_ease-in-out_infinite]">
              📅 Relatório no dia 25
            </div>
            <div className="hidden md:block absolute -left-2 bottom-20 bg-card border border-border rounded-full px-4 py-2 text-xs font-medium shadow-lg animate-[float_6s_ease-in-out_infinite_1.5s]">
              📷 Foto do recibo → despesa
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-card border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">A conversa que você não quer ter</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-10">
            "Cadê o dinheiro que entrou esse mês?"
          </h2>

          <div className="space-y-3 mb-10 max-w-xl">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">P</div>
              <div className="bg-background rounded-2xl rounded-tl-none px-4 py-2.5 text-sm">A gente disse que ia poupar R$ 800 esse mês. O que aconteceu?</div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">T</div>
              <div className="bg-primary/10 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm">Sei lá... umas contas, mercado, saímos um par de vezes...</div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">P</div>
              <div className="bg-background rounded-2xl rounded-tl-none px-4 py-2.5 text-sm">Igual ao mês passado. E o anterior.</div>
            </div>
          </div>

          <p className="text-base text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Você não é ruim com dinheiro. Você só nunca teve um sistema. Sem um plano, os gastos
            silenciosamente se expandem para preencher cada real que você ganha — e você só
            percebe quando já é tarde.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div key={p.title} className="bg-background rounded-2xl p-6 border border-border">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Sistema simples</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            Configure uma vez. Depois é só viver.
          </h2>
          <p className="text-muted-foreground mb-12">Três minutos no início do mês. Só isso.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="text-5xl font-extrabold text-primary/20 mb-2">{s.n}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.desc}</p>
                <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium inline-block">
                  {s.sample}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CALLOUT */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <MessageCircle size={40} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl lg:text-3xl font-extrabold mb-3">
            Lance gastos direto do WhatsApp
          </h2>
          <p className="opacity-90 max-w-2xl mx-auto mb-6">
            Manda "Gastei R$ 45 no mercado" no WhatsApp. A despesa é registrada na hora.
            Todo dia 25, você recebe o resumo completo do mês.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Testar grátis <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Recursos</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            Tudo que você precisa. Nada que você não precisa.
          </h2>
          <p className="text-muted-foreground mb-12">Feito pra quem quer um orçamento que realmente funciona.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary">{f.icon}</span>
                  <span className="text-xs font-semibold uppercase text-primary tracking-wider">{f.tag}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-card border-y border-border py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Quem usa, recomenda</p>
          <blockquote className="text-2xl lg:text-3xl font-semibold leading-snug text-foreground mb-8">
            "Finalmente sei pra onde vai meu dinheiro. O recurso do WhatsApp mudou o jogo —
            mando uma mensagem e tá feito."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">M</div>
            <div className="text-left">
              <p className="font-semibold text-sm">Marina S.</p>
              <p className="text-xs text-muted-foreground">São Paulo, Brasil</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3 text-center">Planos</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 text-center">
            Simples. Justo. Sem surpresas.
          </h2>
          <p className="text-muted-foreground text-center mb-12">Cancele quando quiser. Sem taxas escondidas.</p>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border flex flex-col ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 md:-translate-y-4"
                    : "bg-card border-border"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${plan.highlighted ? "opacity-90" : "text-primary"}`}>
                  {plan.badge}
                </p>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 my-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className={`mt-0.5 shrink-0 ${plan.highlighted ? "" : "text-primary"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "secondary" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            A próxima briga sobre dinheiro <span className="text-primary">não precisa acontecer.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Comece com um plano. Saiba pra onde vai seu dinheiro. Poupe de verdade.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-8 py-6 shadow-lg shadow-primary/25">
                Criar conta grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Sem compromisso · Cancele quando quiser · 30 dias grátis
          </p>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2026 organizze. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Index;
