import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MessageCircle, Send, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { addExpenses, fileToCompressedBase64, type ExpenseEntry } from "@/lib/whatsapp";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { toast } from "@/hooks/use-toast";

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
const CATEGORY_TO_KEY: Record<string, string> = {
  "Alimentação": "necessidades",
  "Transporte": "necessidades",
  "Casa": "necessidades",
  "Saúde": "necessidades",
  "Lazer": "lazer",
  "Outros": "subscricoes",
};

const readBubbles = (): Bubble[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { return []; }
};

const seedBubbles = (currency: string): Bubble[] => ([
  { id: "1", from: "bot", kind: "text", ts: Date.now() - 60000,
    text: "✅ WhatsApp verificado!\n\nPodes agora:\n📸 Enviar fotos de recibos — cada item registado automaticamente\n✍️ Escrever uma despesa — ex: \"Gastei 45" + (currency === "BRL" ? "R$" : currency === "MZN" ? "Mt" : currency === "USD" ? "$" : "€") + "\"\n\nNo dia 25 de cada mês recebes aqui o teu resumo." },
]);

const DashboardWhatsApp = () => {
  const verified = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("organizze.whatsapp") || "null"); } catch { return null; }
  }, []);
  const currency = useMemo(() => localStorage.getItem("organizze.currency") || "EUR", []);
  const sym = currency === "BRL" ? "R$" : currency === "MZN" ? "Mt" : currency === "USD" ? "$" : "€";

  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const existing = readBubbles();
    return existing.length ? existing : seedBubbles(currency);
  });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bubbles));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles]);

  const push = (b: Omit<Bubble, "id" | "ts">) =>
    setBubbles((p) => [...p, { ...b, id: crypto.randomUUID(), ts: Date.now() }]);

  const replaceLoading = (loadingId: string, b: Omit<Bubble, "id" | "ts">) =>
    setBubbles((p) => p.map((x) => x.id === loadingId ? { ...x, ...b, id: loadingId, ts: x.ts } : x));

  const pushLoading = (text: string) => {
    const id = crypto.randomUUID();
    setBubbles((p) => [...p, { id, from: "bot", kind: "loading", text, ts: Date.now() }]);
    return id;
  };

  const persistExpenses = (items: Array<{ name: string; amount: number; category: string }>) => {
    const mapped: ExpenseEntry[] = items.map((it) => ({
      id: crypto.randomUUID(),
      name: it.name,
      amount: Number(it.amount) || 0,
      category: CATEGORY_TO_KEY[it.category] ?? "subscricoes",
      source: "whatsapp",
      createdAt: Date.now(),
    }));
    addExpenses(mapped);
  };

  const handlePhoto = async (file: File) => {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedBase64(file);
      push({ from: "user", kind: "image", imageUrl: dataUrl });
      const loadingId = pushLoading("🧾 Recibo recebido! A extrair os itens...");
      const { data, error } = await supabase.functions.invoke("parse-receipt", {
        body: { imageBase64: dataUrl, currency },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Falhou");
      const items = Array.isArray(data.items) ? data.items : [];
      const total = data.total ?? items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      if (!items.length) {
        replaceLoading(loadingId, { from: "bot", kind: "text", text: "Não consegui ler nenhum item neste recibo. Tenta outra foto?" });
      } else {
        replaceLoading(loadingId, { from: "bot", kind: "items", items, total, currency: data.currency || currency });
        persistExpenses(items);
      }
    } catch (e: any) {
      toast({ title: "Erro ao processar recibo", description: e.message, variant: "destructive" });
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
      const { data, error } = await supabase.functions.invoke("parse-expense-text", {
        body: { text: t, currency },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "Falhou");
      const amount = Number(data.amount);
      if (!amount) {
        replaceLoading(loadingId, { from: "bot", kind: "text", text: "Não percebi o valor. Tenta algo como \"Gastei 45" + sym + " no mercado\"." });
        return;
      }
      const item = { name: data.description || "Despesa", amount, category: data.category || "Outros" };
      replaceLoading(loadingId, { from: "bot", kind: "items", items: [item], total: amount, currency: data.currency || currency });
      persistExpenses([item]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
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
      const expenses = JSON.parse(localStorage.getItem("organizze.expenses") || "[]");
      const { data, error } = await supabase.functions.invoke("monthly-summary", {
        body: { expenses, currency, month: new Date().toLocaleString("pt-PT", { month: "long", year: "numeric" }) },
      });
      if (error || !data?.summary) throw new Error(error?.message || "Falhou");
      replaceLoading(loadingId, { from: "bot", kind: "summary", text: data.summary });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      replaceLoading(loadingId, { from: "bot", kind: "text", text: "❌ Não consegui gerar o resumo." });
    } finally {
      setBusy(false);
    }
  };

  if (!verified) {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-4">
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
