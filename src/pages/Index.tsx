import { useEffect } from "react";
import LandingHeader from "@/components/LandingHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Zap, Users, Layers, BarChart3, MessageCircle, Star } from "lucide-react";

const stats = [
  { value: "52.000+", label: "Usuários ativos" },
  { value: "R$ 8,2M", label: "Organizados por mês" },
  { value: "4.9", label: "Na App Store", stars: true },
  { value: "94%", label: "Renovam o plano" },
];

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
  {
    tag: "50/30/20",
    icon: <BarChart3 size={18} />,
    title: "Orçamento inteligente",
    desc: "Defina sua renda, escolha um modelo e veja como dividir entre todas as suas categorias.",
    span: "lg:col-span-2",
  },
  {
    tag: "Tempo real",
    icon: <Zap size={18} />,
    title: "Controle de gastos",
    desc: "Vermelho quando passou do limite. Verde quando tá no controle. Simples assim.",
    span: "",
  },
  {
    tag: "WhatsApp",
    icon: <MessageCircle size={18} />,
    title: "Lançamento por WhatsApp",
    desc: "Manda foto do recibo ou texto rápido. A despesa é registrada sem abrir o app.",
    span: "",
  },
  {
    tag: "Família",
    icon: <Users size={18} />,
    title: "Grupos compartilhados",
    desc: "Divida o orçamento com seu parceiro ou família. Todo mundo vê o mesmo plano.",
    span: "",
  },
  {
    tag: "Cenários",
    icon: <Layers size={18} />,
    title: "Múltiplos planos",
    desc: "Mês normal, mês de viagem, modo poupança. Crie cenários e alterne na hora.",
    span: "",
  },
  {
    tag: "Seguro",
    icon: <ShieldCheck size={18} />,
    title: "Seguro por padrão",
    desc: "Seus dados financeiros são criptografados de ponta a ponta. Só você pode ver. Sempre.",
    span: "lg:col-span-3",
  },
];

const testimonials = [
  {
    text: "Finalmente sei pra onde vai meu dinheiro. O recurso do WhatsApp mudou o jogo — mando uma mensagem e tá feito.",
    name: "Marina S.",
    location: "São Paulo, SP",
    initial: "M",
  },
  {
    text: "Eu e meu marido usamos o grupo compartilhado. Pela primeira vez em 5 anos de casado, não brigamos sobre dinheiro no fim do mês.",
    name: "Camila R.",
    location: "Belo Horizonte, MG",
    initial: "C",
  },
  {
    text: "Em 3 meses economizei R$ 2.400 que antes simplesmente desapareciam. O relatório do dia 25 é meu checkpoint favorito.",
    name: "Lucas M.",
    location: "Curitiba, PR",
    initial: "L",
  },
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
    price: "R$ 149,90",
    period: "/ano",
    cta: "Iniciar teste de 30 dias",
    highlighted: false,
    features: [
      "Tudo do Grátis, e mais:",
      "📱 Lançamento por WhatsApp",
      "📊 Planos ilimitados",
      "👥 Grupos ilimitados",
      "💰 Economize R$ 28,90/ano",
    ],
  },
];

