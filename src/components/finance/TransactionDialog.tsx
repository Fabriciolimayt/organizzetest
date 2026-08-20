import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionFormValues } from "@/hooks/useTransactionsV2";
import type { TransactionV2 } from "@/integrations/supabase/v2";
import { calendarDateInTimeZone, calendarDateToUtcPreservingInstant } from "@/lib/finance/month";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/finance/money";

type Props = {
  open: boolean; onOpenChange: (open: boolean) => void; transaction?: TransactionV2 | null;
  categories: Array<{ id: string; name: string }>; currency: string; locale: string; timezone: string; busy: boolean;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
};
const dateInputValue = (date: string | undefined, timezone: string) => calendarDateInTimeZone(date ? new Date(date) : new Date(), timezone);

export default function TransactionDialog({ open, onOpenChange, transaction, categories, currency, locale, timezone, busy, onSubmit }: Props) {
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [status, setStatus] = useState<"pending" | "cleared" | "void">("cleared");
  const [date, setDate] = useState(() => dateInputValue(undefined, timezone));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescription(transaction?.description ?? ""); setMerchant(transaction?.merchant ?? "");
    setAmount(transaction ? formatCurrencyInput(Number(transaction.amount), locale) : "");
    setCategoryId(transaction?.category_id ?? categories[0]?.id ?? "");
    setTransactionType(transaction?.transaction_type ?? "expense");
    setStatus(transaction?.status ?? "cleared");
    setDate(dateInputValue(transaction?.occurred_at, timezone)); setError(null);
  }, [categories, locale, open, timezone, transaction]);

  const submit = async () => {
    try {
      await onSubmit({ description, merchant, amount: parseCurrencyInput(amount, locale), categoryId: transactionType === "expense" ? categoryId || null : null, transactionType, status, occurredAt: calendarDateToUtcPreservingInstant(date, timezone, transaction?.occurred_at).toISOString() });
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível guardar o lançamento.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-2"><Button type="button" variant={transactionType === "expense" ? "default" : "outline"} onClick={() => setTransactionType("expense")}>Despesa</Button><Button type="button" variant={transactionType === "income" ? "default" : "outline"} onClick={() => setTransactionType("income")}>Receita</Button><Button type="button" variant={transactionType === "transfer" ? "default" : "outline"} onClick={() => setTransactionType("transfer")}>Transferência</Button></div>
          <div className="space-y-1.5"><Label htmlFor="transaction-description">Descrição</Label><Input id="transaction-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Supermercado" autoFocus /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="transaction-amount">Valor ({currency})</Label><Input id="transaction-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" /></div>
            <div className="space-y-1.5"><Label htmlFor="transaction-date">Data</Label><Input id="transaction-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
          </div>
          {transactionType === "expense" && <div className="space-y-1.5"><Label>Categoria</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="Seleciona uma categoria" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-1.5"><Label>Estado</Label><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="cleared">Confirmado</SelectItem><SelectItem value="void">Anulado</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="transaction-merchant">Comerciante (opcional)</Label><Input id="transaction-merchant" value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="Ex.: Continente" /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button><Button type="button" onClick={() => void submit()} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
