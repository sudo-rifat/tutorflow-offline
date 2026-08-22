import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LessonCard } from "@/components/LessonCard";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/ids";
import { dashboardStats, todaysLessons } from "@/services/views";
import { QuickDailyAttendanceCard } from "@/components/QuickDailyAttendanceCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TutorFlow — Offline Tutor Dashboard" },
      {
        name: "description",
        content: "Offline-first daily tutor dashboard: log lessons and mark attendance in seconds.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ClientOnly fallback={<LoadingState />}>
      <Dashboard />
    </ClientOnly>
  );
}

function Dashboard() {
  const stats = useLiveQuery(() => dashboardStats(), []);
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
              Log lesson
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Students" value={stats?.activeStudents} />
        <StatCard label="Today" value={stats?.todaysLessons} />
        <StatCard label="All lessons" value={stats?.totalLessons} />
      </div>

      <QuickDailyAttendanceCard />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Today's lessons</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/lessons">All lessons</Link>
          </Button>
        </div>

        {lessons === undefined ? (
          <LoadingState />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Nothing logged today"
            action={
              <Button asChild>
                <Link to="/lessons/new">
                  <Plus className="size-4" aria-hidden="true" />
                  Log lesson
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {lessons.map((summary) => (
              <LessonCard key={summary.lesson.id} summary={summary} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="card-surface px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-foreground">{value ?? "—"}</p>
    </div>
  );
}