const Index = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 40px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .anim-blob { animation: blob 10s ease-in-out infinite; }
        .anim-blob-delay { animation: blob 10s ease-in-out infinite 5s; }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-float-d1 { animation: float 6s ease-in-out infinite 1.5s; }
        .anim-float-d2 { animation: float 6s ease-in-out infinite 3s; }
        .anim-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .anim-gradient-x { background-size: 200% 200%; animation: gradient-x 4s ease infinite; }

        .gradient-text {
          background: linear-gradient(135deg, #8B0000 0%, #e74c3c 35%, #ff6b6b 55%, #c0392b 80%, #8B0000 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-md {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .glass-strong {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .dot-grid {
          background-image: radial-gradient(circle, rgba(139,0,0,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .glow-sm { box-shadow: 0 0 60px rgba(139, 0, 0, 0.12); }
        .glow-md { box-shadow: 0 0 100px rgba(139, 0, 0, 0.15), 0 0 200px rgba(139, 0, 0, 0.06); }

        .card-lift {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s ease, box-shadow 0.5s ease;
        }
        .card-lift:hover {
          transform: translateY(-6px);
          border-color: rgba(139, 0, 0, 0.35);
          box-shadow: 0 24px 48px rgba(0,0,0,0.35), 0 0 50px rgba(139, 0, 0, 0.08);
        }

        .gradient-border-anim {
          position: relative;
        }
        .gradient-border-anim::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(135deg, #8B0000, #ff6b6b, #8B0000, #ff6b6b, #8B0000);
          background-size: 300% 300%;
          animation: gradient-x 5s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .rd1 { transition-delay: 0.08s; }
        .rd2 { transition-delay: 0.16s; }
        .rd3 { transition-delay: 0.24s; }
        .rd4 { transition-delay: 0.32s; }
        .rd5 { transition-delay: 0.40s; }
        .rd6 { transition-delay: 0.48s; }

        .divider-glow {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(139,0,0,0.4) 50%, transparent 100%);
        }

        .chat-bubble-in {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #8B0000; }
      `}</style>

      <LandingHeader />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-28 lg:pt-12 lg:pb-32">
        <div className="absolute top-10 right-[-10%] w-[550px] h-[550px] bg-[#8B0000]/10 rounded-full blur-[140px] anim-blob pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[420px] h-[420px] bg-[#8B0000]/5 rounded-full blur-[120px] anim-blob-delay pointer-events-none" />
        <div className="absolute inset-0 dot-grid pointer-events-none opacity-40" />

        <div className="relative grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-7">
            <div className="reveal">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-muted-foreground uppercase tracking-widest glass px-5 py-2.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0000]" />
                </span>
                Pare de adivinhar para onde vai seu dinheiro
              </span>
            </div>

            <h1 className="reveal rd1 text-[2.6rem] sm:text-5xl xl:text-[3.6rem] font-extrabold leading-[1.06] text-foreground tracking-tight">
              Você sabe que tá gastando demais. <span className="gradient-text">Você só não sabe onde.</span>
            </h1>

            <p className="reveal rd2 text-lg text-muted-foreground/90 max-w-md leading-relaxed">
              O <strong className="text-foreground font-semibold">organizze</strong> é seu planejador de orçamento
              mensal. Defina sua renda, divida em categorias, acompanhe o que você realmente gasta — e receba um
              relatório no WhatsApp todo dia 25.
            </p>

            <div className="reveal rd3 flex flex-wrap gap-3 items-center pt-1">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="text-base px-8 py-6 shadow-lg shadow-primary/25 gap-2.5 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300"
                >
                  Criar conta grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base px-6 py-6 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Veja como funciona
                </Button>
              </a>
            </div>

            <div className="reveal rd4 flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary/80" /> Sem cartão
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>30 dias grátis</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          {/* WhatsApp mockup */}
          <div className="reveal rd2 relative flex justify-center lg:justify-end">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[440px] bg-[#8B0000]/15 rounded-full blur-[90px] anim-pulse-glow pointer-events-none" />

            <div className="relative w-full max-w-[340px] bg-[#0b141a] rounded-[2.5rem] p-3 shadow-2xl border-[7px] border-foreground/90 glow-sm">
              <div className="bg-[#075e54] rounded-t-[1.8rem] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  o
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">organizze</p>
                  <p className="text-white/60 text-xs">● online</p>
                </div>
              </div>
              <div className="bg-[#e5ddd5] px-3 py-4 space-y-3 min-h-[400px] rounded-b-[2rem]">
                <div className="text-center">
                  <span className="text-[10px] bg-white/90 px-2.5 py-1 rounded-lg text-muted-foreground shadow-sm">
                    Hoje
                  </span>
                </div>
                <div className="ml-auto bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2 text-sm max-w-[80%] shadow-sm">
                  Gastei R$ 45 no mercado 🛒
                  <span className="block text-[10px] text-muted-foreground text-right mt-0.5">14:32 ✓✓</span>
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2.5 text-sm max-w-[85%] shadow-sm">
                  <p className="text-[#075e54] text-[11px] font-bold mb-1">✦ organizze</p>
                  <p className="font-medium text-foreground">✅ Despesa registrada!</p>
                  <div className="flex justify-between text-xs mt-1.5 text-foreground/80">
                    <span>🛒 Alimentação</span>
                    <span className="font-semibold text-foreground">R$ 45</span>
                  </div>
                  <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 rounded-lg px-2.5 py-1.5 font-medium">
                    ⚠️ R$ 298 de R$ 320 gastos
                  </div>
                </div>
                <div className="text-center pt-1">
                  <span className="text-[10px] bg-white/90 px-2.5 py-1 rounded-lg text-muted-foreground shadow-sm">
                    25 de Janeiro
                  </span>
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2.5 text-sm max-w-[85%] shadow-sm">
                  <p className="text-[#075e54] text-[11px] font-bold mb-1">✦ organizze</p>
                  <p className="font-medium text-foreground mb-2">📊 Relatório de Janeiro</p>
                  <div className="space-y-1.5 text-xs text-foreground/80">
                    <div className="flex justify-between">
                      <span>💰 Renda</span>
                      <span className="font-semibold text-foreground">R$ 5.400</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💸 Gasto</span>
                      <span className="font-semibold text-red-600">R$ 4.625</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🎯 Poupado</span>
                      <span className="font-semibold text-[#075e54]">R$ 775</span>
                    </div>
                  </div>
                  <p className="text-[11px] mt-2.5 text-[#075e54] font-semibold">No caminho certo 🎉</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex absolute -left-8 top-20 glass-md rounded-2xl px-4 py-3 text-xs font-medium shadow-2xl anim-float">
              <span className="text-base mr-2.5">📅</span>
              <div>
                <p className="text-foreground font-semibold">Relatório automático</p>
                <p className="text-muted-foreground">Todo dia 25</p>
              </div>
            </div>
            <div className="hidden md:flex absolute -left-6 bottom-28 glass-md rounded-2xl px-4 py-3 text-xs font-medium shadow-2xl anim-float-d1">
              <span className="text-base mr-2.5">📷</span>
              <div>
                <p className="text-foreground font-semibold">Foto do recibo</p>
                <p className="text-muted-foreground">→ despesa registrada</p>
              </div>
            </div>
            <div className="hidden lg:flex absolute -right-6 top-10 glass-md rounded-2xl px-4 py-3 text-xs font-medium shadow-2xl anim-float-d2">
              <span className="text-base mr-2.5">✅</span>
              <div>
                <p className="text-foreground font-semibold">Limite no controle</p>
                <p className="text-green-400 font-semibold">R$ 22 restantes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="relative border-y border-border/60">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                  {stat.stars && (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={12} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#8B0000]/[0.04] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
          <p className="reveal text-sm uppercase tracking-[0.2em] text-primary/80 mb-4 font-medium">
            A conversa que você não quer ter
          </p>
          <h2 className="reveal rd1 text-3xl lg:text-[2.8rem] font-extrabold tracking-tight mb-12 leading-tight">
            "Cadê o dinheiro que entrou esse mês?"
          </h2>

          <div className="reveal rd2 space-y-4 mb-12 max-w-xl">
            <div className="flex gap-3 items-end">
              <div className="w-9 h-9 rounded-full glass-md flex items-center justify-center text-xs font-bold shrink-0 text-muted-foreground">
                P
              </div>
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3 text-sm text-foreground/90">
                A gente disse que ia poupar R$ 800 esse mês. O que aconteceu?
              </div>
            </div>
            <div className="flex gap-3 items-end flex-row-reverse">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                T
              </div>
              <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-br-md px-4 py-3 text-sm text-foreground/90">
                Sei lá... umas contas, mercado, saímos um par de vezes...
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="w-9 h-9 rounded-full glass-md flex items-center justify-center text-xs font-bold shrink-0 text-muted-foreground">
                P
              </div>
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3 text-sm text-foreground/90">
                Igual ao mês passado. E o anterior.
              </div>
            </div>
          </div>

          <p className="reveal rd3 text-base text-muted-foreground/80 max-w-2xl mb-14 leading-relaxed">
            Você não é ruim com dinheiro. Você só nunca teve um sistema. Sem um plano, os gastos silenciosamente se
            expandem para preencher cada real que você ganha — e você só percebe quando já é tarde.
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            {problems.map((p, i) => (
              <div
                key={p.title}
                className={`reveal rd${i + 3} group glass rounded-2xl p-7 card-lift relative overflow-hidden`}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-glow max-w-4xl mx-auto" />

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="como-funciona" className="relative py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <p className="reveal text-sm uppercase tracking-[0.2em] text-primary/80 mb-4 font-medium">Sistema simples</p>
          <h2 className="reveal rd1 text-3xl lg:text-[2.8rem] font-extrabold tracking-tight mb-3 leading-tight">
            Configure uma vez. Depois é só viver.
          </h2>
          <p className="reveal rd2 text-muted-foreground mb-16 text-lg">Três minutos no início do mês. Só isso.</p>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[72px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="hidden md:block absolute top-[72px] left-[16%] w-2.5 h-2.5 rounded-full bg-primary/30" />
            <div className="hidden md:block absolute top-[72px] left-[50%] -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary/30" />
            <div className="hidden md:block absolute top-[72px] right-[16%] w-2.5 h-2.5 rounded-full bg-primary/30" />

            <div className="grid md:grid-cols-3 gap-10 md:gap-8">
              {steps.map((s, i) => (
                <div key={s.n} className={`reveal rd${i + 2} relative`}>
                  <div className="text-6xl font-extrabold text-primary/[0.07] absolute -top-3 -left-1 select-none pointer-events-none">
                    {s.n}
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mb-5">
                      {s.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground/80 mb-5 leading-relaxed">{s.desc}</p>
                    <div className="glass inline-flex items-center rounded-lg px-4 py-2.5 text-xs font-medium text-foreground/70">
                      {s.sample}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHATSAPP CALLOUT ═══════════════ */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <div className="reveal inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-6">
            <MessageCircle size={28} className="text-white/90" />
          </div>
          <h2 className="reveal rd1 text-2xl lg:text-4xl font-extrabold mb-4 text-white leading-tight">
            Lance gastos direto do WhatsApp
          </h2>
          <p className="reveal rd2 opacity-90 max-w-2xl mx-auto mb-8 text-lg text-white/90 leading-relaxed">
            Manda "Gastei R$ 45 no mercado" no WhatsApp. A despesa é registrada na hora. Todo dia 25, você recebe o
            resumo completo do mês.
          </p>
          <div className="reveal rd3">
            <Link to="/signup">
              <Button
                size="lg"
                className="gap-2.5 bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                Testar grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES BENTO ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#8B0000]/[0.04] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
          <p className="reveal text-sm uppercase tracking-[0.2em] text-primary/80 mb-4 font-medium">Recursos</p>
          <h2 className="reveal rd1 text-3xl lg:text-[2.8rem] font-extrabold tracking-tight mb-3 leading-tight">
            Tudo que você precisa. <span className="text-muted-foreground/50">Nada que não precisa.</span>
          </h2>
          <p className="reveal rd2 text-muted-foreground mb-14 text-lg">
            Feito pra quem quer um orçamento que realmente funciona.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`reveal rd${Math.min(i + 1, 6)} group glass rounded-2xl p-7 card-lift relative overflow-hidden ${f.span}`}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {f.span === "lg:col-span-2" && (
                  <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
                    <BarChart3 size={120} strokeWidth={0.8} />
                  </div>
                )}
                {f.span === "lg:col-span-3" && (
                  <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-[0.04] pointer-events-none hidden lg:block">
                    <ShieldCheck size={100} strokeWidth={0.8} />
                  </div>
                )}
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="text-primary">{f.icon}</span>
                    <span className="text-[11px] font-bold uppercase text-primary/70 tracking-[0.15em]">{f.tag}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{f.desc}</p>
                  {f.span === "lg:col-span-2" && (
                    <div className="flex gap-2 mt-5">
                      <div className="flex-1 h-2 rounded-full bg-primary/60" />
                      <div className="flex-[0.6] h-2 rounded-full bg-primary/30" />
                      <div className="flex-[0.4] h-2 rounded-full bg-primary/15" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-glow max-w-4xl mx-auto" />

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-[#8B0000]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
          <p className="reveal text-sm uppercase tracking-[0.2em] text-primary/80 mb-4 font-medium text-center">
            Quem usa, recomenda
          </p>
          <h2 className="reveal rd1 text-3xl lg:text-[2.8rem] font-extrabold tracking-tight mb-14 text-center leading-tight">
            Mais de 52 mil pessoas já mudaram a relação com dinheiro
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`reveal rd${i + 2} glass rounded-2xl p-7 card-lift flex flex-col ${i === 1 ? "md:translate-y-6" : ""}`}
              >
                <div className="text-4xl text-primary/15 font-serif leading-none mb-4 select-none">&ldquo;</div>
                <p className="text-foreground/90 leading-relaxed mb-6 flex-1 text-[15px]">{t.text}</p>
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#8B0000]/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
          <p className="reveal text-sm uppercase tracking-[0.2em] text-primary/80 mb-4 font-medium text-center">
            Planos
          </p>
          <h2 className="reveal rd1 text-3xl lg:text-[2.8rem] font-extrabold tracking-tight mb-3 text-center leading-tight">
            Simples. Justo. Sem surpresas.
          </h2>
          <p className="reveal rd2 text-muted-foreground text-center mb-14 text-lg">
            Cancele quando quiser. Sem taxas escondidas.
          </p>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`reveal rd${i + 2} rounded-2xl p-8 flex flex-col relative overflow-hidden ${
                  plan.highlighted
                    ? "gradient-border-anim bg-primary text-primary-foreground shadow-2xl shadow-primary/25 md:-translate-y-5"
                    : "glass card-lift"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full blur-[60px] pointer-events-none" />
                )}
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ${plan.highlighted ? "text-white/70" : "text-primary/70"}`}
                >
                  {plan.badge}
                </p>
                <h3 className={`text-xl font-bold mb-3 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${plan.highlighted ? "" : "text-foreground"}`}
                  >
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 my-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-white/80" : "text-primary"}`}
                      />
                      <span className={f.startsWith("Tudo") ? "font-medium opacity-80" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    className={`w-full font-semibold transition-all duration-300 hover:scale-[1.02] ${
                      plan.highlighted ? "bg-white text-primary hover:bg-white/90 shadow-lg" : ""
                    }`}
                    variant={plan.highlighted ? "default" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-card" />
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B0000]/[0.08] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="reveal text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold tracking-tight mb-5 leading-[1.1]">
            A próxima briga sobre dinheiro <span className="gradient-text">não precisa acontecer.</span>
          </h2>
          <p className="reveal rd1 text-muted-foreground mb-10 max-w-xl mx-auto text-lg leading-relaxed">
            Comece com um plano. Saiba pra onde vai seu dinheiro. Poupe de verdade.
          </p>
          <div className="reveal rd2">
            <Link to="/signup">
              <Button
                size="lg"
                className="gap-2.5 px-10 py-7 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.03] transition-all duration-300 text-base font-semibold"
              >
                Criar conta grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          <p className="reveal rd3 text-xs text-muted-foreground mt-5 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-primary/60" /> Sem compromisso
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Cancele quando quiser</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>30 dias grátis</span>
          </p>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
              o
            </div>
            <span className="font-semibold text-sm text-foreground">organizze</span>
          </div>
          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} organizze. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
