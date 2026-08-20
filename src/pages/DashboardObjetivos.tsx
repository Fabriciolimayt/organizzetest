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

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Planear" title="Objetivos financeiros" description="Define metas e atualiza o teu progresso manualmente." actions={<Button className="gap-2" onClick={openCreate} disabled={!canWrite || mutationPending}><Plus size={16} /> Novo objetivo</Button>} />
      {!canWrite && <p className="text-sm text-muted-foreground">Tens acesso de consulta a este espaço.</p>}
      {goals.length === 0 ? (
        <DashboardCard><EmptyState icon={<Target size={48} />} message="Ainda não definiste nenhum objetivo financeiro." action={canWrite ? <Button onClick={openCreate}>Criar objetivo</Button> : undefined} /></DashboardCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal.current_amount, goal.target_amount);
            return (
              <DashboardCard key={goal.id} className={goal.is_completed ? "ring-1 ring-primary/50" : ""}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target size={20} /></div>
                      <div className="min-w-0"><h3 className="truncate font-bold">{goal.name}</h3>{goal.is_completed && <p className="flex items-center gap-1 text-xs font-medium text-primary"><CheckCircle2 size={13} /> Concluído</p>}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Editar ${goal.name}`} onClick={() => { setEditingGoal(goal); setDialogOpen(true); }} disabled={!canWrite || mutationPending}><Pencil size={16} /></Button>
                      <Button size="icon" variant="ghost" aria-label={`Eliminar ${goal.name}`} onClick={() => setGoalToDelete(goal)} disabled={!canWrite || mutationPending}><Trash2 size={16} className="text-destructive" /></Button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4"><p className="text-2xl font-semibold">{formatCurrency(goal.current_amount, data.currency, data.locale)}</p><p className="text-sm text-muted-foreground">de {formatCurrency(goal.target_amount, data.currency, data.locale)}</p></div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium text-primary">{progress}% concluído</span><span className="text-muted-foreground">{goal.target_date ? `Meta: ${dateFormatter.format(new Date(`${goal.target_date}T12:00:00`))}` : "Sem data definida"}</span></div>
                </div>
              </DashboardCard>
            );
          })}
        </div>
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

export default DashboardObjetivos;
