import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarCheck, GraduationCap, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { EmptyState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDisplayDate } from "@/lib/ids";
import { deleteStudentCascade, toggleStudentStatus } from "@/services/students";
import { studentOverviews } from "@/services/studentViews";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — TutorFlow" },
      { name: "description", content: "All your students, their subjects and lessons." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <StudentsPage />
    </ClientOnly>
  ),
});

function StudentsPage() {
  const [query, setQuery] = useState("");
  const overviews = useLiveQuery(() => studentOverviews(), []);
  const filtered = overviews?.filter((o) =>
    `${o.student.name} ${o.student.className}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Manage your students, subjects, attendance and lessons."
        action={
          <StudentFormDialog
            trigger={
              <Button>
                <Plus className="size-4" aria-hidden="true" />
                Add student
              </Button>
            }
          />
        }
      />

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students by name or class"
        aria-label="Search students"
      />

      {filtered === undefined ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-5" />}
          title={query ? "No students match that search." : "No students yet."}
          description={query ? "Try a different name." : "Add your first student to start planning lessons."}
          action={
            query ? undefined : (
              <StudentFormDialog
                trigger={
                  <Button>
                    <Plus className="size-4" aria-hidden="true" />
                    Add student
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {filtered.map(({ student, subjects, totalLessons, nextLesson }) => (
            <li key={student.id} className="card-surface p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/students/$studentId"
                      params={{ studentId: student.id }}
                      className="truncate text-base font-semibold hover:underline block"
                    >
                      {student.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {student.className}
                      {student.groupName ? ` · ${student.groupName}` : ""}
                    </p>
                  </div>
                  <Badge variant={student.status === "active" ? "default" : "secondary"}>
                    {student.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-semibold text-xs text-muted-foreground block">Subjects:</span>
                  {subjects.length ? subjects.map((s) => s.name).join(", ") : "No subjects added yet"}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-b py-2 my-3">
                  <div>
                    <dt className="text-muted-foreground">Total Lessons</dt>
                    <dd className="text-sm font-semibold text-foreground">{totalLessons}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Next Scheduled</dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {nextLesson ? formatDisplayDate(nextLesson.lessonDate) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="secondary" size="sm">
                  <Link to="/students/$studentId" params={{ studentId: student.id }}>
                    Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    search={{ tab: "attendance" }}
                  >
                    <CalendarCheck className="size-3.5" aria-hidden="true" />
                    Attendance
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    search={{ tab: "subjects" }}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Subject
                  </Link>
                </Button>

                <StudentFormDialog
                  student={student}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await toggleStudentStatus(student);
                    toast.success(student.status === "active" ? "Marked inactive" : "Marked active");
                  }}
                >
                  <Power className="size-3.5" aria-hidden="true" />
                  {student.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <ConfirmDialog
                  title={`Delete ${student.name}?`}
                  description="This student and their records will be removed."
                  onConfirm={async () => {
                    try {
                      await deleteStudentCascade(student.id);
                      toast.success("Student deleted");
                    } catch (error) {
                      console.error("Failed to delete student", error);
                      toast.error("Unable to delete this student.");
                    }
                  }}
                  trigger={
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
