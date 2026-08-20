import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarRange,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PiggyBank,
  ReceiptText,
  Target,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

type PrimaryNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type PrimaryNavGroup = {
  label: string;
  links: PrimaryNavLink[];
};

// eslint-disable-next-line react-refresh/only-export-components
export const primaryNavGroups: PrimaryNavGroup[] = [
  {
    label: "Acompanhar",
    links: [
      { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard, end: true },
      { to: "/dashboard/lancamentos", label: "Lançamentos", icon: ReceiptText },
      { to: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Planear",
    links: [
      { to: "/dashboard/orcamento", label: "Orçamento", icon: PiggyBank },
      { to: "/dashboard/planos", label: "Planos", icon: CalendarRange },
      { to: "/dashboard/limite-de-gastos", label: "Limites", icon: Gauge },
      { to: "/dashboard/objetivos", label: "Objetivos", icon: Target },
    ],
  },
  {
    label: "Partilhar e automatizar",
    links: [
      { to: "/dashboard/grupos", label: "Espaços", icon: Users },
      { to: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { to: "/dashboard/assinatura", label: "Assinatura", icon: CreditCard },
    ],
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const mobilePrimaryLinks = [
  primaryNavGroups[0].links[0],
  primaryNavGroups[0].links[1],
  primaryNavGroups[1].links[0],
  primaryNavGroups[0].links[2],
  { label: "Menu", icon: Menu, menu: true as const },
];

type DashboardNavProps = {
  variant: "desktop" | "sheet" | "mobile";
  menuOpen?: boolean;
  onMenuOpen?: () => void;
  onNavigate?: () => void;
};

const linkClassName = (variant: DashboardNavProps["variant"]) => ({ isActive }: { isActive: boolean }) =>
  cn("focus-ring interactive-control relative flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 text-sm font-medium", variant === "desktop"
    ? isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:h-5 before:w-1 before:bg-marker before:content-['']"
      : "text-sidebar-foreground/58 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    : isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground");

const GroupedNavigation = ({ onNavigate, variant }: Pick<DashboardNavProps, "onNavigate" | "variant">) => (
  <div className="flex flex-col gap-5">
    {primaryNavGroups.map((group) => (
      <section key={group.label} aria-labelledby={`nav-group-${group.label}`}>
        <h2 id={`nav-group-${group.label}`} className={cn("mb-1 px-3 font-mono text-[9px] font-semibold uppercase", variant === "desktop" ? "text-sidebar-foreground/35" : "text-muted-foreground")}>
          {group.label}
        </h2>
        <div className="flex flex-col gap-0.5">
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              data-tour={`nav-${link.to.split("/").pop()}`}
              onClick={onNavigate}
              className={linkClassName(variant)}
            >
              <link.icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </section>
    ))}
  </div>
);

export const DashboardNav = ({ variant, menuOpen, onMenuOpen, onNavigate }: DashboardNavProps) => {
  if (variant === "mobile") {
    return (
      <nav aria-label="Navegação móvel" className="grid grid-cols-5 border-t border-border bg-card">
        {mobilePrimaryLinks.map((item) => {
          if ("menu" in item) {
            return (
              <button
                key={item.label}
                type="button"
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
                onClick={onMenuOpen}
                className="focus-ring interactive-control flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon aria-hidden="true" className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "focus-ring interactive-control flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold",
                  isActive ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon aria-hidden="true" className="size-5" />
              <span className="max-w-full truncate px-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegação principal"
      className={cn("min-w-0", variant === "desktop" ? "flex-1" : "pb-4")}
    >
      <GroupedNavigation onNavigate={onNavigate} variant={variant} />
    </nav>
  );
};
