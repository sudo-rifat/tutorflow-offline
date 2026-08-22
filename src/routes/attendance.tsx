import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LoadingState, EmptyState } from "@/components/states";
import { StudentAttendanceCalendar } from "@/components/StudentAttendanceCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listStudents } from "@/services/students";
import { getMonthlyAttendanceStats, getTotalAttendanceCount } from "@/services/attendance";

export const Route = createFileRoute("/attendance")({
  validateSearch: (search: Record<string, unknown>): { studentId?: string } => ({
    studentId: typeof search.studentId === "string" ? search.studentId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Attendance & Monthly Logs — TutorFlow" },
      { name: "description", content: "Track daily student attendance and monthly class summaries." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <AttendancePage />
    </ClientOnly>
  ),
});

function AttendancePage() {
  const { studentId: searchStudentId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const students = useLiveQuery(() => listStudents(), []);

  const activeStudents = students?.filter((s) => s.status === "active") ?? [];
  const selectedStudentId = searchStudentId ?? activeStudents[0]?.id ?? "";
  const selectedStudent = students?.find((s) => s.id === selectedStudentId);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (students === undefined) return <LoadingState />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        action={
          <div className="w-full sm:w-56">
            <Select
              value={selectedStudentId}
              onValueChange={(val) => navigate({ search: { studentId: val }, replace: true })}
            >
              <SelectTrigger aria-label="Select student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {selectedStudent ? (
        <StudentAttendanceCalendar studentId={selectedStudent.id} studentName={selectedStudent.name} />
      ) : (
        <EmptyState
          icon={<Calendar className="size-5" />}
          title="No students yet"
          description="Add a student to start tracking attendance."
        />
      )}

      {activeStudents.length > 0 && (
        <section className="card-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">
            {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <ul className="divide-y divide-border">
            {activeStudents.map((student) => {
              const stats = getMonthlyAttendanceStats(student.id, currentYear, currentMonth);
              const total = getTotalAttendanceCount(student.id);
              return (
                <li key={student.id} className="flex items-center justify-between gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => navigate({ search: { studentId: student.id }, replace: true })}
                    className="min-w-0 truncate text-left text-sm font-medium hover:underline"
                  >
                    {student.name}
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <strong className="text-foreground">{stats.totalClasses}</strong> this month · {total} total
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
