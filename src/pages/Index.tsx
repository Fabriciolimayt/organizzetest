import LandingHeader from "@/components/LandingHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Zap, Users, Layers, BarChart3, MessageCircle } from "lucide-react";

// Custom 3D and Modern Styles injected
const modernStyles = `
  .perspective-1000 { perspective: 1500px; }
  .preserve-3d { transform-style: preserve-3d; }
  .tilt-card { transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1); transform: rotateY(-12deg) rotateX(4deg); }
  .tilt-card:hover { transform: rotateY(0deg) rotateX(0deg) scale(1.02); }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .glow-text {
    text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
  }
  
  .floating { animation: floating 6s ease-in-out infinite; }
  .floating-delayed { animation: floating 6s ease-in-out 1.5s infinite; }
  
  @keyframes floating {
    0% { transform: translateY(0px) translateZ(40px); }
    50% { transform: translateY(-15px) translateZ(60px); }
    100% { transform: translateY(0px) translateZ(40px); }
  }
  
  .gradient-bg {
    background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15), transparent 60%),
                radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.1), transparent 40%),
                #08090c;
  }
  
  .bento-card {
    transition: all 0.3s ease;
    transform: translateZ(20px);
  }
  .bento-card:hover {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.25);
  }

  /* 3D Logo Animation */
  .logo-3d-spin {
    animation: spin-3d 8s linear infinite;
    transform-style: preserve-3d;
  }
  @keyframes spin-3d {
    0% { transform: rotateY(0deg) rotateX(10deg); }
    100% { transform: rotateY(360deg) rotateX(10deg); }
  }
  .logo-glow {
    filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.6));
  }
  .logo-text-glow {
    text-shadow: 0 0 25px rgba(16, 185, 129, 0.3), 0 0 10px rgba(0, 0, 0, 0.5);
  }
`;

// Componente do Logo Animado 3D com alta visibilidade
const AnimatedLogo = () => (
  <div className="flex items-center gap-4 mb-10 perspective-1000">
    <div className="logo-3d-spin w-14 h-14 lg:w-16 lg:h-16 relative flex items-center justify-center">
      {/* TROQUE PELO CAMINHO DA SUA LOGO AQUI */}
      <img src="/sua-logo-aqui.png" alt="organizze logo" className="w-full h-full object-contain logo-glow" />
    </div>
    <div className="flex flex-col">
      {/* Texto alterado para Branco Puro para não ficar ofuscado */}
      <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white logo-text-glow">organizze</h2>
      <span className="text-xs lg:text-sm text-emerald-400 font-bold tracking-widest uppercase -mt-1">
        Planeje. Poupe. Viva.
      </span>
    </div>
  </div>
);

const problems = [
  {
    icon: "📊",
    title: "A planilha que abandonou",
    desc: "Começou em janeiro. Abriu duas vezes. Agora está perdida nalgum lugar do seu desktop.",
  },
  {
    icon: "🔄",
    title: "A armadilha do 'mês que vem'",
    desc: "Todo mês a mesma promessa. O próximo mês nunca chega com um plano de verdade.",
  },
  {
    icon: "👁️",
    title: "Gasto cego",
    desc: "O saldo do banco não lhe diz nada sobre o que realmente pode gastar até ao fim do mês.",
  },
];

const steps = [
  {
    n: "01",
    icon: "💰",
    title: "Defina a sua renda",
    desc: "Informe quanto entra todo mês. Salário, freelas, tudo.",
    sample: "€ 3.200 / mês",
  },
  {
    n: "02",
    icon: "📊",
    title: "Escolha a sua divisão",
    desc: "Use 50/30/20 ou ajuste as percentagens do jeito que fizer sentido para si.",
    sample: "50% essencial · 30% lazer · 20% poupança",
  },
  {
    n: "03",
    icon: "📱",
    title: "Registre os gastos",
    desc: "Pelo app ou pelo WhatsApp. Veja o progresso em tempo real.",
    sample: "Mercado € 45 · Uber € 12 · Netflix € 18",
  },
];

