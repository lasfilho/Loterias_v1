"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  Settings,
  Sparkles,
  History,
  LineChart,
  Menu,
  FlaskConical,
  ClipboardCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DISCLAIMER, GAMES, GAME_SLUGS } from "@/modules/shared/constants";
import { ThemeToggle } from "./theme-toggle";
import {
  SidebarLayoutProvider,
  useSidebarLayout,
} from "./sidebar-layout-context";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Importação", href: "/importacao", icon: Database },
  { name: "Análises", href: "/analises", icon: LineChart },
  { name: "Backtest", href: "/backtest", icon: FlaskConical },
  { name: "Palpites", href: "/palpites", icon: Sparkles },
  { name: "Conferência", href: "/conferencia", icon: ClipboardCheck },
  { name: "Histórico", href: "/historico", icon: History },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebarLayout();

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <SidebarToggleTab collapsed={collapsed} onToggle={toggle} />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-200 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:-translate-x-full" : "lg:translate-x-0"
        )}
      >
        <div className="p-5 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 min-w-0"
            onClick={() => setOpen(false)}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm tracking-tight truncate">
                Loteria Analytics
              </p>
              <p className="text-[11px] text-muted-foreground">
                Plataforma analítica
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin space-y-6">
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Geral
            </p>
            <div className="space-y-0.5">
              {mainNav.slice(0, 1).map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Modalidades
            </p>
            <div className="space-y-0.5">
              {GAME_SLUGS.map((slug) => {
                const game = GAMES[slug];
                const href = `/${slug}`;
                return (
                  <Link
                    key={slug}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === href || pathname.startsWith(href + "/")
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: game.color }}
                    />
                    {game.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ferramentas
            </p>
            <div className="space-y-0.5">
              {mainNav.slice(1).map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href || pathname.startsWith(item.href + "/")}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {DISCLAIMER}
          </p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SidebarToggleTab({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "fixed top-1/2 z-50 hidden lg:flex -translate-y-1/2 flex",
        "h-14 w-5 items-center justify-center",
        "bg-card/95 backdrop-blur-sm border border-border",
        "rounded-r-md shadow-md",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        "transition-[left,background-color,color] duration-200",
        collapsed ? "left-0 border-l-0" : "left-64 border-l"
      )}
      aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      title={collapsed ? "Expandir menu" : "Recolher menu"}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: (typeof mainNav)[0];
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.name}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayoutProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarLayoutProvider>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarLayout();

  return (
    <div className="min-h-screen gradient-mesh">
      <Sidebar />
      <main
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-0" : "lg:pl-64"
        )}
      >
        <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
