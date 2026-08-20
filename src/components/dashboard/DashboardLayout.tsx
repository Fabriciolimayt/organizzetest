import { useState } from "react";
import { CircleHelp, CreditCard, LogOut, Menu, Settings2, Stethoscope, UserRound, X } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

import Logo from "@/components/Logo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { useToast } from "@/hooks/use-toast";
import { isSubscriptionCurrent, type SubscriptionLike } from "@/lib/finance/capabilities";
import { supabase } from "@/integrations/supabase/client";

const subscriptionLabel = (subscription?: SubscriptionLike | null) => {
  if (!isSubscriptionCurrent(subscription)) return "Plano gratuito";
  if (subscription?.status === "trialing") return "Período experimental";
  return "Plano ativo";
};

type AccountMenuProps = {
  compact?: boolean;
  tone?: "light" | "dark";
  email?: string;
  planLabel: string;
  onRestartTour: () => void;
  onSignOut: () => Promise<void>;
};

const AccountMenu = ({ compact, tone = "light", email, planLabel, onRestartTour, onSignOut }: AccountMenuProps) => {
  const dark = tone === "dark";
  const trigger = (
    <Button
      variant="ghost"
      size={compact ? "icon" : "default"}
      className={compact ? "size-11" : `h-11 w-full justify-start px-3 ${dark ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" : ""}`}
      aria-label={compact ? "Abrir menu da conta" : undefined}
    >
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${dark ? "bg-sidebar-accent text-marker" : "bg-muted text-foreground"}`}>
        <UserRound aria-hidden="true" className="size-4" />
      </span>
      {!compact && (
        <span className="min-w-0 text-left">
          <span className={`block truncate text-sm font-semibold ${dark ? "text-sidebar-foreground" : "text-foreground"}`}>Conta</span>
          <span className={`block max-w-36 truncate text-xs font-normal ${dark ? "text-sidebar-foreground/55" : "text-muted-foreground"}`}>{email}</span>
        </span>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Abrir menu da conta</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "right"} className="w-72">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{email ?? "Conta Organizze"}</span>
          <span className="text-xs font-normal text-muted-foreground">{planLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="min-h-11 gap-3">
            <Link to="/dashboard/assinatura">
              <CreditCard aria-hidden="true" className="size-4" />
              Gerir assinatura
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11 gap-3">
            <Link to="/dashboard/diagnostico-whatsapp">
              <Stethoscope aria-hidden="true" className="size-4" />
              Diagnóstico WhatsApp
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onRestartTour} className="min-h-11 gap-3">
            <CircleHelp aria-hidden="true" className="size-4" />
            Reiniciar tutorial
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => void onSignOut()} className="min-h-11 gap-3 text-destructive">
            <LogOut aria-hidden="true" className="size-4" />
            Terminar sessão
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DashboardLayout = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const { user } = useAuth();
  const financial = useFinancialContext();
  const subscription = useSubscriptionV2();
  const { toast } = useToast();
  const currentSpace = financial.data?.spaces.find((space) => space.id === financial.data?.spaceId);
  const planLabel = subscription.isLoading ? "A consultar plano" : subscriptionLabel(subscription.data);
  const restartTour = () => window.dispatchEvent(new CustomEvent("organizze:start-tour"));

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      toast({
        title: "Não foi possível terminar a sessão",
        description: "Tenta novamente dentro de alguns instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid h-[100dvh] max-h-[100dvh] min-h-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#dashboard-main-content"
        className="focus-ring sr-only z-[60] min-h-11 items-center bg-foreground px-4 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:flex"
      >
        Saltar para o conteúdo
      </a>

      <aside className="hidden min-h-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex min-h-24 items-center px-5">
          <Link to="/dashboard" aria-label="Ir para a visão geral" className="inline-flex min-h-11 items-center">
            <Logo white />
          </Link>
        </div>
        <div className="px-5 pb-4">
          <p className="font-mono text-[10px] font-semibold uppercase text-sidebar-foreground/45">Espaço ativo</p>
          <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
            {financial.isLoading ? "A carregar" : currentSpace?.name ?? "As minhas finanças"}
          </p>
        </div>
        <div className="min-h-0 flex-1 px-3">
          <DashboardNav variant="desktop" />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <AccountMenu
            tone="dark"
            email={user?.email}
            planLabel={planLabel}
            onRestartTour={restartTour}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-rows-[minmax(0,1fr)]">
        <header className="flex min-h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden size-11 md:inline-flex"
                aria-label="Abrir navegação"
                aria-expanded={navigationOpen}
                onClick={() => setNavigationOpen(true)}
              >
                <Menu aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir navegação</TooltipContent>
          </Tooltip>

          <Link
            to="/dashboard"
            aria-label="Ir para a visão geral"
            className="inline-flex min-h-11 shrink-0 items-center"
          >
            <Logo size="sm" />
          </Link>
          <div className="min-w-0 flex-1 border-l border-border pl-3">
            <p className="truncate text-xs font-semibold text-muted-foreground">Espaço ativo</p>
            <p className="truncate text-sm font-semibold text-foreground">
              {financial.isLoading ? "A carregar" : currentSpace?.name ?? "As minhas finanças"}
            </p>
          </div>
          <AccountMenu
            compact
            email={user?.email}
            planLabel={planLabel}
            onRestartTour={restartTour}
            onSignOut={handleSignOut}
          />
        </header>

        <main
          id="dashboard-main-content"
          aria-label="Conteúdo principal"
          tabIndex={-1}
          className="min-h-0 min-w-0 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
            <Outlet />
          </div>
        </main>

        <div className="md:hidden">
          <DashboardNav
            variant="mobile"
            menuOpen={navigationOpen}
            onMenuOpen={() => setNavigationOpen(true)}
          />
        </div>
      </section>

      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent
          side="left"
          className="w-[min(22rem,calc(100vw-2rem))] overflow-y-auto p-0 sm:max-w-sm [&>button]:hidden"
        >
          <SheetHeader className="border-b border-border px-5 py-5 text-left">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Logo />
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Fechar menu"
                  title="Fechar menu"
                >
                  <X aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>
            <SheetTitle className="sr-only">Menu da aplicação</SheetTitle>
            <p className="truncate text-sm text-muted-foreground">{currentSpace?.name ?? "As minhas finanças"}</p>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4 py-5">
            <DashboardNav variant="sheet" onNavigate={() => setNavigationOpen(false)} />
            <section aria-labelledby="secondary-menu-title" className="border-t border-border pt-5">
              <h2 id="secondary-menu-title" className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                Conta e ajuda
              </h2>
              <div className="flex flex-col gap-1">
                <Link
                  to="/dashboard/diagnostico-whatsapp"
                  onClick={() => setNavigationOpen(false)}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Stethoscope aria-hidden="true" className="size-4" />
                  Diagnóstico WhatsApp
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setNavigationOpen(false);
                    restartTour();
                  }}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <CircleHelp aria-hidden="true" className="size-4" />
                  Reiniciar tutorial
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-destructive hover:bg-muted"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Terminar sessão
                </button>
              </div>
            </section>
            <div className="flex items-center gap-3 border-t border-border px-3 pt-5 text-sm">
              <Settings2 aria-hidden="true" className="size-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{user?.email ?? "Conta Organizze"}</p>
                <Link
                  to="/dashboard/assinatura"
                  onClick={() => setNavigationOpen(false)}
                  className="text-primary hover:underline"
                >
                  {planLabel} · Gerir assinatura
                </Link>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardLayout;
