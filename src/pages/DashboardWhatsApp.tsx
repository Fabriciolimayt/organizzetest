import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MessageCircle, Send, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { supabaseV2 } from "@/integrations/supabase/v2";
import { fileToCompressedBase64 } from "@/lib/whatsapp";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { toast } from "@/hooks/use-toast";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { capabilitiesForSubscription } from "@/lib/finance/capabilities";

type Bubble = {
  id: string;
  from: "user" | "bot";
  kind: "text" | "image" | "items" | "summary" | "loading";
  text?: string;
  imageUrl?: string;
  items?: Array<{ name: string; amount: number; category: string }>;
  total?: number;
  currency?: string;
  ts: number;
};

const STORAGE = "organizze.waMessages";
const CATEGORY_ALIASES: Record<string, string> = {
  transporte: "Transportes",
  transportes: "Transportes",
  casa: "Habitação",
  habitacao: "Habitação",
};

type ExpenseItem = {
  name: string;
  amount: number;
  category: string;
};

type FinancialContext = {
  userId: string;
  spaceId: string;
  currency: string;
  categories: Array<{ id: string; name: string }>;
};

const normalizedName = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-PT");

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Ocorreu um erro inesperado";

const currencySymbol = (currency: string) =>
  currency === "BRL" ? "R$" : currency === "MZN" ? "Mt" : currency === "USD" ? "$" : "€";

