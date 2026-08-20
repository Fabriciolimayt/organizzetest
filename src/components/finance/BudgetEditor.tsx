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
    <div className="space-y-5">
      {categories.map((category) => {
        const percentage = percentages.get(category.id) ?? 0;
        const limit = Math.round((income * percentage) / 100 * 100) / 100;
        const spent = spentByCategory.get(category.id) ?? 0;
        const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        return (
          <div key={category.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: category.color ?? "#64748b" }} /><span className="truncate">{category.name}</span></span>
              <span className="text-xs text-muted-foreground">{formatCurrency(spent, currency, locale)} de {formatCurrency(limit, currency, locale)}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_76px] items-center gap-3">
              <Slider value={[percentage]} onValueChange={(value) => setPercentage(category.id, value[0])} min={0} max={100} step={1} disabled={disabled} aria-label={`Percentagem para ${category.name}`} />
              <div className="relative"><Input type="number" min={0} max={100} step={1} value={percentage} onChange={(event) => setPercentage(category.id, Math.max(0, Math.min(100, Number(event.target.value) || 0)))} disabled={disabled} className="h-9 pr-6 text-right tabular-nums" /><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
