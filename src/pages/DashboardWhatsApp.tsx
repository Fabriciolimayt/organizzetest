import { useState } from "react";
import { MessageCircle, Camera, Receipt, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import DashboardCard from "@/components/dashboard/DashboardCard";

const DashboardWhatsApp = () => {
  const [connected, setConnected] = useState(false);
  const [phone, setPhone] = useState("");
  const [autoLog, setAutoLog] = useState(true);
  const [monthly, setMonthly] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Integração com WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Registre despesas e receba relatórios direto no WhatsApp.
        </p>
      </div>

      <DashboardCard>
        <div className="flex items-start gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MessageCircle size={22} />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold">
                {connected ? "WhatsApp conectado" : "Conectar número"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {connected
                  ? phone
                  : "Confirme seu número via mensagem para começar."}
              </p>
            </div>
            {!connected ? (
              <div className="flex gap-2">
                <Input
                  placeholder="+55 11 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button onClick={() => phone && setConnected(true)}>Conectar</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConnected(false)}>
                Desconectar
              </Button>
            )}
          </div>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Como funciona">
          <div className="space-y-4 py-2">
            {[
              { icon: MessageCircle, t: "Texto", d: "“Gastei R$ 45 no mercado” → despesa registrada." },
              { icon: Camera, t: "Foto do recibo", d: "OCR automático lê valor e categoria." },
              { icon: Calendar, t: "Relatório no dia 25", d: "Resumo mensal completo no WhatsApp." },
            ].map((it) => (
              <div key={it.t} className="flex gap-3">
                <it.icon size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{it.t}</p>
                  <p className="text-xs text-muted-foreground">{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Preferências">
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Registro automático</p>
                <p className="text-xs text-muted-foreground">Mensagens viram despesas.</p>
              </div>
              <Switch checked={autoLog} onCheckedChange={setAutoLog} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Relatório mensal (dia 25)</p>
                <p className="text-xs text-muted-foreground">Receba o resumo no WhatsApp.</p>
              </div>
              <Switch checked={monthly} onCheckedChange={setMonthly} />
            </div>
            <div className="border-t border-border pt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt size={14} /> Disponível nos planos Mensal e Anual.
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default DashboardWhatsApp;
