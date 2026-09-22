import { useMemo, useRef, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import {
  useCreateTransactionV2,
  useDeleteTransactionV2,
  useTransactionsV2,
  useUpdateTransactionV2,
  type TransactionFilters as Filters,
  type TransactionFormValues,
} from "@/hooks/useTransactionsV2";
import type { TransactionV2 } from "@/integrations/supabase/v2";
import { monthRange, shiftMonth } from "@/lib/finance/month";
import { formatCurrency } from "@/lib/finance/money";
import { summarizeTransactions } from "@/lib/finance/reports";

const INITIAL_FILTERS: Filters = { search: "", type: "all", categoryId: "all", status: "all" };
const titleCase = (value: string) => value.charAt(0).toLocaleUpperCase("pt-PT") + value.slice(1);

type TransactionPresentation = {
  transaction: TransactionV2;
  title: string;
  meta: string;
  counterpart: string;
  typeLabel: string;
  statusLabel: string;
  dateLabel: string;
  amountLabel: string;
  amountTone: "default" | "positive" | "negative";
  icon: React.ReactNode;
};

export default function DashboardLancamentos() {
  const [anchor, setAnchor] = useState(new Date());
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [dialogOpen, setDialogOpenState] = useState(false);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState<TransactionV2 | null>(null);
  const [deleting, setDeleting] = useState<TransactionV2 | null>(null);

  const setDialogOpen = (open: boolean) => {
    if (open && document.activeElement instanceof HTMLElement) {
      dialogTriggerRef.current = document.activeElement;
    }
    setDialogOpenState(open);
  };

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
  const timezone = context?.timezone ?? "UTC";
  const monthLabel = titleCase(
    new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: timezone }).format(anchor),
  );
  const transactionRows = useMemo(
    () => (query.data ?? []).map((transaction) => presentTransaction(transaction, categoryNames.get(transaction.category_id ?? ""), currency, locale, timezone)),
    [categoryNames, currency, locale, query.data, timezone],
  );

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
      toast({
        title: "Não foi possível eliminar",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const openEdit = (transaction: TransactionV2) => {
    setEditing(transaction);
    setDialogOpen(true);
  };

  const loading = query.isLoading || query.context.isLoading;
  const error = query.error ?? query.context.error;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Acompanhar"
        title="Lançamentos & Extrato"
        description="Consulta, filtra e mantém todas as movimentações financeiras do teu espaço."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={!context?.canWrite}
            className="rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <Plus size={16} /> Novo lançamento
          </Button>
        }
      />

      <MonthSelector
        month={monthLabel}
        onPrevious={() => setAnchor((current) => shiftMonth(current, -1, timezone))}
        onNext={() => setAnchor((current) => shiftMonth(current, 1, timezone))}
      />

      <MetricStrip
        items={[
          { label: "Receitas", value: formatCurrency(summary.income, currency, locale), variant: "positive" },
          { label: "Despesas", value: formatCurrency(summary.expenses, currency, locale), variant: "negative" },
          {
            label: "Saldo líquido",
            value: formatCurrency(summary.balance, currency, locale),
            variant: summary.balance >= 0 ? "positive" : "negative",
          },
        ]}
        className="grid-cols-3 sm:grid-cols-3"
      />

      <section className="functional-panel p-4" aria-label="Filtros de lançamentos">
        <TransactionFilters value={filters} categories={categories} onChange={setFilters} />
      </section>

      <DashboardCard
        title="Extrato"
        headingLevel={2}
        description={`${transactionRows.length} lançamento${transactionRows.length === 1 ? "" : "s"} no resultado atual`}
        noPadding
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-destructive">Não foi possível carregar os lançamentos.</p>
            <Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : transactionRows.length === 0 ? (
          <EmptyState
            icon={<WalletCards size={40} className="text-muted-foreground/40" />}
            message="Nenhum lançamento corresponde a este período e filtros."
            action={
              context?.canWrite ? (
                <Button
                  variant="outline"
                  className="mt-2 rounded-md border-border hover:bg-muted/65"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus size={15} /> Registar o primeiro
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {transactionRows.map((row) => (
                <TransactionMobileRow
                  key={row.transaction.id}
                  row={row}
                  canWrite={Boolean(context?.canWrite)}
                  onEdit={() => openEdit(row.transaction)}
                  onDelete={() => setDeleting(row.transaction)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left" aria-label="Tabela de lançamentos">
                <thead>
                  <tr className="border-b border-border bg-muted/20 font-mono text-label uppercase text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">Lançamento</th>
                    <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-3 font-medium">Data</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Valor</th>
                    <th scope="col" className="w-28 px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactionRows.map((row) => (
                    <tr key={row.transaction.id} className="group hover:bg-muted/20">
                      <td className="max-w-xs px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="surface-quiet flex size-9 shrink-0 items-center justify-center" aria-hidden="true">{row.icon}</span>
                          <div className="min-w-0">
                            <p className="truncate text-body-small font-semibold text-foreground">{row.title}</p>
                            <p className="truncate text-body-small text-muted-foreground">{row.counterpart}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-small text-foreground">{row.typeLabel}</td>
                      <td className="px-4 py-3 text-body-small text-muted-foreground">{row.statusLabel}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-body-small text-muted-foreground">{row.dateLabel}</td>
                      <td className={`financial-value whitespace-nowrap px-4 py-3 text-right text-body-small font-semibold ${amountToneClass(row.amountTone)}`}>
                        {row.amountLabel}
                      </td>
                      <td className="px-4 py-2">
                        <TransactionActions
                          name={row.title}
                          canWrite={Boolean(context?.canWrite)}
                          onEdit={() => openEdit(row.transaction)}
                          onDelete={() => setDeleting(row.transaction)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DashboardCard>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCloseAutoFocus={(event) => {
          if (dialogTriggerRef.current?.isConnected) {
            event.preventDefault();
            dialogTriggerRef.current.focus();
          }
        }}
        transaction={editing}
        categories={categories}
        currency={currency}
        locale={locale}
        timezone={timezone}
        busy={createTransaction.isPending || updateTransaction.isPending}
        onSubmit={submit}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteTransaction.isPending) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar lançamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              O lançamento deixará de constar nos relatórios e saldos do espaço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTransaction.isPending} className="border-border bg-muted/45 text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteTransaction.isPending}
              className="bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function presentTransaction(
  transaction: TransactionV2,
  categoryName: string | undefined,
  currency: string,
  locale: string,
  timezone: string,
): TransactionPresentation {
  const income = transaction.transaction_type === "income";
  const transfer = transaction.transaction_type === "transfer";
  const voided = transaction.status === "void";
  const counterpart = voided
    ? "Anulado"
    : transaction.merchant || categoryName || (transfer ? "Transferência" : "Sem categoria");
  const dateLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: timezone }).format(
    new Date(transaction.occurred_at),
  );

  return {
    transaction,
    title: transaction.description || "Sem descrição",
    meta: `${counterpart} · ${dateLabel}`,
    counterpart,
    typeLabel: income ? "Receita" : transfer ? "Transferência" : "Despesa",
    statusLabel: voided ? "Anulado" : transaction.status === "pending" ? "Pendente" : "Confirmado",
    dateLabel,
    amountLabel: `${income ? "+" : transfer ? "" : "-"}${formatCurrency(transaction.amount, currency, locale)}`,
    amountTone: income ? "positive" : transfer ? "default" : "negative",
    icon: income ? (
      <ArrowDownLeft size={16} className="text-financial-income" />
    ) : transfer ? (
      <ArrowLeftRight size={16} className="text-intelligence" />
    ) : (
      <ArrowUpRight size={16} className="text-financial-expense" />
    ),
  };
}

function amountToneClass(tone: TransactionPresentation["amountTone"]) {
  if (tone === "positive") return "text-financial-income";
  if (tone === "negative") return "text-financial-expense";
  return "text-foreground";
}

function TransactionMobileRow({
  row,
  canWrite,
  onEdit,
  onDelete,
}: {
  row: TransactionPresentation;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <FinancialRow
      icon={row.icon}
      title={row.title}
      meta={row.meta}
      amount={row.amountLabel}
      amountTone={row.amountTone}
      action={<TransactionActions name={row.title} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} />}
    />
  );
}

function TransactionActions({
  name,
  canWrite,
  onEdit,
  onDelete,
}: {
  name: string;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canWrite) return null;

  return (
    <span className="flex shrink-0 justify-end gap-1">
      <Button variant="ghost" size="icon" className="hover:bg-muted" aria-label={`Editar ${name}`} title="Editar lançamento" onClick={onEdit}>
        <Pencil size={14} className="text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="hover:bg-financial-expense/10" aria-label={`Eliminar ${name}`} title="Eliminar lançamento" onClick={onDelete}>
        <Trash2 size={14} className="text-financial-expense" />
      </Button>
    </span>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Loader2 size={20} className="animate-spin text-primary" /> A carregar lançamentos...
    </div>
  );
}
