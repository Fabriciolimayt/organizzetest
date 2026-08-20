import { FormEvent, useEffect, useState } from "react";

import type { BudgetPlanInput } from "@/hooks/useFinancialControlsV2";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  plan?: (Partial<BudgetPlanInput> & { id: string }) | null;
  saving?: boolean;
  onSubmit: (input: BudgetPlanInput) => Promise<void>;
};

const currentMonth = new Date().toISOString().slice(0, 7);

const endOfCurrentMonth = () => {
  const [year, month] = currentMonth.split("-").map(Number);
  return `${currentMonth}-${new Date(year, month, 0).getDate()}`;
};

function initialValues(currency: string, plan?: PlanDialogProps["plan"]): BudgetPlanInput {
  return {
    name: plan?.name ?? "",
    expectedIncome: plan?.expectedIncome ?? 0,
    periodStart: plan?.periodStart ?? `${currentMonth}-01`,
    periodEnd: plan?.periodEnd ?? endOfCurrentMonth(),
    currency,
  };
}

const PlanDialog = ({ open, onOpenChange, currency, plan, saving = false, onSubmit }: PlanDialogProps) => {
  const [values, setValues] = useState(() => initialValues(currency, plan));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues(currency, plan));
      setError(null);
    }
  }, [currency, open, plan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Indica um nome para o plano.");
      return;
    }
    if (values.periodEnd < values.periodStart) {
      setError("A data final deve ser posterior à data inicial.");
      return;
    }

    try {
      setError(null);
      await onSubmit({ ...values, name: values.name.trim(), currency });
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível guardar o plano.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plano" : "Novo plano"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nome</Label>
            <Input
              id="plan-name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Mês de férias"
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-income">Rendimento previsto ({currency})</Label>
            <Input
              id="plan-income"
              type="number"
              min="0"
              step="0.01"
              value={values.expectedIncome}
              onChange={(event) => setValues((current) => ({ ...current, expectedIncome: Number(event.target.value) || 0 }))}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-start">Início</Label>
              <Input
                id="plan-start"
                type="date"
                value={values.periodStart}
                onChange={(event) => setValues((current) => ({ ...current, periodStart: event.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-end">Fim</Label>
              <Input
                id="plan-end"
                type="date"
                value={values.periodEnd}
                onChange={(event) => setValues((current) => ({ ...current, periodEnd: event.target.value }))}
                disabled={saving}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar plano"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDialog;
