import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  label,
  className,
}: {
  percent: number;
  label?: string;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-medium text-foreground">{value}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-success transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
