import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, GraduationCap, ListTodo, Plus, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LessonCard } from "@/components/LessonCard";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/ids";
import { carryForwardViews, dashboardStats, todaysLessons } from "@/services/views";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TutorFlow — Offline Tutor Lesson Planner" },
      {
        name: "description",
        content:
          "TutorFlow is an offline-first lesson planner for private tutors: students, subjects, chapters, topics, daily lessons and progress, stored on your own device.",
      },
      { property: "og:title", content: "TutorFlow — Plan. Teach. Track. Offline." },
      {
        property: "og:description",
        content: "Plan daily lessons, track topic progress and carry forward unfinished work — fully offline.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ClientOnly fallback={<LoadingState label="Opening your notebook…" />}>
      <Dashboard />
    </ClientOnly>
  );
}

function Dashboard() {
  const stats = useLiveQuery(() => dashboardStats(), []);
  const lessons = useLiveQuery(() => todaysLessons(), []);
  const carry = useLiveQuery(() => carryForwardViews(), []);

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<GraduationCap className="size-4" />} label="Active students" value={stats?.activeStudents} />
        <StatCard icon={<CalendarDays className="size-4" />} label="Lessons today" value={stats?.todaysLessons} />
        <StatCard icon={<ListTodo className="size-4" />} label="Pending topics" value={stats?.pendingTopics} />
        <StatCard icon={<RotateCcw className="size-4" />} label="Carried forward" value={stats?.carriedForward} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Today&apos;s lessons</h2>
        {lessons === undefined ? (
          <LoadingState />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="No lessons planned for today."
            description="Create a lesson to see today's topics here."
            action={
              <Button asChild>
                <Link to="/lessons/new">
                  <Plus className="size-4" aria-hidden="true" />
                  Create lesson
                </Link>
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
      </section>

      {carry && carry.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Carried forward</h2>
          <ul className="card-surface divide-y divide-border">
            {carry.slice(0, 8).map((view) => (
              <li key={view.item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{view.topic?.title ?? "Removed topic"}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {view.student?.name}
                    {view.chapter ? ` · Chapter ${view.chapter.chapterNumber}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {view.item.targetDate ?? "Unscheduled"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="card-surface px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}