const validOccurredAt = (value: unknown) => {
  if (typeof value !== "string") return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const readBubbles = (): Bubble[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { return []; }
};

const seedBubbles = (currency: string): Bubble[] => ([
  { id: "1", from: "bot", kind: "text", ts: Date.now() - 60000,
    text: "✅ WhatsApp verificado!\n\nPodes agora:\n📸 Enviar fotos de recibos — cada item registado automaticamente\n✍️ Escrever uma despesa — ex: \"Gastei 45" + (currency === "BRL" ? "R$" : currency === "MZN" ? "Mt" : currency === "USD" ? "$" : "€") + "\"\n\nNo dia 25 de cada mês recebes aqui o teu resumo." },
]);

const DashboardWhatsApp = () => {
  const financial = useFinancialContext();
  const subscription = useSubscriptionV2();
  const locallyVerified = (() => {
    try { return JSON.parse(localStorage.getItem("organizze.whatsapp") || "null"); } catch { return null; }
  })();
  const initialCurrency = localStorage.getItem("organizze.currency") || "EUR";
  const [verified, setVerified] = useState(Boolean(locallyVerified));
  const [currency, setCurrency] = useState(initialCurrency);
  const sym = currencySymbol(currency);

  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const existing = readBubbles();
    return existing.length ? existing : seedBubbles(initialCurrency);
  });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bubbles));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles]);

  const resolveFinancialContext = useCallback(async (): Promise<FinancialContext> => {
    const context = financial.data;
    if (!context?.canWrite) throw new Error("Não tens um espaço ativo com permissão para registar despesas.");
    return {
      userId: context.userId,
      spaceId: context.spaceId,
      currency: context.currency,
      categories: context.categories.filter((category) => category.transaction_type === "expense").map(({ id, name }) => ({ id, name })),
    };
  }, [financial.data]);

  useEffect(() => {
    let active = true;

    const loadConnection = async () => {
      try {
        const context = await resolveFinancialContext();
        if (!active) return;
        setCurrency(context.currency);

        const { data, error } = await supabaseV2
          .from("whatsapp_connections")
          .select("id")
          .eq("space_id", context.spaceId)
          .eq("linked_user_id", context.userId)
          .eq("status", "active")
          .not("verified_at", "is", null)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (active) setVerified(Boolean(data));
      } catch {
        // The local marker keeps the initial UX usable while the V2 connection check is unavailable.
      }
    };

    void loadConnection();
    return () => { active = false; };
  }, [resolveFinancialContext]);

  const push = (b: Omit<Bubble, "id" | "ts">) =>
    setBubbles((p) => [...p, { ...b, id: crypto.randomUUID(), ts: Date.now() }]);

  const replaceLoading = (loadingId: string, b: Omit<Bubble, "id" | "ts">) =>
    setBubbles((p) => p.map((x) => x.id === loadingId ? { ...x, ...b, id: loadingId, ts: x.ts } : x));

  const pushLoading = (text: string) => {
    const id = crypto.randomUUID();
    setBubbles((p) => [...p, { id, from: "bot", kind: "loading", text, ts: Date.now() }]);
    return id;
  };

  const resolveCategoryId = (category: string, context: FinancialContext) => {
    const canonical = CATEGORY_ALIASES[normalizedName(category)] ?? category;
    const desired = normalizedName(canonical);
    const exact = context.categories.find((item) => normalizedName(item.name) === desired);
    const fallback = context.categories.find((item) => normalizedName(item.name) === "outros");
    const resolved = exact ?? fallback;
    if (!resolved) throw new Error("A categoria Outros não está disponível neste espaço.");
    return resolved.id;
  };

  const persistExpenses = async (
    items: ExpenseItem[],
    context: FinancialContext,
    merchant?: string | null,
    occurredAt?: unknown,
  ) => {
    const transactions = items
      .map((item) => ({ ...item, amount: Number(item.amount) }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0)
      .map((item) => ({
        space_id: context.spaceId,
        created_by: context.userId,
        category_id: resolveCategoryId(item.category || "Outros", context),
        transaction_type: "expense" as const,
        source: "app" as const,
        status: "cleared" as const,
        amount: item.amount,
        currency: context.currency,
        description: item.name || "Despesa",
        merchant: merchant?.trim() || null,
        occurred_at: validOccurredAt(occurredAt),
      }));
    if (!transactions.length) throw new Error("Não foi encontrado um valor válido para registar.");

    const { error } = await supabaseV2.from("transactions").insert(transactions);
    if (error) throw error;
  };

  const handlePhoto = async (file: File) => {
    if (busy) return;
    setBusy(true);
    try {
      const context = await resolveFinancialContext();
      setCurrency(context.currency);
      const dataUrl = await fileToCompressedBase64(file);
      push({ from: "user", kind: "image", imageUrl: dataUrl });
      const loadingId = pushLoading("🧾 Recibo recebido! A extrair os itens...");
      const { data, error } = await supabase.functions.invoke("parse-receipt", {
        body: { imageBase64: dataUrl, currency: context.currency },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Falhou");
      const items: ExpenseItem[] = Array.isArray(data.items)
        ? data.items.map((item: unknown) => {
            const candidate = item as Partial<ExpenseItem>;
            return {
              name: typeof candidate.name === "string" ? candidate.name : "Despesa",
              amount: Number(candidate.amount),
              category: typeof candidate.category === "string" ? candidate.category : "Outros",
            };
          }).filter((item: ExpenseItem) => Number.isFinite(item.amount) && item.amount > 0)
        : [];
      const total = Number(data.total) > 0
        ? Number(data.total)
        : items.reduce((sum, item) => sum + item.amount, 0);
      if (!items.length) {
        replaceLoading(loadingId, { from: "bot", kind: "text", text: "Não consegui ler nenhum item neste recibo. Tenta outra foto?" });
      } else {
        await persistExpenses(items, context, typeof data.merchant === "string" ? data.merchant : null, data.date);
        replaceLoading(loadingId, { from: "bot", kind: "items", items, total, currency: context.currency });
      }
    } catch (error: unknown) {
      toast({ title: "Erro ao processar recibo", description: errorMessage(error), variant: "destructive" });
      push({ from: "bot", kind: "text", text: "❌ Não consegui processar — tenta novamente." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleText = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    push({ from: "user", kind: "text", text: t });
    setBusy(true);
    const loadingId = pushLoading("A registar...");
    try {
      const context = await resolveFinancialContext();
      setCurrency(context.currency);
      const { data, error } = await supabase.functions.invoke("parse-expense-text", {
        body: { text: t, currency: context.currency },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Falhou");
      const amount = Number(data.amount);
      if (!amount) {
        replaceLoading(loadingId, { from: "bot", kind: "text", text: "Não percebi o valor. Tenta algo como \"Gastei 45" + sym + " no mercado\"." });
        return;
      }
      const item = { name: data.description || "Despesa", amount, category: data.category || "Outros" };
      await persistExpenses([item], context, typeof data.merchant === "string" ? data.merchant : null);
      replaceLoading(loadingId, { from: "bot", kind: "items", items: [item], total: amount, currency: context.currency });
    } catch (error: unknown) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      replaceLoading(loadingId, { from: "bot", kind: "text", text: "❌ Não consegui processar." });
    } finally {
      setBusy(false);
    }
  };

  const handleSummary = async () => {
    if (busy) return;
    setBusy(true);
    const loadingId = pushLoading("📅 A preparar o teu resumo mensal...");
    try {
      const context = await resolveFinancialContext();
      setCurrency(context.currency);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { data: transactions, error } = await supabaseV2
        .from("transactions")
        .select("amount, category_id")
        .eq("space_id", context.spaceId)
        .eq("transaction_type", "expense")
        .is("deleted_at", null)
        .gte("occurred_at", monthStart)
        .lt("occurred_at", nextMonth);
      if (error) throw error;

      const categoryNames = new Map(context.categories.map((category) => [category.id, category.name]));
      const totals = new Map<string, number>();
      for (const transaction of transactions ?? []) {
        const name = transaction.category_id ? categoryNames.get(transaction.category_id) ?? "Outros" : "Outros";
        totals.set(name, (totals.get(name) ?? 0) + Number(transaction.amount));
      }
      const formatter = new Intl.NumberFormat("pt-PT", { style: "currency", currency: context.currency });
      const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);
      const categories = [...totals.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-PT"))
        .map(([name, amount]) => `${name}: ${formatter.format(amount)}`);
      const month = now.toLocaleString("pt-PT", { month: "long", year: "numeric" });
      const summary = transactions?.length
        ? `${month}\n${transactions.length} ${transactions.length === 1 ? "despesa" : "despesas"} · ${formatter.format(total)}\n\n${categories.join("\n")}`
        : `${month}\nAinda não há despesas registadas neste mês.`;
      replaceLoading(loadingId, { from: "bot", kind: "summary", text: summary });
    } catch (error: unknown) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      replaceLoading(loadingId, { from: "bot", kind: "text", text: "❌ Não consegui gerar o resumo." });
    } finally {
      setBusy(false);
    }
  };

  if (!subscription.isLoading && !capabilitiesForSubscription(subscription.data).whatsapp) {
    return <div className="mx-auto max-w-lg py-16 text-center"><MessageCircle size={36} className="mx-auto text-muted-foreground/50" /><h2 className="mt-4 font-serif text-2xl font-semibold">WhatsApp no plano Pro</h2><p className="mt-2 text-sm text-muted-foreground">Ativa uma assinatura para registar despesas e recibos automaticamente.</p><Button asChild className="mt-5"><Link to="/dashboard/assinatura">Ver planos</Link></Button></div>;
  }

  if (!verified) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Partilhar e automatizar" title="WhatsApp" description="Regista despesas por mensagem e envia fotos de recibos para processamento automático." />
        <div className="mx-auto max-w-md space-y-4 py-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <MessageCircle size={26} />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Liga o teu WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Regista despesas por mensagem e envia fotos de recibos para que sejam processadas automaticamente.
        </p>
        <Link to="/onboarding/whatsapp">
          <Button className="gap-2"><MessageCircle size={16} /> Conectar WhatsApp</Button>
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-180px)] min-h-[500px] rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Chat header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold">
          💰
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight truncate">Moedas Bot</div>
          <div className="text-xs opacity-90 flex items-center gap-1">
            <CheckCircle2 size={11} /> +{WA_BOT_NUMBER}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={handleSummary} disabled={busy} className="gap-1.5 h-8">
          <Calendar size={14} /> Resumo
        </Button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]/5"
        style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--muted)) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
      >
        {bubbles.map((b) => (
          <div key={b.id} className={`flex ${b.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
              b.from === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-card border border-border rounded-bl-sm"
            }`}>
              {b.kind === "image" && b.imageUrl && (
                <img src={b.imageUrl} alt="recibo" className="rounded-lg max-h-64 object-cover" />
              )}
              {b.kind === "loading" && (
                <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {b.text}</div>
              )}
              {b.kind === "text" && (
                <p className="whitespace-pre-wrap leading-relaxed">{b.text}</p>
              )}
              {b.kind === "summary" && (
                <div>
                  <div className="font-semibold mb-1 flex items-center gap-1.5"><Calendar size={14} /> Resumo do mês</div>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{b.text}</p>
                </div>
              )}
              {b.kind === "items" && (
                <div className="space-y-1.5">
                  <div className="font-semibold">✅ {b.items!.length} {b.items!.length === 1 ? "item registado" : "itens registados"}!</div>
                  <ul className="space-y-0.5 text-[13px]">
                    {b.items!.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">• {it.name} <span className="text-muted-foreground">· {it.category}</span></span>
                        <span className="font-medium tabular-nums">{sym}{Number(it.amount).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  {b.total != null && (
                    <div className="pt-1.5 border-t border-border flex justify-between font-semibold">
                      <span>💰 Total</span>
                      <span className="tabular-nums">{sym}{Number(b.total).toFixed(2)}</span>
                    </div>
                  )}
                  <Link to="/dashboard" className="block text-xs text-primary hover:underline pt-1">
                    Ver no dashboard →
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-2 bg-card flex items-center gap-2 shrink-0">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0"
          aria-label="Anexar foto"
        >
          <Camera size={20} />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleText()}
          placeholder='Ex: "Gastei 12€ no almoço"'
          disabled={busy}
          className="flex-1 rounded-full"
        />
        <Button
          size="icon"
          onClick={handleText}
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-full"
          aria-label="Enviar"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardWhatsApp;
