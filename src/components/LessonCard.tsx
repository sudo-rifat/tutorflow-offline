import { Link } from "@tanstack/react-router";
import { Clock, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/TopicStatus";
import { formatDisplayDate } from "@/lib/ids";
import type { LessonSummary } from "@/services/views";

export function LessonCard({ summary, showDate = false }: { summary: LessonSummary; showDate?: boolean }) {
  const { lesson, student, subject, chapter, topics, counts, percent } = summary;

  return (
    <article className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{student?.name ?? "Unknown student"}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {subject?.name ?? "Subject"}
            {chapter ? ` · Chapter ${chapter.chapterNumber} — ${chapter.title}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          {showDate ? <div>{formatDisplayDate(lesson.lessonDate)}</div> : null}
          {student?.preferredTime ? (
            <div className="mt-0.5 inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {student.preferredTime}
            </div>
          ) : null}
        </div>
      </div>

      {topics.length ? (
        <ul className="mt-3 space-y-1">
          {topics.slice(0, 5).map(({ lessonTopic, topic }) => (
            <li key={lessonTopic.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{topic?.title ?? "Removed topic"}</span>
              <StatusChip status={lessonTopic.status} />
            </li>
          ))}
          {topics.length > 5 ? (
            <li className="text-xs text-muted-foreground">+ {topics.length - 5} more topics</li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No topics added to this lesson yet.</p>
      )}

      <div className="mt-4 space-y-3">
        <ProgressBar percent={percent} label={`${counts.completed}/${topics.length} completed`} />
        <Link
          to="/lessons/$lessonId"
          params={{ lessonId: lesson.id }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open lesson
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
