import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LessonCard } from "@/components/LessonCard";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/ids";
import { todaysLessons } from "@/services/views";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today's Lessons — TutorFlow" },
      { name: "description", content: "Every lesson planned for today, sorted by class time." },
      { property: "og:title", content: "Today's Lessons — TutorFlow" },
      { property: "og:description", content: "Every lesson planned for today, sorted by class time." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <TodayPage />
    </ClientOnly>
  ),
});

function TodayPage() {
  const lessons = useLiveQuery(() => todaysLessons(), []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today"
        description={formatLongDate()}
        action={
          <Button asChild>
            <Link to="/lessons/new">
              <Plus className="size-4" aria-hidden="true" />
              New lesson
            </Link>
          </Button>
        }
      />
      {lessons === undefined ? (
        <LoadingState />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Nothing scheduled today."
          description="Plan a lesson and it will show up here."
          action={
            <Button asChild>
              <Link to="/lessons/new">Create lesson</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lessons.map((summary) => (
            <LessonCard key={summary.lesson.id} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}
