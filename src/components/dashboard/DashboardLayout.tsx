import { Suspense, useRef, useState } from "react";
import { CircleHelp, CreditCard, LogOut, Menu, Settings2, Stethoscope, UserRound, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import DashboardRouteBoundary from "@/components/dashboard/DashboardRouteBoundary";
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

const AccountMenu = ({ compact, tone = "dark", email, planLabel, onRestartTour, onSignOut }: AccountMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const trigger = (
    <Button
      variant="ghost"
      size={compact ? "icon" : "default"}
      className={
        compact
          ? "size-11 rounded-md border border-transparent hover:border-border hover:bg-muted"
          : "h-11 w-full justify-start rounded-md border-transparent px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }
      aria-label={compact ? "Abrir menu da conta" : undefined}
    >
      <span className={tone === "dark" ? "flex size-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent text-marker" : "surface-quiet flex size-8 shrink-0 items-center justify-center text-primary"}>
        <UserRound aria-hidden="true" className="size-4" />
      </span>
      {!compact && (
        <span className="ml-2 min-w-0 text-left">
          <span className="block max-w-36 truncate text-label text-sidebar-foreground">{email ?? "Conta Organizze"}</span>
          <span className="block max-w-36 truncate text-label font-normal text-sidebar-foreground/50">{planLabel}</span>
        </span>
      )}
    </Button>
  );

  return (
    <DropdownMenu onOpenChange={(open) => {
      setMenuOpen(open);
      if (open) setTooltipOpen(false);
    }}>
      {compact ? (
        <Tooltip open={tooltipOpen && !menuOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Abrir menu da conta</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={compact ? "end" : "start"}
        side={compact ? "bottom" : "right"}
        className="w-72 rounded-md border border-border bg-popover p-1.5 shadow-menu"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
          <span className="truncate text-sm font-semibold text-foreground">{email ?? "Conta Organizze"}</span>
          <span className="text-xs font-normal text-primary">{planLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild className="min-h-11 cursor-pointer gap-3 rounded text-sm text-muted-foreground focus:bg-muted focus:text-foreground">
            <Link to="/dashboard/assinatura">
              <CreditCard aria-hidden="true" className="size-4 text-primary" />
              Gerir assinatura
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11 cursor-pointer gap-3 rounded text-sm text-muted-foreground focus:bg-muted focus:text-foreground">
            <Link to="/dashboard/diagnostico-whatsapp">
              <Stethoscope aria-hidden="true" className="size-4 text-data-blue" />
              Diagnóstico WhatsApp
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onRestartTour} className="min-h-11 cursor-pointer gap-3 rounded text-sm text-muted-foreground focus:bg-muted focus:text-foreground">
            <CircleHelp aria-hidden="true" className="size-4 text-warning" />
            Reiniciar tutorial
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => void onSignOut()}
            className="min-h-11 cursor-pointer gap-3 rounded text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Terminar sessão
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationTriggerRef = useRef<HTMLElement | null>(null);
  const { user } = useAuth();
  const financial = useFinancialContext();
  const subscription = useSubscriptionV2();
  const { toast } = useToast();
  const currentSpace = financial.data?.spaces.find((space) => space.id === financial.data?.spaceId);
  const planLabel = subscription.isLoading ? "A consultar plano" : subscriptionLabel(subscription.data);
  const restartTour = () => window.dispatchEvent(new CustomEvent("organizze:start-tour"));
  const openNavigation = () => {
    if (document.activeElement instanceof HTMLElement) navigationTriggerRef.current = document.activeElement;
    setNavigationOpen(true);
  };

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
    <div className="product-shell grid h-[100dvh] max-h-[100dvh] min-h-0 grid-cols-1 overflow-hidden bg-background text-foreground lg:grid-cols-[228px_minmax(0,1fr)]">
      <a
        href="#dashboard-main-content"
        className="focus-ring sr-only z-[60] min-h-11 items-center rounded-md bg-marker px-4 font-semibold text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:flex"
      >
        Saltar para o conteúdo
      </a>

      <aside className="product-sidebar hidden min-h-0 min-w-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="product-sidebar__brand flex h-16 shrink-0 items-center px-4">
          <Link to="/dashboard" aria-label="Ir para a visão geral" className="focus-ring inline-flex min-h-11 items-center rounded-md">
            <Logo white />
          </Link>
        </div>
        <div className="product-sidebar__space mx-3 mb-3 shrink-0 border-y border-sidebar-border px-2 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-marker" aria-hidden="true" />
            <p className="font-mono text-label uppercase text-sidebar-foreground/50">Espaço ativo</p>
          </div>
          <p className="mt-1 truncate text-body-small font-semibold text-sidebar-foreground">
            {financial.isLoading ? "A carregar..." : currentSpace?.name ?? "As minhas finanças"}
          </p>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3">
          <DashboardNav variant="desktop" />
        </div>
        <div className="product-sidebar__account border-t border-sidebar-border p-3">
          <AccountMenu
            tone="dark"
            email={user?.email}
            planLabel={planLabel}
            onRestartTour={restartTour}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-rows-[minmax(0,1fr)]">
        <header className="product-mobile-bar flex min-h-16 min-w-0 items-center gap-2 border-b border-border bg-card px-3 py-2 sm:px-4 lg:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden size-11 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground md:inline-flex"
                aria-label="Abrir navegação"
                aria-expanded={navigationOpen}
                onClick={openNavigation}
              >
                <Menu aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir navegação</TooltipContent>
          </Tooltip>

          <Link
            to="/dashboard"
            aria-label="Ir para a visão geral"
            className="focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md"
          >
            <Logo size="sm" />
          </Link>
          <div className="min-w-0 flex-1 border-l border-border pl-3">
            <p className="truncate text-label uppercase text-muted-foreground">Espaço ativo</p>
            <p className="truncate text-body-small font-semibold text-foreground">
              {financial.isLoading ? "A carregar" : currentSpace?.name ?? "As minhas finanças"}
            </p>
          </div>
          <AccountMenu
            compact
            tone="dark"
            email={user?.email}
            planLabel={planLabel}
            onRestartTour={restartTour}
            onSignOut={handleSignOut}
          />
        </header>

        <main
          id="dashboard-main-content"
          aria-label="Conteúdo principal"
          data-scroll-owner="dashboard-content"
          tabIndex={-1}
          className="min-h-0 min-w-0 overflow-y-auto overscroll-contain"
        >
          <div className="product-content mx-auto w-full max-w-[1360px] animate-fade-in px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <DashboardRouteBoundary key={location.pathname}>
              <Suspense fallback={<p role="status" className="py-12 text-sm text-muted-foreground">A carregar esta página...</p>}>
                <Outlet />
              </Suspense>
            </DashboardRouteBoundary>
          </div>
        </main>

        <div className="md:hidden">
          <DashboardNav
            variant="mobile"
            menuOpen={navigationOpen}
            onMenuOpen={openNavigation}
          />
        </div>
      </section>

      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent
          side="left"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            navigationTriggerRef.current?.focus();
          }}
          className="product-navigation-sheet h-[100dvh] max-h-[100dvh] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto border-r border-sidebar-border bg-sidebar p-0 sm:max-w-sm [&>button]:hidden"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-3 text-left">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Logo white />
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-md border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label="Fechar menu"
                  title="Fechar menu"
                >
                  <X aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>
            <SheetTitle className="sr-only">Menu da aplicação</SheetTitle>
            <p className="truncate text-body-small text-sidebar-foreground/50">{currentSpace?.name ?? "As minhas finanças"}</p>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-3 py-4">
            <DashboardNav variant="sheet" onNavigate={() => setNavigationOpen(false)} />
            <section aria-labelledby="secondary-menu-title" className="border-t border-sidebar-border pt-4">
              <h2 id="secondary-menu-title" className="mb-1 px-3 font-mono text-label uppercase text-sidebar-foreground/50">
                Conta e ajuda
              </h2>
              <div className="flex flex-col gap-0.5">
                <Link
                  to="/dashboard/diagnostico-whatsapp"
                  onClick={() => setNavigationOpen(false)}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Stethoscope aria-hidden="true" className="size-4 text-marker" />
                  Diagnóstico WhatsApp
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setNavigationOpen(false);
                    restartTour();
                  }}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <CircleHelp aria-hidden="true" className="size-4 text-marker" />
                  Reiniciar tutorial
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="focus-ring interactive-control flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Terminar sessão
                </button>
              </div>
            </section>
            <div className="flex min-h-11 items-center gap-3 border-t border-sidebar-border px-3 pt-4 text-sm">
              <Settings2 aria-hidden="true" className="size-4 text-sidebar-foreground/50" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-sidebar-foreground">{user?.email ?? "Conta Organizze"}</p>
                <Link
                  to="/dashboard/assinatura"
                  onClick={() => setNavigationOpen(false)}
                  className="inline-flex min-h-11 items-center text-xs text-marker hover:underline"
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