const features = [
  {
    tag: "50/30/20",
    icon: <BarChart3 size={18} />,
    title: "Orçamento inteligente",
    desc: "Defina a sua renda, escolha um modelo e veja como dividir entre todas as suas categorias.",
  },
  {
    tag: "Tempo real",
    icon: <Zap size={18} />,
    title: "Controle de gastos",
    desc: "Vermelho quando passou do limite. Verde quando está no controle. Simples assim.",
  },
  {
    tag: "WhatsApp",
    icon: <MessageCircle size={18} />,
    title: "Lançamento por WhatsApp",
    desc: "Mande foto do recibo ou texto rápido. A despesa é registada sem abrir o app.",
  },
  {
    tag: "Família",
    icon: <Users size={18} />,
    title: "Grupos partilhados",
    desc: "Divida o orçamento com o seu parceiro ou família. Todos veem o mesmo plano.",
  },
  {
    tag: "Cenários",
    icon: <Layers size={18} />,
    title: "Múltiplos planos",
    desc: "Mês normal, mês de viagem, modo poupança. Crie cenários e alterne na hora.",
  },
  {
    tag: "Seguro",
    icon: <ShieldCheck size={18} />,
    title: "Seguro por padrão",
    desc: "Os seus dados financeiros são encriptados. Só você pode ver. Sempre.",
  },
];

