import { FormEvent, useEffect, useState } from "react";

import type { FinancialGoalInput } from "@/hooks/useFinancialControlsV2";
import { validateGoalInput } from "@/hooks/useFinancialControlsV2";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  goal?: (Partial<FinancialGoalInput> & { id: string }) | null;
  saving?: boolean;
  onSubmit: (input: FinancialGoalInput) => Promise<void>;
};

function initialValues(currency: string, goal?: GoalDialogProps["goal"]): FinancialGoalInput {
  return {
    name: goal?.name ?? "",
    targetAmount: goal?.targetAmount ?? 0,
    currentAmount: goal?.currentAmount ?? 0,
    currency,
    targetDate: goal?.targetDate ?? null,
  };
}

const GoalDialog = ({ open, onOpenChange, currency, goal, saving = false, onSubmit }: GoalDialogProps) => {
  const [values, setValues] = useState(() => initialValues(currency, goal));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues(currency, goal));
      setError(null);
    }
  }, [currency, goal, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Indica um nome para o objetivo.");
      return;
    }
    const validationError = validateGoalInput({ ...values, currency }, currency);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      await onSubmit({ ...values, name: values.name.trim(), currency });
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível guardar o objetivo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="goal-name">Objetivo</Label>
            <Input
              id="goal-name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Fundo de emergência"
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Valor alvo ({currency})</Label>
              <Input
                id="goal-target"
                type="number"
                min="0.01"
                step="0.01"
                value={values.targetAmount || ""}
                onChange={(event) => setValues((current) => ({ ...current, targetAmount: Number(event.target.value) || 0 }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Progresso atual ({currency})</Label>
              <Input
                id="goal-current"
                type="number"
                min="0"
                step="0.01"
                value={values.currentAmount || ""}
                onChange={(event) => setValues((current) => ({ ...current, currentAmount: Number(event.target.value) || 0 }))}
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-date">Data alvo (opcional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={values.targetDate ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, targetDate: event.target.value || null }))}
              disabled={saving}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar objetivo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
