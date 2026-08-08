import { cn } from "@/lib/utils";
import { TOPIC_STATUS_LABEL, TOPIC_STATUS_MARK, type TopicStatus } from "@/lib/types";

const STATUSES: TopicStatus[] = ["completed", "partial", "pending"];

const activeClass: Record<TopicStatus, string> = {
  completed: "bg-success text-success-foreground border-success",
  partial: "bg-warning text-warning-foreground border-warning",
  pending: "bg-pending text-pending-foreground border-pending",
};

export function StatusChip({
  status,
  className,
}: {
  status: TopicStatus | undefined;
  className?: string;
}) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground",
          className,
        )}
      >
        <span aria-hidden="true">·</span> Not started
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        activeClass[status],
        className,
      )}
    >
      <span aria-hidden="true">{TOPIC_STATUS_MARK[status]}</span>
      {TOPIC_STATUS_LABEL[status]}
    </span>
  );
}

/** Big tap targets — used while actually teaching. */
export function TopicStatusButtons({
  value,
  onChange,
  topicTitle,
}: {
  value: TopicStatus;
  onChange: (status: TopicStatus) => void;
  topicTitle: string;
}) {
  return (
    <div role="group" aria-label={`Status for ${topicTitle}`} className="grid grid-cols-3 gap-2">
      {STATUSES.map((status) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(status)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              selected
                ? activeClass[status]
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <span aria-hidden="true">{TOPIC_STATUS_MARK[status]}</span>
            {TOPIC_STATUS_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}
