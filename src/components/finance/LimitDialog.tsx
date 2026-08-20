import { FormEvent, useEffect, useState } from "react";

import type { RecurrencePeriod, SpendingLimitInput } from "@/hooks/useFinancialControlsV2";
import { validateLimitInput } from "@/hooks/useFinancialControlsV2";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  categories: Array<{ id: string; name: string }>;
  limit?: (Partial<SpendingLimitInput> & { id: string }) | null;
  saving?: boolean;
  onSubmit: (input: SpendingLimitInput) => Promise<void>;
};

const periodLabels: Record<RecurrencePeriod, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

function initialValues(currency: string, limit?: LimitDialogProps["limit"]): SpendingLimitInput {
  return {
    categoryId: limit?.categoryId ?? null,
    amount: limit?.amount ?? 0,
    currency,
    period: limit?.period ?? "monthly",
    startsOn: limit?.startsOn ?? new Date().toISOString().slice(0, 10),
  };
}

const LimitDialog = ({ open, onOpenChange, currency, categories, limit, saving = false, onSubmit }: LimitDialogProps) => {
  const [values, setValues] = useState(() => initialValues(currency, limit));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues(currency, limit));
      setError(null);
    }
  }, [currency, limit, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateLimitInput({ amount: values.amount, currency }, currency);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      await onSubmit({ ...values, currency });
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível guardar o limite.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{limit ? "Editar limite" : "Novo limite"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={values.categoryId ?? "all"}
              onValueChange={(value) => setValues((current) => ({ ...current, categoryId: value === "all" ? null : value }))}
              disabled={saving}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as despesas</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="limit-amount">Limite ({currency})</Label>
              <Input
                id="limit-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={values.amount || ""}
                onChange={(event) => setValues((current) => ({ ...current, amount: Number(event.target.value) || 0 }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <Select
                value={values.period}
                onValueChange={(value) => setValues((current) => ({ ...current, period: value as RecurrencePeriod }))}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(periodLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit-start">A partir de</Label>
            <Input
              id="limit-start"
              type="date"
              value={values.startsOn}
              onChange={(event) => setValues((current) => ({ ...current, startsOn: event.target.value }))}
              disabled={saving}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar limite"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LimitDialog;
