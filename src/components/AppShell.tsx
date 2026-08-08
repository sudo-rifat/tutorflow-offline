import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, Home, NotebookPen, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/today", label: "Today", icon: CalendarDays },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/lessons", label: "Lessons", icon: NotebookPen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-3 py-5 md:flex">
          <Link to="/" className="mb-5 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <NotebookPen className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base leading-tight font-semibold">TutorFlow</span>
              <span className="block text-xs text-muted-foreground">Plan. Teach. Track.</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(pathname, to) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive(pathname, to)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4.5" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <Link
              to="/search"
              aria-current={isActive(pathname, "/search") ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                isActive(pathname, "/search")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Search className="size-4.5" aria-hidden="true" />
              Search
            </Link>
          </nav>
          <div className="mt-auto px-1">
            <OfflineIndicator />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <NotebookPen className="size-4" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold">TutorFlow</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/search"
                aria-label="Search"
                className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground"
              >
                <Search className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-10">{children}</main>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 pt-1 backdrop-blur md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={isActive(pathname, to) ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive(pathname, to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
