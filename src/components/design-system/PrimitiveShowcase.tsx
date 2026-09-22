import {
  AlertCircle,
  Check,
  ChevronRight,
  LoaderCircle,
  Plus,
  WalletCards,
} from "lucide-react";

import DashboardCard from "@/components/dashboard/DashboardCard";
import DecisionPanel from "@/components/dashboard/DecisionPanel";
import FinancialRow from "@/components/dashboard/FinancialRow";
import MetricStrip from "@/components/dashboard/MetricStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StateLabel = ({ children }: { children: string }) => (
  <p className="mb-2 font-mono text-[10px] font-semibold uppercase text-muted-foreground">{children}</p>
);

const PrimitiveShowcase = () => (
  <main className="min-h-[100dvh] bg-background text-foreground">
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="pb-8">
        <p className="text-panel-title text-intelligence">Livro Financeiro Humano</p>
        <h1 className="mt-2 text-page-title">Primitivos Invisible Ledger</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Estados essenciais para uma experiência financeira clara, calma e previsível.
        </p>
      </header>

      <section aria-labelledby="decision-title" className="border-t border-border py-8">
        <h2 id="decision-title" className="text-panel-title">Próxima decisão</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DecisionPanel
            eyebrow="Próxima decisão"
            title="Podes gastar 96 € em lazer."
            description="Sem ultrapassar o limite deste mês."
          />
          <DecisionPanel
            eyebrow="Atenção ao limite"
            title="Restam 24 € para refeições fora."
            description="Mantém as próximas escolhas abaixo deste valor até ao fim do mês."
            tone="warning"
            action={<Button variant="outline">Rever despesas</Button>}
          />
        </div>
      </section>

      <div className="grid gap-x-10 lg:grid-cols-2">
        <section aria-labelledby="buttons-title" className="border-t border-border py-8">
          <h2 id="buttons-title" className="text-panel-title">Botões</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <StateLabel>Predefinido e interativo</StateLabel>
              <Button>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Adicionar lançamento
              </Button>
            </div>
            <div>
              <StateLabel>Secundário</StateLabel>
              <Button variant="outline">Cancelar</Button>
            </div>
            <div>
              <StateLabel>Desativado</StateLabel>
              <Button disabled>Ação indisponível</Button>
            </div>
            <div>
              <StateLabel>A carregar</StateLabel>
              <Button disabled aria-busy="true">
                <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                A guardar
              </Button>
            </div>
            <div className="sm:col-span-2">
              <StateLabel>Rótulo português longo</StateLabel>
              <Button variant="secondary" className="max-w-full">
                Confirmar a atualização de todos os lançamentos selecionados
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="inputs-title" className="border-t border-border py-8">
          <h2 id="inputs-title" className="text-panel-title">Campos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <StateLabel>Predefinido</StateLabel>
              <Label htmlFor="showcase-description">Descrição</Label>
              <Input id="showcase-description" className="mt-2" placeholder="Ex.: Supermercado" />
            </div>
            <div>
              <StateLabel>Desativado</StateLabel>
              <Label htmlFor="showcase-disabled">Campo bloqueado</Label>
              <Input id="showcase-disabled" className="mt-2" value="Sem edição" disabled readOnly />
            </div>
            <div className="sm:col-span-2">
              <StateLabel>Erro</StateLabel>
              <Label htmlFor="showcase-error">Montante mensal disponível</Label>
              <Input
                id="showcase-error"
                className="mt-2"
                value="valor inválido"
                aria-invalid="true"
                aria-describedby="showcase-error-message"
                readOnly
              />
              <p id="showcase-error-message" className="mt-2 flex items-center gap-2 text-sm text-financial-expense">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                Introduza um montante válido.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="select-title" className="border-t border-border py-8">
          <h2 id="select-title" className="text-panel-title">Seleção</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <StateLabel>Selecionado</StateLabel>
              <Label htmlFor="showcase-account">Conta</Label>
              <Select defaultValue="principal">
                <SelectTrigger id="showcase-account" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Contas</SelectLabel>
                    <SelectItem value="principal">Conta principal</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <StateLabel>Desativado</StateLabel>
              <Label htmlFor="showcase-category">Categoria</Label>
              <Select disabled defaultValue="alimentacao">
                <SelectTrigger id="showcase-category" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <StateLabel>Rótulo português longo</StateLabel>
              <Select defaultValue="partilhada">
                <SelectTrigger aria-label="Conta usada para despesas familiares partilhadas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="partilhada">
                      Conta usada para despesas familiares partilhadas
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section aria-labelledby="tabs-title" className="border-t border-border py-8">
          <h2 id="tabs-title" className="text-panel-title">Separadores</h2>
          <Tabs defaultValue="summary" className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="comparison">Comparação com o mês anterior</TabsTrigger>
              <TabsTrigger value="archive" disabled>Arquivo</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <p className="border-l border-intelligence pl-4 text-sm text-muted-foreground">
                O saldo continua dentro do plano definido para agosto.
              </p>
            </TabsContent>
            <TabsContent value="comparison">
              <p className="border-l border-intelligence pl-4 text-sm text-muted-foreground">
                As despesas desceram 8% face ao mesmo período do mês anterior.
              </p>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <section aria-labelledby="metrics-title" className="border-t border-border py-8">
        <h2 id="metrics-title" className="text-panel-title">Métricas</h2>
        <div className="mt-4">
          <MetricStrip
            items={[
              { label: "Disponível", value: "2 840,20 €", variant: "accent", detail: "Dentro do plano" },
              { label: "Receitas", value: "+ 4 120,00 €", variant: "positive", detail: "Confirmadas" },
              { label: "Despesas", value: "− 1 279,80 €", variant: "negative", detail: "Confirmadas" },
              {
                label: "Montante ainda não atribuído a uma categoria",
                value: "—",
                detail: <span className="text-financial-warning">Requer atenção</span>,
              },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="rows-title" className="border-t border-border py-8">
        <h2 id="rows-title" className="text-panel-title">Linhas financeiras</h2>
        <div className="mt-4">
          <DashboardCard title="Movimentos recentes" description="Agosto de 2026" noPadding>
            <div className="divide-y divide-border">
              <FinancialRow
                icon={<WalletCards className="size-4" />}
                title="Supermercado do bairro"
                meta="Alimentação · hoje"
                amount="− 52,40 €"
                amountTone="negative"
                onClick={() => undefined}
              />
              <FinancialRow
                icon={<Check className="size-4" />}
                title="Transferência recebida"
                meta="Receita · ontem"
                amount="+ 820,00 €"
                amountTone="positive"
              />
              <FinancialRow
                title="Pagamento recorrente de serviços domésticos partilhados pela família"
                meta="Rótulo longo · sem montante associado"
                action={<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
              />
            </div>
          </DashboardCard>
        </div>
      </section>

      <section aria-labelledby="tables-title" className="border-t border-border py-8">
        <h2 id="tables-title" className="text-panel-title">Tabelas</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <StateLabel>Selecionado e aviso</StateLabel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Montante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow data-state="selected">
                  <TableCell>Alimentação</TableCell>
                  <TableCell><Badge variant="outline">Selecionado</Badge></TableCell>
                  <TableCell className="financial-value text-right text-financial-expense">− 186,20 €</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Refeições fora</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-financial-warning/40 text-financial-warning">
                      Perto do limite
                    </Badge>
                  </TableCell>
                  <TableCell className="financial-value text-right">− 96,00 €</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div>
            <StateLabel>Vazio</StateLabel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movimento</TableHead>
                  <TableHead className="text-right">Montante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    Ainda não existem movimentos neste período.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section aria-labelledby="overlays-title" className="border-t border-border py-8">
        <h2 id="overlays-title" className="text-panel-title">Painel e diálogo</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ainda sem regras automáticas</CardTitle>
              <CardDescription>As regras criadas para categorizar movimentos aparecem aqui.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Começa com uma regra simples e ajusta-a quando necessário.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Criar regra</Button>
            </CardFooter>
          </Card>

          <div className="flex min-h-48 flex-col items-start justify-between border-l border-border py-2 pl-5 sm:pl-6">
            <div>
              <StateLabel>Diálogo fechado</StateLabel>
              <h3 className="text-compact-title">Editar limite mensal</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                O diálogo conserva foco, teclado e composição Radix.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Abrir diálogo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar limite mensal</DialogTitle>
                  <DialogDescription>Define o máximo que pretendes gastar em refeições fora.</DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="dialog-limit">Limite</Label>
                  <Input id="dialog-limit" className="mt-2 financial-value" defaultValue="120,00 €" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Guardar limite</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </div>
  </main>
);

export default PrimitiveShowcase;
