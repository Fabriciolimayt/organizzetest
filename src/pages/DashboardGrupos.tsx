import { Plus, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardCard from "@/components/dashboard/DashboardCard";

const members = [
  { name: "Você", email: "voce@email.com", role: "Admin", initials: "VC" },
];

const DashboardGrupos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">Grupos familiares</h2>
          <p className="text-sm text-muted-foreground">
            Compartilhe o orçamento com parceiro(a) ou colegas de casa.
          </p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Novo grupo
        </Button>
      </div>

      <DashboardCard>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Casa</h3>
              <p className="text-xs text-muted-foreground">{members.length} membro(s)</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {members.map((m) => (
              <div key={m.email} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Convidar por e-mail</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="email@exemplo.com" className="pl-9" />
              </div>
              <Button>Convidar</Button>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

export default DashboardGrupos;
