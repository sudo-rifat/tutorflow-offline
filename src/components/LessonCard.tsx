import { Link } from "@tanstack/react-router";
import { Clock, ChevronRight, BookOpen, Calendar } from "lucide-react";
import { formatDisplayDate } from "@/lib/ids";
import type { LessonSummary } from "@/services/views";

const SUBJECT_COLORS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60",
  "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60",
  "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60",
];

function getSubjectColorClass(name: string, index: number) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash + index) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[colorIndex];
}

export function LessonCard({ summary, showDate = false }: { summary: LessonSummary; showDate?: boolean }) {
  const { lesson, student } = summary;

  return (
    <article className="card-surface p-4.5 rounded-xl border bg-card hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div className="min-w-0">
            <Link
              to="/students/$studentId"
              params={{ studentId: lesson.studentId }}
              className="truncate text-base font-bold tracking-tight hover:text-primary transition-colors block"
            >
              {student?.name ?? "Student"}
            </Link>
            <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
              {student?.className ?? "Class"}
              {student?.groupName ? ` · ${student.groupName}` : ""}
            </p>
          </div>

          <div className="shrink-0 text-right text-xs text-muted-foreground flex flex-col items-end gap-0.5">
            {showDate ? (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                <Calendar className="size-3 text-muted-foreground" />
                {formatDisplayDate(lesson.lessonDate)}
              </span>
            ) : null}
            {student?.preferredTime ? (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Clock className="size-3" aria-hidden="true" />
                {student.preferredTime}
              </span>
            ) : null}
          </div>
        </div>

        {/* Subjects & Notes List */}
        {lesson.items && lesson.items.length > 0 ? (
          <div className="space-y-2.5">
            {lesson.items.map((item, idx) => (
              <div key={item.id} className="bg-muted/25 p-3 rounded-lg text-xs space-y-1.5 border border-border/40">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${getSubjectColorClass(
                      item.subjectName,
                      idx
                    )}`}
                  >
                    <BookOpen className="size-3" />
                    {item.subjectName}
                  </span>
                </div>
                {item.notes ? (
                  <p className="text-foreground/90 whitespace-pre-wrap pl-1 font-normal leading-relaxed text-[12.5px]">
                    {item.notes}
                  </p>
                ) : (
                  <p className="text-muted-foreground/60 italic pl-1 text-[11px]">No notes written</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">No subjects logged for this lesson.</p>
        )}

        {/* General Note */}
        {lesson.generalNote ? (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 bg-muted/20 p-2 rounded-md">
            <span className="font-semibold text-foreground">Teacher Note: </span>
            {lesson.generalNote}
          </div>
        ) : null}
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        <Link
          to="/lessons/$lessonId"
          params={{ lessonId: lesson.id }}
          className="inline-flex min-h-9 w-full items-center justify-between rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3.5 text-xs font-semibold transition-all group"
        >
          <span>View / Edit Details</span>
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
