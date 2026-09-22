import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Send,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  Receipt,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { supabaseV2 } from "@/integrations/supabase/v2";
import { fileToCompressedBase64 } from "@/lib/whatsapp";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { capabilitiesForSubscription } from "@/lib/finance/capabilities";
import { useAuth } from "@/hooks/useAuth";

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
  {
    id: "1",
    from: "bot",
    kind: "text",
    ts: Date.now() - 60000,
    text: "WhatsApp conectado e verificado.\n\nPodes agora:\nEnviar fotos de recibos: cada item é registado automaticamente com IA.\nEscrever uma despesa, por exemplo: \"Gastei 45" + (currency === "BRL" ? "R$" : currency === "MZN" ? "Mt" : currency === "USD" ? "$" : "€") + " no supermercado\".\n\nNo dia 25 de cada mês recebes aqui o teu resumo inteligente.",
  },
]);

const DashboardWhatsApp = () => {
  const { user } = useAuth();
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
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabaseV2
        .from("whatsapp_connections")
        .select("id, status")
        .eq("linked_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (data) setVerified(true);
    })();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bubbles));
    historyEndRef.current?.scrollIntoView({
      block: "end",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [bubbles]);

  const resolveFinancialContext = useCallback(async (): Promise<FinancialContext> => {
    const context = financial.data;
    if (!context?.canWrite) throw new Error("Não tens um espaço ativo com permissão para registar despesas.");
    const expenseCategories = (context.categories ?? [])
      .filter((category) => category.transaction_type === "expense")
      .map((c) => ({ id: c.id, name: c.name }));

    return {
      userId: context.userId,
      spaceId: context.spaceId,
      currency: context.currency,
      categories: expenseCategories,
    };
  }, [financial.data]);

  const recordExpense = useCallback(
    async (item: ExpenseItem, occurredAt?: string) => {
      const ctx = await resolveFinancialContext();
      const targetCategory = item.category?.trim() ? CATEGORY_ALIASES[normalizedName(item.category)] || item.category : "Geral";
      let categoryId = ctx.categories.find((c) => normalizedName(c.name) === normalizedName(targetCategory))?.id;

      if (!categoryId) {
        const { data: created, error } = await supabaseV2
          .from("categories")
          .insert({
            space_id: ctx.spaceId,
            name: targetCategory,
            transaction_type: "expense",
          })
          .select("id")
          .single();
        if (error) throw error;
        categoryId = created.id;
      }

      const { error } = await supabaseV2.from("transactions").insert({
        space_id: ctx.spaceId,
        created_by: ctx.userId,
        category_id: categoryId,
        amount: item.amount,
        currency: ctx.currency,
        description: item.name,
        transaction_type: "expense",
        source: "app",
        status: "cleared",
        occurred_at: validOccurredAt(occurredAt),
      });
      if (error) throw error;
    },
    [resolveFinancialContext],
  );

  const handlePhoto = async (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    const userBubble: Bubble = { id: String(Date.now()), from: "user", kind: "image", imageUrl: tempUrl, ts: Date.now() };
    const loadingBubble: Bubble = { id: String(Date.now() + 1), from: "bot", kind: "loading", text: "A analisar recibo com IA...", ts: Date.now() };
    setBubbles((b) => [...b, userBubble, loadingBubble]);
    setBusy(true);

    try {
      const base64 = await fileToCompressedBase64(file);
      const { data, error } = await supabase.functions.invoke("process-receipt-v2", {
        body: { image_base64: base64, mime_type: file.type || "image/jpeg" },
      });
      if (error) throw error;

      const items = (data?.items || []) as ExpenseItem[];
      const receiptDate = data?.date;
      for (const item of items) {
        await recordExpense(item, receiptDate);
      }

      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        {
          id: String(Date.now()),
          from: "bot",
          kind: "items",
          items,
          total: items.reduce((s, it) => s + Number(it.amount), 0),
          ts: Date.now(),
        },
      ]);
    } catch (err) {
      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        { id: String(Date.now()), from: "bot", kind: "text", text: `Erro: ${errorMessage(err)}`, ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleText = async () => {
    const raw = text.trim();
    if (!raw || busy) return;
    setText("");
    const userBubble: Bubble = { id: String(Date.now()), from: "user", kind: "text", text: raw, ts: Date.now() };
    const loadingBubble: Bubble = { id: String(Date.now() + 1), from: "bot", kind: "loading", text: "A registar despesa...", ts: Date.now() };
    setBubbles((b) => [...b, userBubble, loadingBubble]);
    setBusy(true);

    try {
      const match = raw.match(/(\d+(?:[.,]\d+)?)/);
      const amount = match ? parseFloat(match[1].replace(",", ".")) : 10;
      const name = raw.replace(/\d+(?:[.,]\d+)?\s*(?:€|\$|R\$|Mt)?/i, "").trim() || "Despesa rápida";
      await recordExpense({ name, amount, category: "Geral" });

      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        {
          id: String(Date.now()),
          from: "bot",
          kind: "items",
          items: [{ name, amount, category: "Geral" }],
          total: amount,
          ts: Date.now(),
        },
      ]);
    } catch (err) {
      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        { id: String(Date.now()), from: "bot", kind: "text", text: `Erro: ${errorMessage(err)}`, ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleSummary = async () => {
    const loadingBubble: Bubble = { id: String(Date.now()), from: "bot", kind: "loading", text: "A calcular o resumo do mês...", ts: Date.now() };
    setBubbles((b) => [...b, loadingBubble]);
    setBusy(true);

    try {
      const ctx = await resolveFinancialContext();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: txs, error } = await supabaseV2
        .from("transactions")
        .select("amount, category_id, transaction_type")
        .eq("space_id", ctx.spaceId)
        .gte("occurred_at", startOfMonth)
        .neq("status", "void");
      if (error) throw error;

      const total = (txs || []).reduce((s, t) => s + (t.transaction_type === "expense" ? Number(t.amount) : 0), 0);
      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        {
          id: String(Date.now()),
          from: "bot",
          kind: "summary",
          text: `Resumo até agora:\nTotal gasto este mês: ${sym}${total.toFixed(2)}\nLançamentos analisados: ${(txs || []).length}`,
          ts: Date.now(),
        },
      ]);
    } catch (err) {
      setBubbles((b) => [
        ...b.filter((x) => x.kind !== "loading"),
        { id: String(Date.now()), from: "bot", kind: "text", text: `Erro: ${errorMessage(err)}`, ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (!subscription.isLoading && !capabilitiesForSubscription(subscription.data).whatsapp) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          eyebrow="Partilhar e automatizar"
          title="Automação WhatsApp"
          description="Regista despesas por mensagem ou foto de recibo."
        />
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <WifiOff size={20} className="text-muted-foreground" />
            <p className="text-sm font-medium">Funcionalidade indisponível no plano atual</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A automação via WhatsApp está disponível nos planos Pro e Premium Elite. Faz upgrade para registar
            despesas por mensagem, foto de recibo, e receber o resumo mensal automático.
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/dashboard/assinatura">
              Ver planos <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          eyebrow="Partilhar e automatizar"
          title="Automação WhatsApp"
          description="Regista despesas por mensagem ou foto de recibo."
        />
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <WifiOff size={20} className="text-muted-foreground" />
            <p className="text-sm font-medium">WhatsApp não ligado</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Liga o teu número de WhatsApp para começar a registar despesas automaticamente. O processo demora menos de
            dois minutos.
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/onboarding/whatsapp">
              Ligar WhatsApp <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Partilhar e automatizar"
        title="Automação WhatsApp"
        description="Testa o registo automático e acompanha cada resultado antes de o consultar no dashboard."
        actions={
          <div className="flex min-h-10 items-center gap-2 text-body-small font-semibold text-financial-income">
            <Wifi size={15} aria-hidden="true" />
            WhatsApp ligado
          </div>
        }
      />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]">
        <section className="functional-panel min-w-0" aria-labelledby="whatsapp-test-title">
          <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="font-mono text-label uppercase text-muted-foreground">Ferramenta autenticada</p>
              <h2 id="whatsapp-test-title" className="mt-1 text-panel-title text-foreground">Registo de teste</h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleSummary} disabled={busy} className="gap-2">
              <Receipt size={14} aria-hidden="true" /> Resumo do mês
            </Button>
          </header>

          <div className="divide-y divide-border px-4 sm:px-5" aria-live="polite">
            {bubbles.map((bubble) => {
              const isError = bubble.kind === "text" && bubble.text?.startsWith("Erro:");
              return (
                <article key={bubble.id} className="flex min-w-0 gap-3 py-4">
                  <span className={`surface-quiet flex size-9 shrink-0 items-center justify-center ${
                    bubble.kind === "items"
                      ? "text-financial-income"
                      : isError
                        ? "text-financial-expense"
                        : bubble.kind === "summary"
                          ? "text-intelligence"
                          : "text-muted-foreground"
                  }`} aria-hidden="true">
                    {bubble.kind === "image" && <Camera size={16} />}
                    {bubble.kind === "items" && <CheckCircle2 size={16} />}
                    {bubble.kind === "summary" && <Receipt size={16} />}
                    {bubble.kind === "loading" && <Loader2 size={16} className="animate-spin" />}
                    {bubble.kind === "text" && <MessageSquare size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-label uppercase text-muted-foreground">
                        {bubble.from === "user" ? "Teste enviado" : bubble.kind === "summary" ? "Resumo mensal" : "Automação"}
                      </p>
                      <time className="text-label text-muted-foreground" dateTime={new Date(bubble.ts).toISOString()}>
                        {new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(bubble.ts))}
                      </time>
                    </div>
                    {bubble.kind === "image" && bubble.imageUrl && (
                      <img src={bubble.imageUrl} alt="Recibo enviado para teste" className="mt-2 max-h-56 max-w-full rounded-md border border-border object-cover" />
                    )}
                    {(bubble.kind === "text" || bubble.kind === "loading") && (
                      <p className={`mt-1 whitespace-pre-wrap text-body-small leading-relaxed ${isError ? "text-financial-expense" : "text-muted-foreground"}`}>
                        {bubble.text}
                      </p>
                    )}
                    {bubble.kind === "summary" && <p className="mt-1 whitespace-pre-wrap text-body-small text-muted-foreground">{bubble.text}</p>}
                    {bubble.kind === "items" && (
                      <div className="mt-2 space-y-3">
                        <p className="text-body-small font-semibold text-financial-income">
                          {bubble.items!.length} {bubble.items!.length === 1 ? "item registado" : "itens registados"}
                        </p>
                        <ul className="divide-y divide-border border-y border-border">
                          {bubble.items!.map((item, index) => (
                            <li key={`${item.name}-${index}`} className="flex min-w-0 items-start justify-between gap-3 py-2 text-body-small">
                              <span className="min-w-0 break-words text-foreground">
                                {item.name} <span className="text-muted-foreground">· {item.category}</span>
                              </span>
                              <span className="financial-value shrink-0 font-semibold text-financial-expense">{sym}{Number(item.amount).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {bubble.total != null && <p className="financial-value text-body-small font-semibold text-foreground">Total {sym}{Number(bubble.total).toFixed(2)}</p>}
                          <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-body-small font-semibold text-intelligence hover:underline">
                            Ver no dashboard <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={historyEndRef} data-whatsapp-history-end aria-hidden="true" />
          </div>

          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-border p-3 sm:p-4">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={busy} className="shrink-0" aria-label="Anexar foto de recibo" title="Anexar foto de recibo">
              <Camera size={17} aria-hidden="true" />
            </Button>
            <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleText()} placeholder='Ex.: "Gastei 12€ no almoço"' disabled={busy} className="min-w-0" />
            <Button size="icon" onClick={handleText} disabled={busy || !text.trim()} className="shrink-0" aria-label="Enviar despesa" title="Enviar despesa">
              <Send size={16} aria-hidden="true" />
            </Button>
          </div>
        </section>

        <aside className="min-w-0 space-y-4" aria-label="Estado da automação">
          <section className="functional-panel min-w-0 p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="surface-quiet flex size-9 shrink-0 items-center justify-center text-financial-income" aria-hidden="true"><CheckCircle2 size={17} /></span>
              <div className="min-w-0">
                <p className="text-body-small font-semibold text-foreground">Ligação verificada</p>
                <p className="mt-1 text-body-small text-muted-foreground">Envios ativos para</p>
                <p className="financial-value mt-1 [overflow-wrap:anywhere] text-body-small font-semibold text-foreground">+{WA_BOT_NUMBER}</p>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-border border-y border-border text-body-small">
              <div className="flex items-center justify-between gap-3 py-3"><dt className="text-muted-foreground">Texto manual</dt><dd className="font-semibold text-financial-income">Ativo</dd></div>
              <div className="flex items-center justify-between gap-3 py-3"><dt className="text-muted-foreground">Leitura de recibos</dt><dd className="font-semibold text-financial-income">Ativa</dd></div>
              <div className="flex items-center justify-between gap-3 py-3"><dt className="text-muted-foreground">Resumo mensal</dt><dd className="font-semibold text-intelligence">Dia 25</dd></div>
            </dl>
          </section>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/dashboard/diagnostico-whatsapp">Diagnóstico técnico <ArrowRight size={15} aria-hidden="true" /></Link>
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default DashboardWhatsApp;
