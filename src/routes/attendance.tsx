import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Calendar, Users, CheckCircle2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  const currentMonth = today.getMonth() + 1; // 1-indexed

  if (students === undefined) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily 1-click attendance logger and monthly student attendance records."
      />

      {/* Dedicated Student Monthly Calendar Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 card-surface p-4 rounded-xl border bg-card shadow-sm">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Student Attendance Calendar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a student to view or edit their full monthly calendar
            </p>
          </div>

          <div className="w-full sm:w-64">
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
                    {student.name} ({student.className})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedStudent ? (
          <StudentAttendanceCalendar studentId={selectedStudent.id} studentName={selectedStudent.name} />
        ) : (
          <EmptyState
            icon={<Calendar className="size-6" />}
            title="No student selected."
            description="Add a student first to start tracking attendance."
          />
        )}
      </div>

      {/* All Students Monthly Summary Table */}
      {activeStudents.length > 0 && (
        <div className="card-surface p-4 rounded-xl border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              This Month's Summary Table ({today.toLocaleDateString("en-US", { month: "long", year: "numeric" })})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="p-2.5">Student</th>
                  <th className="p-2.5">Class</th>
                  <th className="p-2.5">Taught This Month</th>
                  <th className="p-2.5">All-Time Classes</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeStudents.map((student) => {
                  const stats = getMonthlyAttendanceStats(student.id, currentYear, currentMonth);
                  const total = getTotalAttendanceCount(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-muted/20">
                      <td className="p-2.5 font-medium">{student.name}</td>
                      <td className="p-2.5 text-muted-foreground">{student.className}</td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.totalClasses} classes
                      </td>
                      <td className="p-2.5 text-muted-foreground">{total} total</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate({ search: { studentId: student.id }, replace: true })}
                          className="text-primary hover:underline font-medium"
                        >
                          View Calendar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
