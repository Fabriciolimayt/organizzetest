import { ArrowDownLeft, ArrowUpRight, MessageCircle, ReceiptText } from "lucide-react";

const transactions = [
  { name: "Mercado do bairro", meta: "Alimentação · hoje", value: "− 52,40 €", icon: ArrowUpRight },
  { name: "Transferência recebida", meta: "Receita · ontem", value: "+ 820,00 €", icon: ArrowDownLeft },
  { name: "Passe mensal", meta: "Transportes · 18 ago", value: "− 40,00 €", icon: ReceiptText },
];

const ProductStage = () => (
  <div className="paper-panel editorial-reveal relative overflow-hidden" aria-label="Pré-visualização do dashboard Organizze">
    <div className="grid min-h-[420px] grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)]">
      <aside className="bg-ink px-3 py-5 text-white sm:px-4">
        <div className="font-mono text-[10px] font-semibold text-marker">ORG/26</div>
        <nav className="mt-16 space-y-2" aria-label="Pré-visualização da navegação">
          {["Visão geral", "Lançamentos", "Orçamento", "Relatórios"].map((item, index) => (
            <div key={item} className={`flex min-h-9 items-center gap-2 px-2 text-xs ${index === 0 ? "bg-white/10 text-white" : "text-white/45"}`}>
              <span className={`size-1.5 shrink-0 ${index === 0 ? "bg-marker" : "bg-white/25"}`} />
              <span className="hidden truncate sm:block">{item}</span>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-foreground pb-4">
          <div><p className="font-mono text-[9px] uppercase text-data-blue">Agosto / visão geral</p><p className="editorial-display mt-1 text-2xl font-semibold">O teu mês, sem ruído.</p></div>
          <span className="marker-highlight hidden px-2 py-1 font-mono text-[9px] font-semibold sm:inline">EM DIA</span>
        </div>
        <div className="grid gap-5 border-b border-foreground py-5 lg:grid-cols-[1.4fr_0.6fr]">
          <div><p className="font-mono text-[9px] uppercase text-muted-foreground">Saldo disponível</p><p className="financial-display mt-2 text-4xl font-semibold leading-none sm:text-5xl">2 840,20 €</p><p className="mt-3 text-xs text-muted-foreground">+ 18,4% comparado com julho</p></div>
          <div className="ink-panel p-3"><p className="font-mono text-[9px] uppercase text-marker">Próxima decisão</p><p className="mt-5 text-sm font-semibold">Lazer chegou a 78% do limite.</p><p className="mt-2 text-xs text-white/55">Ainda tens 96,00 € disponíveis.</p></div>
        </div>
        <div className="divide-y divide-border">
          {transactions.map(({ name, meta, value, icon: Icon }) => (
            <div key={name} className="flex min-w-0 items-center gap-3 py-3">
              <span className="surface-quiet flex size-8 shrink-0 items-center justify-center text-primary"><Icon className="size-3.5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{name}</span><span className="block truncate font-mono text-[9px] text-muted-foreground">{meta}</span></span>
              <span className="financial-value text-[11px] font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="absolute bottom-5 right-5 hidden items-center gap-2 border border-foreground bg-marker px-3 py-2 text-xs font-semibold shadow-[3px_3px_0_hsl(var(--foreground))] md:flex"><MessageCircle className="size-4" aria-hidden="true" /> Recibo registado pelo WhatsApp</div>
  </div>
);

export default ProductStage;