const plans = [
  {
    badge: "Para quem está a começar",
    name: "Grátis",
    price: "€ 0",
    period: "para sempre",
    cta: "Criar conta grátis",
    highlighted: false,
    features: ["Dashboard completo", "7 categorias de orçamento", "2 planos de orçamento", "1 grupo familiar"],
  },
  {
    badge: "Mais popular",
    name: "Mensal",
    price: "€ 4,90",
    period: "/mês",
    cta: "Iniciar teste de 30 dias",
    highlighted: true,
    features: [
      "Tudo do Grátis, e mais:",
      "📱 Lançamento por WhatsApp",
      "📊 Planos ilimitados",
      "👥 Grupos ilimitados",
      "📅 Relatório mensal no dia 25",
    ],
  },
  {
    badge: "Melhor custo-benefício",
    name: "Anual",
    price: "€ 49,90",
    period: "/ano",
    cta: "Iniciar teste de 30 dias",
    highlighted: false,
    features: [
      "Tudo do Grátis, e mais:",
      "📱 Lançamento por WhatsApp",
      "📊 Planos ilimitados",
      "👥 Grupos ilimitados",
      "💰 Economize € 9,80/ano",
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen gradient-bg text-white relative overflow-hidden">
      <style>{modernStyles}</style>

      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <LandingHeader />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-7">
            {/* Logo Component Added */}
            <AnimatedLogo />

            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-px bg-emerald-400"></span>
              Pare de adivinhar para onde vai o seu dinheiro
            </span>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
              Sabe que está a gastar demais.{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent glow-text">
                Apenas não sabe onde.
              </span>
            </h1>
            <p className="text-lg text-gray-100 max-w-md leading-relaxed font-medium">
              O <strong className="text-white">organizze</strong> é o seu planeador de orçamento mensal. Defina a sua
              renda, divida em categorias, acompanhe o que realmente gasta — e receba um relatório no WhatsApp todo dia
              25.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="text-base px-8 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-[0_8px_30px_rgb(16,185,129,0.4)] gap-2 border-0 font-bold"
                >
                  Criar conta grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base px-6 py-6 text-white hover:text-white hover:bg-white/10 font-semibold"
                >
                  Veja como funciona
                </Button>
              </a>
            </div>
            <p className="text-sm text-gray-200 flex items-center gap-2 font-medium">
              <Check size={16} className="text-emerald-400" /> Sem cartão de crédito · 30 dias de teste grátis
            </p>
          </div>

          {/* 3D WhatsApp mockup */}
          <div className="relative flex justify-center lg:justify-end perspective-1000">
            <div className="tilt-card relative w-full max-w-sm preserve-3d">
              {/* Floating 3D Cards */}
              <div className="hidden md:block absolute -left-12 top-16 glass-card rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-2xl floating">
                📅 Relatório no dia 25
              </div>
              <div className="hidden md:block absolute -right-8 bottom-32 glass-card rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-2xl floating-delayed">
                📷 Foto do recibo → despesa
              </div>

              <div className="w-full bg-[#0b141a] rounded-[2.5rem] p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10">
                <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-t-[2rem] px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">
                    o
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">organizze</p>
                    <p className="text-white/80 text-xs flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span> online
                    </p>
                  </div>
                </div>
                <div className="bg-[#0b141a] px-3 py-4 space-y-3 min-h-[420px]">
                  <div className="text-center">
                    <span className="text-[11px] bg-white/10 px-2 py-1 rounded text-gray-200 font-medium">Hoje</span>
                  </div>
                  <div className="ml-auto bg-[#005c4b] rounded-lg px-3 py-2 text-sm max-w-[80%] shadow-sm">
                    <span className="text-white font-medium">Gastei € 45 no mercado 🛒</span>
                    <span className="block text-[10px] text-gray-300 text-right mt-0.5">14:32 ✓✓</span>
                  </div>
                  <div className="glass-card rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm">
                    <p className="text-emerald-400 text-xs font-bold mb-1">✦ organizze</p>
                    <p className="font-semibold text-white">✅ Despesa registada!</p>
                    <div className="flex justify-between text-xs mt-1.5 text-gray-200 font-medium">
                      <span>🛒 Alimentação</span>
                      <span className="font-bold text-white">€ 45</span>
                    </div>
                    <div className="mt-2 text-[11px] bg-amber-500/10 text-amber-300 rounded px-2 py-1 border border-amber-500/30 font-medium">
                      ⚠️ € 298 de € 320 gastos
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] bg-white/10 px-2 py-1 rounded text-gray-200 font-medium">
                      25 de Janeiro
                    </span>
                  </div>
                  <div className="glass-card rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm">
                    <p className="text-emerald-400 text-xs font-bold mb-1">✦ organizze</p>
                    <p className="font-semibold text-white mb-2">📊 Relatório de Janeiro</p>
                    <div className="space-y-1 text-xs text-gray-200 font-medium">
                      <div className="flex justify-between">
                        <span>💰 Renda</span>
                        <span className="font-bold text-white">€ 3.200</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💸 Gasto</span>
                        <span className="font-bold text-red-400">€ 2.450</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎯 Poupado</span>
                        <span className="font-bold text-emerald-400">€ 750</span>
                      </div>
                    </div>
                    <p className="text-[11px] mt-2 text-emerald-400 font-bold">No caminho certo 🎉</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 relative z-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-widest text-emerald-400 mb-3 font-semibold">
            A conversa que não quer ter
          </p>
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-12 max-w-2xl text-white">
            "Cadê o dinheiro que entrou este mês?"
          </h2>

          <div className="space-y-4 mb-12 max-w-xl">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                P
              </div>
              <div className="glass-card rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-100 font-medium">
                Dissemos que íamos poupar € 800 este mês. O que aconteceu?
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                T
              </div>
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white font-medium">
                Sei lá... umas contas, mercado, saímos um par de vezes...
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                P
              </div>
              <div className="glass-card rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-100 font-medium">
                Igual ao mês passado. E ao anterior.
              </div>
            </div>
          </div>

          <p className="text-base text-gray-200 max-w-2xl mb-12 leading-relaxed font-medium">
            Não é mau com dinheiro. Apenas nunca teve um sistema. Sem um plano, os gastos silenciosamente expandem-se
            para preencher cada euro que ganha — e só percebe quando já é tarde.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div
                key={p.title}
                className="glass-card rounded-2xl p-6 hover:translate-y-[-4px] transition-transform duration-300"
              >
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold mb-2 text-lg text-white">{p.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-widest text-emerald-400 mb-3 font-semibold">Sistema simples</p>
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Configure uma vez. Depois é só viver.
          </h2>
          <p className="text-gray-200 mb-16 text-lg font-medium">Três minutos no início do mês. Só isso.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative group">
                <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent mb-3">
                  {s.n}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-xl mb-3 text-white">{s.title}</h3>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed font-medium">{s.desc}</p>
                <div className="glass-card rounded-lg px-3 py-2 text-sm font-semibold inline-block text-emerald-300">
                  {s.sample}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CALLOUT */}
      <section className="py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="glass-card rounded-[2rem] p-12 text-center relative overflow-hidden border-white/15">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <MessageCircle size={48} className="mx-auto mb-6 text-emerald-400" />
              <h2 className="text-2xl lg:text-4xl font-extrabold mb-4 text-white">Lance gastos direto do WhatsApp</h2>
              <p className="text-gray-200 max-w-2xl mx-auto mb-8 text-lg font-medium">
                Mande "Gastei € 45 no mercado" no WhatsApp. A despesa é registada na hora. Todo dia 25, recebe o resumo
                completo do mês.
              </p>
              <Link to="/signup">
                <Button size="lg" className="gap-2 bg-white text-black hover:bg-gray-200 px-8 py-6 text-base font-bold">
                  Testar grátis <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-widest text-emerald-400 mb-3 font-semibold">Recursos</p>
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Tudo o que precisa. Nada do que não precisa.
          </h2>
          <p className="text-gray-200 mb-16 text-lg font-medium">
            Feito para quem quer um orçamento que realmente funciona.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card bento-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-emerald-400 p-2 bg-emerald-400/10 rounded-lg border border-emerald-500/20">
                    {f.icon}
                  </span>
                  <span className="text-xs font-bold uppercase text-gray-300 tracking-wider">{f.tag}</span>
                </div>
                <h3 className="font-bold text-lg mb-3 text-white">{f.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-24 border-y border-white/10 relative z-10">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm uppercase tracking-widest text-emerald-400 mb-6 font-semibold">Quem usa, recomenda</p>
          <blockquote className="text-2xl lg:text-4xl font-bold leading-snug text-white mb-8">
            "Finalmente sei para onde vai o meu dinheiro. O recurso do WhatsApp mudou o jogo — mando uma mensagem e está
            feito."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-lg">
              M
            </div>
            <div className="text-left">
              <p className="font-bold text-base text-white">Mariana S.</p>
              <p className="text-sm text-gray-300 font-medium">Lisboa, Portugal</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-sm uppercase tracking-widest text-emerald-400 mb-3 text-center font-semibold">Planos</p>
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4 text-center text-white">
            Simples. Justo. Sem surpresas.
          </h2>
          <p className="text-gray-200 text-center mb-16 text-lg font-medium">
            Cancele quando quiser. Sem taxas escondidas.
          </p>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-emerald-500/15 to-transparent border-emerald-500/50 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] md:-translate-y-4"
                    : "glass-card border-white/15 hover:border-white/30"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider mb-4 ${plan.highlighted ? "text-emerald-300" : "text-gray-300"}`}
                >
                  {plan.badge}
                </p>
                <h3 className="text-2xl font-bold mb-4 text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className={`text-sm font-medium ${plan.highlighted ? "text-emerald-300" : "text-gray-300"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 my-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-100 font-medium">
                      <Check
                        size={18}
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-emerald-400" : "text-emerald-400/80"}`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    className={`w-full py-6 text-base font-bold ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    }`}
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
      <section className="py-32 relative z-10">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
          <h2 className="relative text-3xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            A próxima briga sobre dinheiro <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              não precisa acontecer.
            </span>
          </h2>
          <p className="text-gray-200 mb-10 max-w-xl mx-auto text-lg font-medium">
            Comece com um plano. Saiba para onde vai o seu dinheiro. Poupe de verdade.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup">
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-[0_8px_30px_rgb(16,185,129,0.4)]"
              >
                Criar conta grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-300 mt-6 font-medium">
            Sem compromisso · Cancele quando quiser · 30 dias grátis
          </p>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-gray-400 border-t border-white/10 relative z-10 font-medium">
        © 2026 organizze. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Index;
