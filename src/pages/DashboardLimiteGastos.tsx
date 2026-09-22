import { useState } from "react";
import { AlertTriangle, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import LimitDialog from "@/components/finance/LimitDialog";
import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/dashboard/EmptyState";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  calculateLimitProgress,
  type SpendingLimitInput,
  useCreateSpendingLimitV2,
  useDeleteSpendingLimitV2,
  useLimitSpendingV2,
  useSpendingLimitsV2,
  useUpdateSpendingLimitV2,
} from "@/hooks/useFinancialControlsV2";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { formatCurrency } from "@/lib/finance/money";
import { Progress } from "@/components/ui/progress";
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

type LimitRow = NonNullable<ReturnType<typeof useSpendingLimitsV2>["data"]>[number];

const periodLabels = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
} as const;

const DashboardLimiteGastos = () => {
  const context = useFinancialContext();
  const limitsQuery = useSpendingLimitsV2();
  const limits = limitsQuery.data ?? [];
  const spendingQuery = useLimitSpendingV2(limits);
  const createLimit = useCreateSpendingLimitV2();
  const updateLimit = useUpdateSpendingLimitV2();
  const deleteLimit = useDeleteSpendingLimitV2();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<LimitRow | null>(null);
  const [limitToDelete, setLimitToDelete] = useState<LimitRow | null>(null);

  const data = context.data;
  const loading = context.isLoading || limitsQuery.isLoading || (limits.length > 0 && spendingQuery.isLoading);
  const error = context.error ?? limitsQuery.error ?? spendingQuery.error;
  const mutationPending = createLimit.isPending || updateLimit.isPending || deleteLimit.isPending;
  const canWrite = Boolean(data?.canWrite);

  const showError = (action: string, reason: unknown) => {
    toast({ title: `Não foi possível ${action}`, description: reason instanceof Error ? reason.message : "Tenta novamente.", variant: "destructive" });
  };

  const openCreate = () => {
    setEditingLimit(null);
    setDialogOpen(true);
  };

  const submitLimit = async (input: SpendingLimitInput) => {
    try {
      if (editingLimit) await updateLimit.mutateAsync({ id: editingLimit.id, ...input });
      else await createLimit.mutateAsync(input);
      toast({ title: editingLimit ? "Limite atualizado" : "Limite criado" });
    } catch (submissionError) {
      showError("guardar o limite", submissionError);
      throw submissionError;
    }
  };

  if (loading) return <DashboardCard><p className="py-10 text-sm text-muted-foreground">A carregar limites de gastos...</p></DashboardCard>;
  if (error || !data) return <DashboardCard><EmptyState message="Não foi possível carregar os limites de gastos." action={<Button variant="outline" onClick={() => void limitsQuery.refetch()}>Tentar novamente</Button>} /></DashboardCard>;

  const dialogLimit = editingLimit
    ? { id: editingLimit.id, categoryId: editingLimit.category_id, amount: editingLimit.amount, currency: editingLimit.currency, period: editingLimit.period, startsOn: editingLimit.starts_on }
    : null;
  const spending = spendingQuery.data ?? {};
  const categoryNames = new Map(data.categories.map((category) => [category.id, category.name]));
  const limitRows = limits.map((limit) => {
    const spent = spending[limit.id] ?? 0;
    const progress = calculateLimitProgress(spent, limit.amount);
    return {
      limit,
      spent,
      progress,
      name: limit.category_id ? categoryNames.get(limit.category_id) ?? "Categoria removida" : "Todas as despesas",
      tone: progress.state === "exceeded" ? "text-financial-expense" : progress.state === "warning" ? "text-financial-warning" : "text-financial-income",
      progressClass: progress.state === "exceeded" ? "[&>div]:bg-financial-expense" : progress.state === "warning" ? "[&>div]:bg-financial-warning" : "[&>div]:bg-financial-income",
      stateLabel: progress.state === "exceeded" ? "Limite excedido" : progress.state === "warning" ? "Próximo do limite" : "Dentro do limite",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Planear" title="Limites de gastos" description="Acompanha o que já gastaste em cada período." actions={<Button className="gap-2" onClick={openCreate} disabled={!canWrite || mutationPending}><Plus size={16} /> Novo limite</Button>} />
      {!canWrite && <p className="text-sm text-muted-foreground">Tens acesso de consulta a este espaço.</p>}
      {limits.length === 0 ? (
        <DashboardCard><EmptyState icon={<ShieldCheck size={48} />} message="Ainda não definiste limites de gastos." action={canWrite ? <Button onClick={openCreate}>Definir limite</Button> : undefined} /></DashboardCard>
      ) : (
        <DashboardCard title="Limites ativos" headingLevel={2} description={`${limitRows.length} regra${limitRows.length === 1 ? "" : "s"} acompanhada${limitRows.length === 1 ? "" : "s"}`} noPadding>
          <div className="divide-y divide-border md:hidden">
            {limitRows.map(({ limit, spent, progress, name, tone, progressClass, stateLabel }) => (
              <article key={limit.id} className="space-y-3 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="break-words text-compact-title text-foreground">{name}</h3><p className="mt-1 text-body-small text-muted-foreground">{periodLabels[limit.period]}</p></div>
                  <LimitActions canWrite={canWrite} mutationPending={mutationPending} onEdit={() => { setEditingLimit(limit); setDialogOpen(true); }} onDelete={() => setLimitToDelete(limit)} />
                </div>
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2"><p className="financial-value min-w-0 break-words text-value font-semibold text-foreground">{formatCurrency(spent, data.currency, data.locale)}</p><p className="financial-value min-w-0 break-words text-body-small text-muted-foreground">de {formatCurrency(limit.amount, data.currency, data.locale)}</p></div>
                <Progress value={Math.min(progress.percentage, 100)} aria-label={`${progress.percentage}% do limite utilizado`} className={`h-2 ${progressClass}`} />
                <p className={`flex items-center gap-1 text-body-small font-medium ${tone}`}>{progress.state !== "safe" && <AlertTriangle size={15} />}{stateLabel}: {progress.percentage}% utilizado</p>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-left" aria-label="Limites de gastos">
              <thead><tr className="border-b border-border bg-muted/20 font-mono text-label uppercase text-muted-foreground"><th className="px-5 py-3 font-medium" scope="col">Âmbito</th><th className="px-4 py-3 font-medium" scope="col">Período</th><th className="px-4 py-3 text-right font-medium" scope="col">Gasto</th><th className="px-4 py-3 text-right font-medium" scope="col">Limite</th><th className="px-4 py-3 font-medium" scope="col">Utilização</th><th className="px-4 py-3 text-right font-medium" scope="col">Ações</th></tr></thead>
              <tbody className="divide-y divide-border">
                {limitRows.map(({ limit, spent, progress, name, tone, progressClass, stateLabel }) => (
                  <tr key={limit.id} className="hover:bg-muted/20">
                    <td className="max-w-xs px-5 py-3 text-body-small font-semibold text-foreground">{name}</td>
                    <td className="px-4 py-3 text-body-small text-muted-foreground">{periodLabels[limit.period]}</td>
                    <td className="financial-value whitespace-nowrap px-4 py-3 text-right text-body-small text-foreground">{formatCurrency(spent, data.currency, data.locale)}</td>
                    <td className="financial-value whitespace-nowrap px-4 py-3 text-right text-body-small text-foreground">{formatCurrency(limit.amount, data.currency, data.locale)}</td>
                    <td className="min-w-52 px-4 py-3"><div className="flex items-center gap-3"><Progress value={Math.min(progress.percentage, 100)} aria-label={`${progress.percentage}% do limite utilizado`} className={`h-1.5 min-w-24 flex-1 ${progressClass}`} /><span className={`whitespace-nowrap text-label font-medium ${tone}`}>{stateLabel} · {progress.percentage}%</span></div></td>
                    <td className="px-4 py-2"><LimitActions canWrite={canWrite} mutationPending={mutationPending} onEdit={() => { setEditingLimit(limit); setDialogOpen(true); }} onDelete={() => setLimitToDelete(limit)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}
      <LimitDialog open={dialogOpen} onOpenChange={setDialogOpen} currency={data.currency} categories={data.categories.filter((category) => category.transaction_type === "expense")} limit={dialogLimit} saving={createLimit.isPending || updateLimit.isPending} onSubmit={submitLimit} />
      <AlertDialog open={Boolean(limitToDelete)} onOpenChange={(open) => !open && setLimitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar limite?</AlertDialogTitle><AlertDialogDescription>O histórico de despesas será mantido, mas este alerta deixa de ser aplicado.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLimit.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteLimit.isPending} onClick={(event) => {
              event.preventDefault();
              if (!limitToDelete) return;
              deleteLimit.mutate(limitToDelete.id, { onSuccess: () => { setLimitToDelete(null); toast({ title: "Limite eliminado" }); }, onError: (reason) => showError("eliminar o limite", reason) });
            }}>{deleteLimit.isPending ? "A eliminar..." : "Eliminar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function LimitActions({ canWrite, mutationPending, onEdit, onDelete }: { canWrite: boolean; mutationPending: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label="Editar limite" title="Editar limite" onClick={onEdit} disabled={!canWrite || mutationPending}><Pencil size={15} /></Button>
      <Button size="icon" variant="ghost" className="hover:bg-financial-expense/10" aria-label="Eliminar limite" title="Eliminar limite" onClick={onDelete} disabled={!canWrite || mutationPending}><Trash2 size={15} className="text-financial-expense" /></Button>
    </div>
  );
}

export default DashboardLimiteGastos;
