import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Send, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";
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

type DiagnosticTestResponse = {
  ok?: boolean;
  status?: unknown;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

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
    } catch (e: unknown) {
      toast({ title: "Erro a carregar diagnóstico", description: getErrorMessage(e), variant: "destructive" });
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
      const result = res as DiagnosticTestResponse | null;
      if (result?.ok) toast({ title: "Mensagem de teste enviada" });
      else toast({ title: "Falhou ao enviar", description: `Status ${result?.status}`, variant: "destructive" });
      load();
    } catch (e: unknown) {
      toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Partilhar e automatizar"
        title="Diagnóstico WhatsApp"
        description="Estado técnico da integração e últimos eventos recebidos pelo webhook."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Atualizar
          </Button>
        }
      />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)]">
        <section className="functional-panel min-w-0" aria-labelledby="webhook-events-title">
          <header className="border-b border-border px-4 py-4 sm:px-5">
            <p className="font-mono text-label uppercase text-muted-foreground">Atividade recebida</p>
            <h2 id="webhook-events-title" className="mt-1 text-panel-title text-foreground">Últimos eventos do webhook</h2>
          </header>
          {data?.events.length ? (
            <ul className="divide-y divide-border px-4 sm:px-5">
              {data.events.map((ev) => (
                <li key={ev.id} className="flex min-w-0 items-start gap-3 py-4">
                  <span className={`surface-quiet flex size-9 shrink-0 items-center justify-center ${ev.success ? "text-financial-income" : "text-financial-expense"}`} aria-hidden="true">
                    {ev.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                      <code className="break-all font-mono text-body-small font-semibold text-foreground">{ev.event_type}</code>
                      <span className={`text-label font-semibold ${ev.success ? "text-financial-income" : "text-financial-expense"}`}>
                        {ev.success ? "Processado" : "Falhou"}
                      </span>
                      <time className="ml-auto text-label text-muted-foreground" dateTime={ev.created_at}>
                        {new Date(ev.created_at).toLocaleString("pt-PT")}
                      </time>
                    </div>
                    {ev.phone && <p className="financial-value mt-1 text-label text-muted-foreground">+{ev.phone}</p>}
                    {ev.summary && <p className="mt-2 text-body-small text-foreground">{ev.summary}</p>}
                    {ev.error && <p className="mt-2 break-words text-body-small text-financial-expense">{ev.error}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-body-small font-semibold text-foreground">Ainda sem eventos</p>
              <p className="mt-1 text-body-small text-muted-foreground">Envia uma mensagem para o bot ou configura o webhook na Datafy.</p>
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-4" aria-label="Estado técnico da integração">
          <section className="functional-panel min-w-0 p-5" aria-labelledby="linked-number-title">
            <p className="font-mono text-label uppercase text-muted-foreground">Ligação</p>
            <h2 id="linked-number-title" className="mt-1 text-compact-title text-foreground">Número ligado</h2>
            {data?.linkedPhone ? (
              <div className="mt-4 min-w-0">
                <div className="flex items-center gap-2 text-body-small font-semibold text-financial-income"><CheckCircle2 size={15} aria-hidden="true" /> Ativo</div>
                <p className="financial-value mt-2 [overflow-wrap:anywhere] text-base font-semibold text-foreground">+{data.linkedPhone}</p>
                <p className="mt-1 text-label text-muted-foreground">Ligado em {new Date(data.linkedAt!).toLocaleString("pt-PT")}</p>
                <Button onClick={sendTest} disabled={sending} className="mt-4 w-full gap-2">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Enviar teste
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2 text-body-small text-financial-warning">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>Nenhum número ligado. Conclui o onboarding do WhatsApp.</span>
              </div>
            )}
          </section>

          <section className="functional-panel min-w-0 p-5" aria-labelledby="secrets-title">
            <p className="font-mono text-label uppercase text-muted-foreground">Infraestrutura</p>
            <h2 id="secrets-title" className="mt-1 text-compact-title text-foreground">Configuração de secrets</h2>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {data
                ? Object.entries(data.secrets).map(([key, ok]) => (
                    <div key={key} className="flex min-w-0 items-start gap-2 py-3">
                      {ok
                        ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-financial-income" aria-hidden="true" />
                        : <XCircle size={15} className="mt-0.5 shrink-0 text-financial-expense" aria-hidden="true" />}
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-body-small font-medium text-foreground">{SECRET_LABELS[key] ?? key}</p>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                          <code className="break-all font-mono text-label text-muted-foreground">{key}</code>
                          <span className={`text-label font-semibold ${ok ? "text-financial-income" : "text-financial-expense"}`}>{ok ? "Configurado" : "Em falta"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                : <p className="py-4 text-body-small text-muted-foreground">A carregar...</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardDiagnosticoWhatsApp;
