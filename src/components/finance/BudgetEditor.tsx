import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import type { AllocationDraft } from "@/hooks/useBudgetsV2";
import { formatCurrency } from "@/lib/finance/money";

type Category = { id: string; name: string; color: string | null };
type Props = {
  categories: Category[];
  allocations: AllocationDraft[];
  income: number;
  spentByCategory: ReadonlyMap<string, number>;
  currency: string;
  locale: string;
  disabled?: boolean;
  onChange: (allocations: AllocationDraft[]) => void;
};

export default function BudgetEditor({ categories, allocations, income, spentByCategory, currency, locale, disabled, onChange }: Props) {
  const percentages = new Map(allocations.map((allocation) => [allocation.categoryId, allocation.percentage]));
  const setPercentage = (categoryId: string, percentage: number) => {
    const next = categories.map((category) => ({ categoryId: category.id, percentage: category.id === categoryId ? percentage : percentages.get(category.id) ?? 0 }));
    onChange(next);
  };

  return (
    <div className="divide-y divide-border">
      {categories.map((category) => {
        const percentage = percentages.get(category.id) ?? 0;
        const limit = Math.round((income * percentage) / 100 * 100) / 100;
        const spent = spentByCategory.get(category.id) ?? 0;
        const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : spent > 0 ? 100 : 0;
        const progressStatus = spent > limit
          ? { label: "Acima do orçamento", spoken: "acima do orçamento", barTone: "[&>div]:bg-financial-expense", textTone: "text-financial-expense" }
          : progress >= 80
            ? { label: "Próximo do limite", spoken: "próximo do limite", barTone: "[&>div]:bg-financial-warning", textTone: "text-financial-warning" }
            : { label: "Dentro do orçamento", spoken: "dentro do orçamento", barTone: "[&>div]:bg-intelligence", textTone: "text-intelligence" };
        const progressLabel = progress.toLocaleString(locale, { maximumFractionDigits: 1 });
        return (
          <div key={category.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: category.color ?? "hsl(var(--muted-foreground))" }} /><span className="break-words">{category.name}</span></span>
              <span className="financial-value text-xs text-muted-foreground">{formatCurrency(spent, currency, locale)} de {formatCurrency(limit, currency, locale)}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3">
              <Slider value={[percentage]} onValueChange={(value) => setPercentage(category.id, value[0])} min={0} max={100} step={1} disabled={disabled} aria-label={`Percentagem para ${category.name}`} />
              <div className="relative"><Input aria-label={`Valor percentual para ${category.name}`} type="number" min={0} max={100} step={1} value={percentage} onChange={(event) => setPercentage(category.id, Math.max(0, Math.min(100, Number(event.target.value) || 0)))} disabled={disabled} className="financial-value h-10 pr-6 text-right" /><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Progress value={progress} aria-label={`${category.name}: ${progressLabel}% utilizado, ${progressStatus.spoken}`} className={`h-1.5 min-w-32 flex-1 ${progressStatus.barTone}`} />
              <span className={`text-label font-medium ${progressStatus.textTone}`}>{progressStatus.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
