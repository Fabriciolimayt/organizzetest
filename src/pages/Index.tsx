import { ArrowRight, Check, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import LandingHeader from "@/components/LandingHeader";
import ProductStage from "@/components/landing/ProductStage";
import { Button } from "@/components/ui/button";

const chapters = [
  ["01", "Vê o mês inteiro", "Saldo, despesas e limites reunidos numa leitura que não exige uma folha de cálculo."],
  ["02", "Regista enquanto vives", "Texto ou fotografia pelo WhatsApp. O Organizze organiza o detalhe sem interromper o teu dia."],
  ["03", "Decide em conjunto", "Partilha espaços, planos e objetivos com quem participa nas mesmas escolhas."],
];

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <LandingHeader />
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-y-0 left-[7%] w-px bg-white/10" aria-hidden="true" />
        <div className="absolute inset-y-0 right-[7%] w-px bg-white/10" aria-hidden="true" />
        <div className="mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-[1440px] flex-col px-6 pb-12 pt-12 sm:px-10 lg:px-16 lg:pt-16">
          <div className="flex items-center justify-between border-b border-white/20 pb-4 font-mono text-[10px] uppercase text-white/55">
            <span>Finanças pessoais / Portugal</span><span className="text-marker">Clareza em tempo real</span>
          </div>
          <div className="relative z-10 pt-10">
            <p className="font-mono text-xs font-semibold uppercase text-data-blue">O teu livro financeiro vivo</p>
            <h1 className="editorial-display mt-4 text-[clamp(4rem,13vw,11rem)] font-semibold leading-[0.78] text-white">Organizze.</h1>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-xl text-lg leading-7 text-white/66 sm:text-xl">Decide o que fazer com o teu dinheiro antes que o mês decida por ti.</p>
              <div className="flex flex-wrap gap-3"><Button asChild size="lg" className="border-marker !bg-marker !text-foreground shadow-none hover:!bg-marker/90"><Link to="/auth">Começar agora <ArrowRight aria-hidden="true" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/auth">Entrar</Link></Button></div>
            </div>
          </div>
          <div className="relative z-20 mt-10 w-full lg:ml-auto lg:w-[82%]"><ProductStage /></div>
        </div>
      </section>

      <section id="metodo" className="scroll-mt-20 border-b border-foreground">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-foreground p-7 lg:border-b-0 lg:border-r lg:p-12"><p className="font-mono text-[10px] uppercase text-data-blue">Uma relação mais lúcida</p><h2 className="editorial-display mt-5 text-4xl font-semibold leading-none sm:text-5xl">Menos controlo.<br />Mais contexto.</h2></div>
          <div>{chapters.map(([number, title, copy]) => <article key={number} className="grid gap-5 border-b border-border p-7 last:border-b-0 sm:grid-cols-[56px_0.7fr_1.3fr] sm:items-start lg:px-12"><span className="font-mono text-xs text-data-blue">/{number}</span><h3 className="editorial-display text-2xl font-semibold">{title}</h3><p className="max-w-xl text-base leading-7 text-muted-foreground">{copy}</p></article>)}</div>
        </div>
      </section>

      <section id="whatsapp" className="scroll-mt-20 bg-data-blue text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-7 py-16 lg:grid-cols-[1fr_0.8fr] lg:px-12 lg:py-24">
          <div><p className="font-mono text-[10px] uppercase text-white/60">WhatsApp integrado</p><h2 className="editorial-display mt-5 max-w-3xl text-5xl font-semibold leading-[0.94] sm:text-6xl">Uma mensagem entra. Uma despesa organizada sai.</h2></div>
          <div className="flex flex-col justify-end border-t border-white/35 pt-6 lg:border-l lg:border-t-0 lg:pl-10"><MessageCircle className="size-8" aria-hidden="true" /><p className="mt-8 text-lg leading-7 text-white/80">Envia “gastei 45 € no mercado” ou uma fotografia do recibo. A confirmação regressa no mesmo lugar.</p><Link to="/auth" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">Ligar o meu número <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section id="privacidade" className="mx-auto grid w-full max-w-[1440px] scroll-mt-20 gap-10 px-7 py-16 lg:grid-cols-[1fr_1fr] lg:px-12 lg:py-24">
        <div><p className="font-mono text-[10px] uppercase text-data-blue">Feito para durar</p><h2 className="editorial-display mt-5 text-4xl font-semibold leading-none sm:text-5xl">O rigor de uma ferramenta.<br />A calma de um hábito.</h2></div>
        <div className="space-y-5">{["Dados separados por espaço financeiro", "Confirmação antes de eliminar", "Limites e objetivos sem linguagem de culpa"].map((item) => <div key={item} className="flex items-center gap-4 border-b border-border pb-5"><span className="marker-highlight flex size-7 items-center justify-center"><Check className="size-4" aria-hidden="true" /></span><span className="text-base font-semibold">{item}</span></div>)}<p className="flex items-center gap-2 pt-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Construído sobre um espaço financeiro privado.</p></div>
      </section>

      <section className="border-t border-foreground bg-marker"><div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-8 px-7 py-12 lg:px-12"><h2 className="editorial-display max-w-3xl text-4xl font-semibold leading-none">O próximo mês pode começar com clareza.</h2><Button asChild size="lg" className="bg-ink text-white hover:bg-ink/90"><Link to="/auth">Criar conta <ArrowRight aria-hidden="true" /></Link></Button></div></section>
    </main>
  </div>
);

export default Index;
