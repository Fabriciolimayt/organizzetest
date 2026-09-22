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
        <DashboardCard title="Planos disponíveis" headingLevel={2} description={`${plans.length} cenário${plans.length === 1 ? "" : "s"} neste espaço`} noPadding>
          <div className="divide-y divide-border md:hidden">
            {plans.map((plan) => (
              <article key={plan.id} className="space-y-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="surface-quiet flex size-9 shrink-0 items-center justify-center text-intelligence"><WalletCards size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-compact-title text-foreground">{plan.name}</h3>
                      {plan.is_active && <span className="flex items-center gap-1 text-label font-semibold text-intelligence"><Check size={13} /> Ativo</span>}
                    </div>
                    <p className="mt-1 text-body-small text-muted-foreground">{formatPeriod(plan.period_start, plan.period_end, data.locale)}</p>
                  </div>
                  <p className="financial-value shrink-0 text-body-small font-semibold text-foreground">{formatCurrency(plan.expected_income, data.currency, data.locale)}</p>
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-body-small text-muted-foreground">{plan.allocations.length} categorias definidas</span>
                  <PlanActions
                    plan={plan}
                    canWrite={canWrite}
                    mutationPending={mutationPending}
                    planLimitReached={planLimitReached}
                    onActivate={() => activatePlan.mutate(plan, { onError: (reason) => showError("ativar o plano", reason) })}
                    onDuplicate={() => duplicatePlan.mutate(plan, { onError: (reason) => showError("duplicar o plano", reason), onSuccess: () => toast({ title: "Plano duplicado" }) })}
                    onEdit={() => openEdit(plan)}
                    onDelete={() => setPlanToDelete(plan)}
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse text-left" aria-label="Planos de orçamento">
              <thead><tr className="border-b border-border bg-muted/20 font-mono text-label uppercase text-muted-foreground"><th className="px-5 py-3 font-medium" scope="col">Plano</th><th className="px-4 py-3 font-medium" scope="col">Período</th><th className="px-4 py-3 text-right font-medium" scope="col">Rendimento</th><th className="px-4 py-3 text-right font-medium" scope="col">Categorias</th><th className="px-4 py-3 font-medium" scope="col">Estado</th><th className="px-4 py-3 text-right font-medium" scope="col">Ações</th></tr></thead>
              <tbody className="divide-y divide-border">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-muted/20">
                    <td className="max-w-xs px-5 py-3 text-body-small font-semibold text-foreground">{plan.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body-small text-muted-foreground">{formatPeriod(plan.period_start, plan.period_end, data.locale)}</td>
                    <td className="financial-value whitespace-nowrap px-4 py-3 text-right text-body-small text-foreground">{formatCurrency(plan.expected_income, data.currency, data.locale)}</td>
                    <td className="px-4 py-3 text-right text-body-small text-muted-foreground">{plan.allocations.length}</td>
                    <td className="px-4 py-3 text-body-small">{plan.is_active ? <span className="inline-flex items-center gap-1 font-semibold text-intelligence"><Check size={13} /> Ativo</span> : <span className="text-muted-foreground">Inativo</span>}</td>
                    <td className="px-4 py-2"><PlanActions plan={plan} canWrite={canWrite} mutationPending={mutationPending} planLimitReached={planLimitReached} onActivate={() => activatePlan.mutate(plan, { onError: (reason) => showError("ativar o plano", reason) })} onDuplicate={() => duplicatePlan.mutate(plan, { onError: (reason) => showError("duplicar o plano", reason), onSuccess: () => toast({ title: "Plano duplicado" }) })} onEdit={() => openEdit(plan)} onDelete={() => setPlanToDelete(plan)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
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

function PlanActions({ plan, canWrite, mutationPending, planLimitReached, onActivate, onDuplicate, onEdit, onDelete }: { plan: BudgetPlanWithAllocations; canWrite: boolean; mutationPending: boolean; planLimitReached: boolean; onActivate: () => void; onDuplicate: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Button size="sm" variant={plan.is_active ? "outline" : "default"} onClick={onActivate} disabled={!canWrite || mutationPending || plan.is_active}>{plan.is_active ? "Em uso" : "Ativar"}</Button>
      <Button size="icon" variant="ghost" aria-label={`Duplicar ${plan.name}`} title="Duplicar plano" onClick={onDuplicate} disabled={!canWrite || mutationPending || planLimitReached}><Copy size={15} /></Button>
      <Button size="icon" variant="ghost" aria-label={`Editar ${plan.name}`} title="Editar plano" onClick={onEdit} disabled={!canWrite || mutationPending}><Pencil size={15} /></Button>
      <Button size="icon" variant="ghost" className="hover:bg-financial-expense/10" aria-label={`Eliminar ${plan.name}`} title="Eliminar plano" onClick={onDelete} disabled={!canWrite || mutationPending}><Trash2 size={15} className="text-financial-expense" /></Button>
    </div>
  );
}

export default DashboardPlanos;
