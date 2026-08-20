import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarCheck, CalendarDays, GraduationCap, NotebookPen, Plus } from "lucide-react";
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
    <ClientOnly fallback={<LoadingState label="Opening your notebook…" />}>
      <Dashboard />
    </ClientOnly>
  );
}

function Dashboard() {
  const stats = useLiveQuery(() => dashboardStats(), []);
  const lessons = useLiveQuery(() => todaysLessons(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Dashboard"
        description={formatLongDate()}
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/attendance">
                <CalendarCheck className="size-4" aria-hidden="true" />
                Attendance
              </Link>
            </Button>
            <Button asChild>
              <Link to="/lessons/new">
                <Plus className="size-4" aria-hidden="true" />
                Log Lesson
              </Link>
            </Button>
          </div>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<GraduationCap className="size-4" />} label="Active Students" value={stats?.activeStudents} />
        <StatCard icon={<CalendarDays className="size-4" />} label="Lessons Today" value={stats?.todaysLessons} />
        <StatCard icon={<NotebookPen className="size-4" />} label="Total Lessons" value={stats?.totalLessons} />
      </div>

      {/* Quick Daily Attendance Widget */}
      <QuickDailyAttendanceCard />

      {/* Today's Lessons List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <NotebookPen className="size-4 text-primary" />
            Today's Logged Lessons
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/lessons">View all lessons →</Link>
          </Button>
        </div>

        {lessons === undefined ? (
          <LoadingState />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="No lessons logged for today."
            description="Log today's subjects and notes for your student."
            action={
              <Button asChild>
                <Link to="/lessons/new">
                  <Plus className="size-4" aria-hidden="true" />
                  Log Lesson Now
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
      <p className="mt-1 text-2xl font-bold text-foreground">{value ?? "—"}</p>
    </div>
  );
}
