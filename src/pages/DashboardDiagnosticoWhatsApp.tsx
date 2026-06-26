import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Send, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type DiagEvent = {
  id: string;
  event_type: string;
  phone: string | null;
  success: boolean;
  summary: string | null;
  error: string | null;
  created_at: string;
};

type DiagData = {
  secrets: Record<string, boolean>;
  linkedPhone: string | null;
  linkedAt: string | null;
  events: DiagEvent[];
};

const SECRET_LABELS: Record<string, string> = {
  DATAFY_TOKEN: "Datafy Token (sk_live_...)",
  DATAFY_WEBHOOK_SECRET: "Webhook secret (assinatura)",
  WHATSAPP_VERIFY_TOKEN: "Verify token (handshake)",
  WHATSAPP_PHONE_ID: "Phone Number ID",
  GEMINI_API_KEY: "Gemini API Key (OCR)",
};

const DashboardDiagnosticoWhatsApp = () => {
  const [data, setData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke("whatsapp-diagnostico", { method: "GET" });
      if (error) throw error;
      setData(res as DiagData);
    } catch (e: any) {
      toast({ title: "Erro a carregar diagnóstico", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const sendTest = async () => {
    setSending(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("whatsapp-diagnostico", { method: "POST" });
      if (error) throw error;
      if ((res as any)?.ok) toast({ title: "✅ Mensagem de teste enviada" });
      else toast({ title: "❌ Falhou ao enviar", description: `Status ${(res as any)?.status}`, variant: "destructive" });
      load();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Diagnóstico WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Estado da integração Datafy + últimos eventos do webhook.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      {/* Secrets */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold mb-3">Configuração de secrets</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {data
            ? Object.entries(data.secrets).map(([k, ok]) => (
                <div key={k} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                  {ok ? <CheckCircle2 size={16} className="text-primary" /> : <XCircle size={16} className="text-destructive" />}
                  <div className="text-sm">
                    <div className="font-medium">{SECRET_LABELS[k] ?? k}</div>
                    <code className="text-xs text-muted-foreground">{k}</code>
                  </div>
                </div>
              ))
            : <p className="text-sm text-muted-foreground">A carregar...</p>}
        </div>
      </section>

      {/* Linked number + test */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold mb-3">Número ligado</h2>
        {data?.linkedPhone ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-lg font-mono">+{data.linkedPhone}</div>
              <div className="text-xs text-muted-foreground">Ligado em {new Date(data.linkedAt!).toLocaleString("pt-PT")}</div>
            </div>
            <Button onClick={sendTest} disabled={sending} className="gap-2">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar mensagem de teste
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle size={16} /> Nenhum número ligado ainda. Conclui o onboarding para ligar o teu WhatsApp.
          </div>
        )}
      </section>

      {/* Events */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold mb-3">Últimos eventos do webhook</h2>
        {data?.events.length ? (
          <ul className="divide-y divide-border">
            {data.events.map((ev) => (
              <li key={ev.id} className="py-3 flex items-start gap-3">
                {ev.success
                  ? <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  : <XCircle size={16} className="text-destructive mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono font-semibold">{ev.event_type}</code>
                    {ev.phone && <span className="text-xs text-muted-foreground">+{ev.phone}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(ev.created_at).toLocaleString("pt-PT")}
                    </span>
                  </div>
                  {ev.summary && <p className="text-sm mt-0.5">{ev.summary}</p>}
                  {ev.error && <p className="text-xs text-destructive mt-0.5 break-words">{ev.error}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda sem eventos. Envia uma mensagem para o bot ou configura o webhook na Datafy.
          </p>
        )}
      </section>
    </div>
  );
};

export default DashboardDiagnosticoWhatsApp;
