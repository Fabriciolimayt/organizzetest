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

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Planear" title="Limites de gastos" description="Acompanha o que já gastaste em cada período." actions={<Button className="gap-2" onClick={openCreate} disabled={!canWrite || mutationPending}><Plus size={16} /> Novo limite</Button>} />
      {!canWrite && <p className="text-sm text-muted-foreground">Tens acesso de consulta a este espaço.</p>}
      {limits.length === 0 ? (
        <DashboardCard><EmptyState icon={<ShieldCheck size={48} />} message="Ainda não definiste limites de gastos." action={canWrite ? <Button onClick={openCreate}>Definir limite</Button> : undefined} /></DashboardCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {limits.map((limit) => {
            const spent = spending[limit.id] ?? 0;
            const progress = calculateLimitProgress(spent, limit.amount);
            const tone = progress.state === "exceeded" ? "text-destructive" : progress.state === "warning" ? "text-amber-600" : "text-primary";
            const progressClass = progress.state === "exceeded" ? "[&>div]:bg-destructive" : progress.state === "warning" ? "[&>div]:bg-amber-500" : "";
            return (
              <DashboardCard key={limit.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-bold">{limit.category_id ? categoryNames.get(limit.category_id) ?? "Categoria removida" : "Todas as despesas"}</h3><p className="text-sm text-muted-foreground">{periodLabels[limit.period]}</p></div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Editar limite" onClick={() => { setEditingLimit(limit); setDialogOpen(true); }} disabled={!canWrite || mutationPending}><Pencil size={16} /></Button>
                      <Button size="icon" variant="ghost" aria-label="Eliminar limite" onClick={() => setLimitToDelete(limit)} disabled={!canWrite || mutationPending}><Trash2 size={16} className="text-destructive" /></Button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4"><p className="text-2xl font-semibold">{formatCurrency(spent, data.currency, data.locale)}</p><p className="text-sm text-muted-foreground">de {formatCurrency(limit.amount, data.currency, data.locale)}</p></div>
                  <Progress value={Math.min(progress.percentage, 100)} className={`h-2 ${progressClass}`} />
                  <p className={`flex items-center gap-1 text-sm font-medium ${tone}`}>{progress.state !== "safe" && <AlertTriangle size={15} />}{progress.percentage}% do limite utilizado</p>
                </div>
              </DashboardCard>
            );
          })}
        </div>
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

export default DashboardLimiteGastos;
