import { useState } from "react";
import { Check, Copy, Pencil, Plus, Trash2, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import PlanDialog from "@/components/finance/PlanDialog";
import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/dashboard/EmptyState";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  type BudgetPlanInput,
  type BudgetPlanWithAllocations,
  useActivateBudgetPlanV2,
  useBudgetPlansV2,
  useCreateBudgetPlanV2,
  useDeleteBudgetPlanV2,
  useDuplicateBudgetPlanV2,
  useUpdateBudgetPlanV2,
} from "@/hooks/useFinancialControlsV2";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { capabilitiesForSubscription } from "@/lib/finance/capabilities";
import { formatCurrency } from "@/lib/finance/money";
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

const formatPeriod = (start: string, end: string, locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(`${start}T12:00:00`))} - ${formatter.format(new Date(`${end}T12:00:00`))}`;
};

const DashboardPlanos = () => {
  const context = useFinancialContext();
  const plansQuery = useBudgetPlansV2();
  const subscription = useSubscriptionV2();
  const createPlan = useCreateBudgetPlanV2();
  const updatePlan = useUpdateBudgetPlanV2();
  const activatePlan = useActivateBudgetPlanV2();
  const duplicatePlan = useDuplicateBudgetPlanV2();
  const deletePlan = useDeleteBudgetPlanV2();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BudgetPlanWithAllocations | null>(null);
  const [planToDelete, setPlanToDelete] = useState<BudgetPlanWithAllocations | null>(null);

  const data = context.data;
  const loading = context.isLoading || plansQuery.isLoading;
  const error = context.error ?? plansQuery.error;
  const mutationPending = createPlan.isPending || updatePlan.isPending || activatePlan.isPending || duplicatePlan.isPending || deletePlan.isPending;
  const canWrite = Boolean(data?.canWrite);

  const showError = (action: string, reason: unknown) => {
    toast({
      title: `Não foi possível ${action}`,
      description: reason instanceof Error ? reason.message : "Tenta novamente.",
      variant: "destructive",
    });
  };

  const openCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const openEdit = (plan: BudgetPlanWithAllocations) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const submitPlan = async (input: BudgetPlanInput) => {
    try {
      if (editingPlan) await updatePlan.mutateAsync({ id: editingPlan.id, ...input });
      else await createPlan.mutateAsync(input);
      toast({ title: editingPlan ? "Plano atualizado" : "Plano criado" });
    } catch (submissionError) {
      showError("guardar o plano", submissionError);
      throw submissionError;
    }
  };

  if (loading) return <DashboardCard><p className="py-10 text-sm text-muted-foreground">A carregar planos de orçamento...</p></DashboardCard>;
  if (error || !data) {
    return <DashboardCard><EmptyState message="Não foi possível carregar os planos de orçamento." action={<Button variant="outline" onClick={() => void plansQuery.refetch()}>Tentar novamente</Button>} /></DashboardCard>;
  }

  const plans = plansQuery.data ?? [];
  const capabilities = capabilitiesForSubscription(subscription.data);
  const planLimitReached = !capabilities.unlimitedPlans && plans.length >= 1;
  const dialogPlan = editingPlan
    ? { id: editingPlan.id, name: editingPlan.name, expectedIncome: editingPlan.expected_income, periodStart: editingPlan.period_start, periodEnd: editingPlan.period_end, currency: editingPlan.currency }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Planear" title="Planos de orçamento" description="Cria cenários e ativa o que representa este período." actions={planLimitReached ? <Button asChild variant="outline"><Link to="/dashboard/assinatura">Desbloquear mais planos</Link></Button> : <Button className="gap-2" onClick={openCreate} disabled={!canWrite || mutationPending}><Plus size={16} /> Novo plano</Button>} />
      {!canWrite && <p className="text-sm text-muted-foreground">Tens acesso de consulta a este espaço.</p>}
      {plans.length === 0 ? (
        <DashboardCard><EmptyState icon={<WalletCards size={48} />} message="Ainda não existe nenhum plano de orçamento neste espaço." action={canWrite ? <Button onClick={openCreate} disabled={mutationPending}>Criar primeiro plano</Button> : undefined} /></DashboardCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <DashboardCard key={plan.id} className={plan.is_active ? "ring-2 ring-primary" : ""}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><WalletCards size={20} /></div>
                  {plan.is_active && <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Check size={13} /> Ativo</span>}
                </div>
                <div className="space-y-1"><h3 className="font-bold">{plan.name}</h3><p className="text-sm text-muted-foreground">{formatCurrency(plan.expected_income, data.currency, data.locale)}</p><p className="text-xs text-muted-foreground">{formatPeriod(plan.period_start, plan.period_end, data.locale)}</p><p className="text-xs text-muted-foreground">{plan.allocations.length} categorias definidas</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant={plan.is_active ? "outline" : "default"} onClick={() => activatePlan.mutate(plan, { onError: (reason) => showError("ativar o plano", reason) })} disabled={!canWrite || mutationPending || plan.is_active}>{plan.is_active ? "Em uso" : "Ativar"}</Button>
                  <Button size="sm" variant="outline" onClick={() => duplicatePlan.mutate(plan, { onError: (reason) => showError("duplicar o plano", reason), onSuccess: () => toast({ title: "Plano duplicado" }) })} disabled={!canWrite || mutationPending || planLimitReached}><Copy size={14} /> Duplicar</Button>
                </div>
                <div className="flex justify-end gap-1 border-t border-border pt-3">
                  <Button size="icon" variant="ghost" aria-label={`Editar ${plan.name}`} onClick={() => openEdit(plan)} disabled={!canWrite || mutationPending}><Pencil size={16} /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Eliminar ${plan.name}`} onClick={() => setPlanToDelete(plan)} disabled={!canWrite || mutationPending}><Trash2 size={16} className="text-destructive" /></Button>
                </div>
              </div>
            </DashboardCard>
          ))}
        </div>
      )}
      <PlanDialog open={dialogOpen} onOpenChange={setDialogOpen} currency={data.currency} plan={dialogPlan} saving={createPlan.isPending || updatePlan.isPending} onSubmit={submitPlan} />
      <AlertDialog open={Boolean(planToDelete)} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar plano?</AlertDialogTitle><AlertDialogDescription>Esta ação remove o plano e todas as respetivas categorias de orçamento.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlan.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deletePlan.isPending} onClick={(event) => {
              event.preventDefault();
              if (!planToDelete) return;
              deletePlan.mutate(planToDelete.id, { onSuccess: () => { setPlanToDelete(null); toast({ title: "Plano eliminado" }); }, onError: (reason) => showError("eliminar o plano", reason) });
            }}>{deletePlan.isPending ? "A eliminar..." : "Eliminar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardPlanos;
