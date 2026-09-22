import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Target, Trash2 } from "lucide-react";

import GoalDialog from "@/components/finance/GoalDialog";
import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/dashboard/EmptyState";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  calculateGoalProgress,
  type FinancialGoalInput,
  useCreateFinancialGoalV2,
  useDeleteFinancialGoalV2,
  useFinancialGoalsV2,
  useUpdateFinancialGoalV2,
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

type GoalRow = NonNullable<ReturnType<typeof useFinancialGoalsV2>["data"]>[number];

const DashboardObjetivos = () => {
  const context = useFinancialContext();
  const goalsQuery = useFinancialGoalsV2();
  const createGoal = useCreateFinancialGoalV2();
  const updateGoal = useUpdateFinancialGoalV2();
  const deleteGoal = useDeleteFinancialGoalV2();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalRow | null>(null);

  const data = context.data;
  const loading = context.isLoading || goalsQuery.isLoading;
  const error = context.error ?? goalsQuery.error;
  const mutationPending = createGoal.isPending || updateGoal.isPending || deleteGoal.isPending;
  const canWrite = Boolean(data?.canWrite);

  const showError = (action: string, reason: unknown) => {
    toast({ title: `Não foi possível ${action}`, description: reason instanceof Error ? reason.message : "Tenta novamente.", variant: "destructive" });
  };

  const openCreate = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const submitGoal = async (input: FinancialGoalInput) => {
    try {
      if (editingGoal) await updateGoal.mutateAsync({ id: editingGoal.id, ...input });
      else await createGoal.mutateAsync(input);
      toast({ title: editingGoal ? "Objetivo atualizado" : "Objetivo criado" });
    } catch (submissionError) {
      showError("guardar o objetivo", submissionError);
      throw submissionError;
    }
  };

  if (loading) return <DashboardCard><p className="py-10 text-sm text-muted-foreground">A carregar objetivos...</p></DashboardCard>;
  if (error || !data) return <DashboardCard><EmptyState message="Não foi possível carregar os objetivos." action={<Button variant="outline" onClick={() => void goalsQuery.refetch()}>Tentar novamente</Button>} /></DashboardCard>;

  const goals = goalsQuery.data ?? [];
  const dialogGoal = editingGoal
    ? { id: editingGoal.id, name: editingGoal.name, targetAmount: editingGoal.target_amount, currentAmount: editingGoal.current_amount, currency: editingGoal.currency, targetDate: editingGoal.target_date }
    : null;
  const dateFormatter = new Intl.DateTimeFormat(data.locale, { day: "numeric", month: "long", year: "numeric" });
  const goalRows = goals.map((goal) => ({
    goal,
    progress: calculateGoalProgress(goal.current_amount, goal.target_amount),
    dateLabel: goal.target_date ? `Meta: ${dateFormatter.format(new Date(`${goal.target_date}T12:00:00`))}` : "Sem data definida",
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Planear" title="Objetivos financeiros" description="Define metas e atualiza o teu progresso manualmente." actions={<Button className="gap-2" onClick={openCreate} disabled={!canWrite || mutationPending}><Plus size={16} /> Novo objetivo</Button>} />
      {!canWrite && <p className="text-sm text-muted-foreground">Tens acesso de consulta a este espaço.</p>}
      {goals.length === 0 ? (
        <DashboardCard><EmptyState icon={<Target size={48} />} message="Ainda não definiste nenhum objetivo financeiro." action={canWrite ? <Button onClick={openCreate}>Criar objetivo</Button> : undefined} /></DashboardCard>
      ) : (
        <DashboardCard title="Objetivos ativos" headingLevel={2} description={`${goalRows.length} meta${goalRows.length === 1 ? "" : "s"} financeira${goalRows.length === 1 ? "" : "s"}`} noPadding>
          <div className="divide-y divide-border md:hidden">
            {goalRows.map(({ goal, progress, dateLabel }) => (
              <article key={goal.id} className="space-y-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="surface-quiet flex size-9 shrink-0 items-center justify-center text-intelligence"><Target size={17} /></span>
                  <div className="min-w-0 flex-1"><h3 className="break-words text-compact-title text-foreground">{goal.name}</h3>{goal.is_completed && <p className="mt-1 flex items-center gap-1 text-label font-medium text-intelligence"><CheckCircle2 size={13} /> Concluído</p>}</div>
                  <GoalActions name={goal.name} canWrite={canWrite} mutationPending={mutationPending} onEdit={() => { setEditingGoal(goal); setDialogOpen(true); }} onDelete={() => setGoalToDelete(goal)} />
                </div>
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2"><p className="financial-value min-w-0 break-words text-value font-semibold text-foreground">{formatCurrency(goal.current_amount, data.currency, data.locale)}</p><p className="financial-value min-w-0 break-words text-body-small text-muted-foreground">de {formatCurrency(goal.target_amount, data.currency, data.locale)}</p></div>
                <Progress value={progress} aria-label={`${goal.name}: ${progress}% concluído`} className="h-2 [&>div]:bg-intelligence" />
                <div className="flex min-w-0 flex-wrap justify-between gap-2 text-body-small"><span className="font-medium text-intelligence">{progress}% concluído</span><span className="text-muted-foreground">{dateLabel}</span></div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-left" aria-label="Objetivos financeiros">
              <thead><tr className="border-b border-border bg-muted/20 font-mono text-label uppercase text-muted-foreground"><th className="px-5 py-3 font-medium" scope="col">Objetivo</th><th className="px-4 py-3 text-right font-medium" scope="col">Atual</th><th className="px-4 py-3 text-right font-medium" scope="col">Alvo</th><th className="px-4 py-3 font-medium" scope="col">Progresso</th><th className="px-4 py-3 font-medium" scope="col">Data</th><th className="px-4 py-3 text-right font-medium" scope="col">Ações</th></tr></thead>
              <tbody className="divide-y divide-border">
                {goalRows.map(({ goal, progress, dateLabel }) => (
                  <tr key={goal.id} className="hover:bg-muted/20">
                    <td className="max-w-xs px-5 py-3"><span className="text-body-small font-semibold text-foreground">{goal.name}</span>{goal.is_completed && <span className="ml-2 inline-flex items-center gap-1 text-label font-medium text-intelligence"><CheckCircle2 size={13} /> Concluído</span>}</td>
                    <td className="financial-value whitespace-nowrap px-4 py-3 text-right text-body-small text-foreground">{formatCurrency(goal.current_amount, data.currency, data.locale)}</td>
                    <td className="financial-value whitespace-nowrap px-4 py-3 text-right text-body-small text-foreground">{formatCurrency(goal.target_amount, data.currency, data.locale)}</td>
                    <td className="min-w-44 px-4 py-3"><div className="flex items-center gap-3"><Progress value={progress} aria-label={`${goal.name}: ${progress}% concluído`} className="h-1.5 min-w-24 flex-1 [&>div]:bg-intelligence" /><span className="financial-value text-label font-medium text-intelligence">{progress}%</span></div></td>
                    <td className="whitespace-nowrap px-4 py-3 text-body-small text-muted-foreground">{dateLabel}</td>
                    <td className="px-4 py-2"><GoalActions name={goal.name} canWrite={canWrite} mutationPending={mutationPending} onEdit={() => { setEditingGoal(goal); setDialogOpen(true); }} onDelete={() => setGoalToDelete(goal)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}
      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} currency={data.currency} goal={dialogGoal} saving={createGoal.isPending || updateGoal.isPending} onSubmit={submitGoal} />
      <AlertDialog open={Boolean(goalToDelete)} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar objetivo?</AlertDialogTitle><AlertDialogDescription>Esta ação remove o objetivo e o respetivo progresso guardado.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGoal.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteGoal.isPending} onClick={(event) => {
              event.preventDefault();
              if (!goalToDelete) return;
              deleteGoal.mutate(goalToDelete.id, { onSuccess: () => { setGoalToDelete(null); toast({ title: "Objetivo eliminado" }); }, onError: (reason) => showError("eliminar o objetivo", reason) });
            }}>{deleteGoal.isPending ? "A eliminar..." : "Eliminar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function GoalActions({ name, canWrite, mutationPending, onEdit, onDelete }: { name: string; canWrite: boolean; mutationPending: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label={`Editar ${name}`} title="Editar objetivo" onClick={onEdit} disabled={!canWrite || mutationPending}><Pencil size={15} /></Button>
      <Button size="icon" variant="ghost" className="hover:bg-financial-expense/10" aria-label={`Eliminar ${name}`} title="Eliminar objetivo" onClick={onDelete} disabled={!canWrite || mutationPending}><Trash2 size={15} className="text-financial-expense" /></Button>
    </div>
  );
}

export default DashboardObjetivos;
