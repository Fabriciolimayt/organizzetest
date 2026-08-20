import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const buttonClass =
  "focus-ring interactive-control h-11 rounded-md bg-primary px-4 text-body-small font-semibold text-primary-foreground hover:bg-primary-hover active:translate-y-px";
const quietButtonClass =
  "focus-ring interactive-control h-11 rounded-md border border-border bg-card px-4 text-body-small font-semibold text-foreground hover:bg-muted active:translate-y-px";

const PrimitiveShowcase = () => (
  <main className="min-h-[100dvh] bg-background text-foreground">
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="border-b border-border pb-6">
        <p className="font-guidance text-panel-title text-primary">Livro Financeiro Humano</p>
        <h1 className="mt-2 text-page-title">Fundação visual</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Estados essenciais para uma experiência financeira clara, calma e previsível.
        </p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="actions-title">
          <h2 id="actions-title" className="text-panel-title">Ações</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="ghost" className={buttonClass}>
              <Plus aria-hidden="true" />
              Adicionar lançamento
            </Button>
            <Button variant="ghost" className={quietButtonClass}>Cancelar</Button>
            <Button
              variant="ghost"
              className="focus-ring interactive-control h-11 rounded-md bg-destructive px-4 text-body-small font-semibold text-destructive-foreground hover:bg-destructive/90 active:translate-y-px"
            >
              Eliminar
            </Button>
            <Button variant="ghost" className={buttonClass} disabled>
              Ação indisponível
            </Button>
            <Button variant="ghost" className={buttonClass} aria-busy="true">
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              A guardar
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="focus-ring interactive-control size-11 rounded-md border border-border bg-card text-foreground hover:bg-muted"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mais opções</TooltipContent>
            </Tooltip>
          </div>
        </section>

        <section aria-labelledby="fields-title">
          <h2 id="fields-title" className="text-panel-title">Campos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="showcase-description" className="text-label">Descrição</Label>
              <Input
                id="showcase-description"
                className="focus-ring h-11 rounded-md bg-card text-body"
                placeholder="Ex.: Supermercado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="showcase-disabled" className="text-label">Campo bloqueado</Label>
              <Input
                id="showcase-disabled"
                className="focus-ring h-11 rounded-md bg-muted text-body"
                value="Sem edição"
                disabled
                readOnly
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="showcase-error" className="text-label">Montante</Label>
              <Input
                id="showcase-error"
                className="focus-ring h-11 rounded-md border-destructive bg-card text-body"
                value="valor inválido"
                aria-invalid="true"
                aria-describedby="showcase-error-message"
                readOnly
              />
              <p id="showcase-error-message" className="text-body-small text-destructive">
                Introduza um montante válido.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="status-title">
          <h2 id="status-title" className="text-panel-title">Estados e valores</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full border-transparent bg-success-wash text-accent-foreground hover:bg-success-wash">
              <Check aria-hidden="true" className="mr-1 size-3" /> Ativo
            </Badge>
            <Badge className="rounded-full border-transparent bg-warning-wash text-warning-foreground hover:bg-warning-wash">
              Atenção
            </Badge>
            <Badge variant="outline" className="rounded-full bg-card text-muted-foreground">Pendente</Badge>
            <Badge className="rounded-full border-transparent bg-destructive text-destructive-foreground hover:bg-destructive">
              Em atraso
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 border-y border-border sm:grid-cols-3">
            <div className="py-4 pr-3">
              <p className="text-label text-muted-foreground">Saldo disponível</p>
              <p className="financial-value mt-1 break-words text-value">2 840,20 €</p>
            </div>
            <div className="border-l border-border px-3 py-4">
              <p className="text-label text-muted-foreground">Receitas</p>
              <p className="financial-value mt-1 break-words text-value text-data-blue">4 120,00 €</p>
            </div>
            <div className="col-span-2 border-t border-border py-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-3">
              <p className="text-label text-muted-foreground">Despesas</p>
              <p className="financial-value mt-1 break-words text-value">1 279,80 €</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="navigation-title">
          <h2 id="navigation-title" className="text-panel-title">Navegação</h2>
          <nav aria-label="Exemplo de navegação" className="mt-4 surface-panel p-2">
            <div className="grid gap-1 sm:grid-cols-3">
              <button
                type="button"
                aria-current="page"
                className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md bg-muted px-3 text-left text-body-small font-semibold text-primary"
              >
                <WalletCards className="size-4" aria-hidden="true" />
                Visão geral
              </button>
              <button
                type="button"
                className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-body-small font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Lançamentos
              </button>
              <button
                type="button"
                disabled
                className="focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-body-small font-medium text-muted-foreground opacity-50"
              >
                Arquivo
              </button>
            </div>
          </nav>
        </section>
      </div>

      <section aria-labelledby="panels-title">
        <h2 id="panels-title" className="text-panel-title">Painéis e linhas</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="surface-panel overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <h3 className="text-compact-title">Movimentos recentes</h3>
                <p className="mt-1 text-body-small text-muted-foreground">Agosto de 2026</p>
              </div>
              <Button variant="ghost" className="focus-ring h-11 rounded-md px-3 text-body-small text-primary hover:bg-muted">
                Ver todos <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              <div className="flex min-w-0 items-center gap-3 p-4">
                <span className="surface-quiet flex size-10 shrink-0 items-center justify-center" aria-hidden="true">
                  <WalletCards className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-small font-semibold">Supermercado do bairro</p>
                  <p className="text-body-small text-muted-foreground">Alimentação · hoje</p>
                </div>
                <p className="financial-value shrink-0 text-body-small font-semibold">− 52,40 €</p>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 items-center gap-3 p-4">
                <span className="surface-quiet flex size-10 shrink-0 items-center justify-center" aria-hidden="true">
                  <WalletCards className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-small font-semibold">Transferência recebida</p>
                  <p className="text-body-small text-muted-foreground">Receita · ontem</p>
                </div>
                <p className="financial-value shrink-0 text-body-small font-semibold text-data-blue">+ 820,00 €</p>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <article className="surface-panel flex min-h-48 flex-col items-start justify-between p-4">
              <WalletCards className="size-5 text-primary" aria-hidden="true" />
              <div>
                <h3 className="font-guidance text-compact-title">Ainda sem movimentos</h3>
                <p className="mt-2 text-body-small text-muted-foreground">O primeiro lançamento aparece aqui.</p>
              </div>
              <Button variant="ghost" className={quietButtonClass}>Adicionar</Button>
            </article>

            <article className="surface-panel min-h-48 p-4" aria-busy="true" aria-label="A carregar movimentos">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </article>

            <article className="surface-panel flex min-h-48 flex-col items-start justify-between border-destructive p-4" role="alert">
              <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
              <div>
                <h3 className="text-compact-title">Não foi possível carregar</h3>
                <p className="mt-2 text-body-small text-muted-foreground">Tente novamente sem perder o seu contexto.</p>
              </div>
              <Button variant="ghost" className={quietButtonClass}>Repetir</Button>
            </article>
          </div>
        </div>
      </section>
    </div>
  </main>
);

export default PrimitiveShowcase;
