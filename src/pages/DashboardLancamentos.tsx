import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Loader2, Pencil, Plus, Trash2, WalletCards } from "lucide-react";

import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/dashboard/EmptyState";
import FinancialRow from "@/components/dashboard/FinancialRow";
import MetricStrip from "@/components/dashboard/MetricStrip";
import MonthSelector from "@/components/dashboard/MonthSelector";
import PageHeader from "@/components/dashboard/PageHeader";
import TransactionDialog from "@/components/finance/TransactionDialog";
import TransactionFilters from "@/components/finance/TransactionFilters";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import {
  useCreateTransactionV2, useDeleteTransactionV2, useTransactionsV2, useUpdateTransactionV2,
  type TransactionFilters as Filters, type TransactionFormValues,
} from "@/hooks/useTransactionsV2";
import type { TransactionV2 } from "@/integrations/supabase/v2";
import { monthRange, shiftMonth } from "@/lib/finance/month";
import { formatCurrency } from "@/lib/finance/money";
import { summarizeTransactions } from "@/lib/finance/reports";

const INITIAL_FILTERS: Filters = { search: "", type: "all", categoryId: "all", status: "all" };
const titleCase = (value: string) => value.charAt(0).toLocaleUpperCase("pt-PT") + value.slice(1);

export default function DashboardLancamentos() {
  const [anchor, setAnchor] = useState(new Date());
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionV2 | null>(null);
  const [deleting, setDeleting] = useState<TransactionV2 | null>(null);

  const financialContext = useFinancialContext();
  const context = financialContext.data;
  const range = useMemo(() => monthRange(anchor, context?.timezone ?? "UTC"), [anchor, context?.timezone]);
  const query = useTransactionsV2(range, filters);
  const createTransaction = useCreateTransactionV2();
  const updateTransaction = useUpdateTransactionV2();
  const deleteTransaction = useDeleteTransactionV2();

  const categories = useMemo(
    () => (context?.categories ?? []).filter((category) => category.transaction_type === "expense"),
    [context?.categories],
  );
  const categoryNames = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const summary = useMemo(() => summarizeTransactions(query.data ?? [], categoryNames), [categoryNames, query.data]);
  const locale = context?.locale ?? "pt-PT";
  const currency = context?.currency ?? "EUR";
  const monthLabel = titleCase(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: context?.timezone ?? "UTC" }).format(anchor));

  const submit = async (values: TransactionFormValues) => {
    if (editing) await updateTransaction.mutateAsync({ id: editing.id, values });
    else await createTransaction.mutateAsync(values);
    toast({ title: editing ? "Lançamento atualizado" : "Lançamento registado" });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTransaction.mutateAsync(deleting.id);
      toast({ title: "Lançamento eliminado" });
      setDeleting(null);
    } catch (error) {
      toast({ title: "Não foi possível eliminar", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const loading = query.isLoading || query.context.isLoading;
  const error = query.error ?? query.context.error;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Acompanhar"
        title="Lançamentos"
        description="Consulta e mantém todas as movimentações do teu espaço."
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }} disabled={!context?.canWrite}><Plus size={16} /> Novo lançamento</Button>}
      />

      <DashboardCard>
        <div className="space-y-5">
          <MonthSelector month={monthLabel} onPrevious={() => setAnchor((current) => shiftMonth(current, -1, context?.timezone ?? "UTC"))} onNext={() => setAnchor((current) => shiftMonth(current, 1, context?.timezone ?? "UTC"))} />
          <MetricStrip items={[
            { label: "Receitas", value: formatCurrency(summary.income, currency, locale), variant: "positive" },
            { label: "Despesas", value: formatCurrency(summary.expenses, currency, locale), variant: "negative" },
            { label: "Saldo", value: formatCurrency(summary.balance, currency, locale), variant: summary.balance >= 0 ? "positive" : "negative" },
          ]} className="grid-cols-3 sm:grid-cols-3" />
          <TransactionFilters value={filters} categories={categories} onChange={setFilters} />

          {loading ? <Loading /> : error ? (
            <div className="py-12 text-center"><p className="text-sm text-destructive">Não foi possível carregar os lançamentos.</p><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Tentar novamente</Button></div>
          ) : query.data.length === 0 ? (
            <EmptyState icon={<WalletCards size={48} />} message="Nenhum lançamento corresponde a este período e filtros." action={context?.canWrite ? <Button variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={16} /> Registar o primeiro</Button> : undefined} />
          ) : (
            <div className="divide-y divide-border">
              {query.data.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} categoryName={categoryNames.get(transaction.category_id ?? "")} currency={currency} locale={locale} timezone={context?.timezone ?? "UTC"} canWrite={Boolean(context?.canWrite)} onEdit={() => { setEditing(transaction); setDialogOpen(true); }} onDelete={() => setDeleting(transaction)} />)}
            </div>
          )}
        </div>
      </DashboardCard>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editing} categories={categories} currency={currency} locale={locale} timezone={context?.timezone ?? "UTC"} busy={createTransaction.isPending || updateTransaction.isPending} onSubmit={submit} />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deleteTransaction.isPending) setDeleting(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar lançamento?</AlertDialogTitle><AlertDialogDescription>O lançamento deixa de aparecer nos totais e relatórios, mas permanece no histórico técnico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteTransaction.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void confirmDelete(); }} disabled={deleteTransaction.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" /> A carregar lançamentos...</div>;
}

function TransactionRow({ transaction, categoryName, currency, locale, timezone, canWrite, onEdit, onDelete }: { transaction: TransactionV2; categoryName?: string; currency: string; locale: string; timezone: string; canWrite: boolean; onEdit: () => void; onDelete: () => void }) {
  const income = transaction.transaction_type === "income";
  const transfer = transaction.transaction_type === "transfer";
  const voided = transaction.status === "void";
  return (
    <FinancialRow
      icon={income ? <ArrowDownLeft size={17} /> : transfer ? <ArrowLeftRight size={17} /> : <ArrowUpRight size={17} />}
      title={transaction.description || "Sem descrição"}
      meta={`${voided ? "Anulado" : transaction.merchant || categoryName || (transfer ? "Transferência" : "Sem categoria")} · ${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: timezone }).format(new Date(transaction.occurred_at))}`}
      amount={`${income ? "+" : transfer ? "" : "-"}${formatCurrency(transaction.amount, currency, locale)}`}
      amountTone={income ? "positive" : transfer ? "positive" : "default"}
      action={canWrite ? <span className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" title="Editar lançamento" onClick={onEdit}><Pencil size={15} /></Button><Button variant="ghost" size="icon" title="Eliminar lançamento" onClick={onDelete}><Trash2 size={15} /></Button></span> : undefined}
    />
  );
}
