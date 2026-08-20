import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionFilters as Filters } from "@/hooks/useTransactionsV2";

type Props = { value: Filters; categories: Array<{ id: string; name: string }>; onChange: (filters: Filters) => void };

export default function TransactionFilters({ value, categories, onChange }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_180px_150px]">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Pesquisar descrição ou comerciante" className="pl-9" />
      </div>
      <Select value={value.type} onValueChange={(type) => onChange({ ...value, type: type as Filters["type"] })}>
        <SelectTrigger aria-label="Tipo de lançamento"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="expense">Despesas</SelectItem><SelectItem value="income">Receitas</SelectItem><SelectItem value="transfer">Transferências</SelectItem></SelectContent>
      </Select>
      <Select value={value.categoryId} onValueChange={(categoryId) => onChange({ ...value, categoryId })}>
        <SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.status} onValueChange={(status) => onChange({ ...value, status: status as Filters["status"] })}>
        <SelectTrigger aria-label="Estado"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos os estados</SelectItem><SelectItem value="cleared">Confirmado</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="void">Anulado</SelectItem></SelectContent>
      </Select>
    </div>
  );
}
