import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="card-surface space-y-3 border-destructive/30 px-6 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      {action}
    </div>
  );
}
