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
            <li key={student.id} className="card-surface flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    className="block truncate text-base font-semibold hover:underline"
                  >
                    {student.name}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {student.className}
                    {student.groupName ? ` · ${student.groupName}` : ""}
                  </p>
                </div>
                {student.status === "active" ? null : <Badge variant="secondary">Inactive</Badge>}
              </div>

              <p className="truncate text-sm text-muted-foreground">
                {subjects.length ? subjects.map((s) => s.name).join(", ") : "No subjects yet"}
              </p>

              <p className="text-xs text-muted-foreground">
                {totalLessons} lessons
                {nextLesson ? ` · next ${formatDisplayDate(nextLesson.lessonDate)}` : ""}
              </p>

              <div className="flex items-center gap-1.5 pt-1">
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
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    search={{ tab: "subjects" }}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Subject
                  </Link>
                </Button>

                <div className="ml-auto flex items-center gap-0.5">
                  <StudentFormDialog
                    student={student}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${student.name}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={student.status === "active" ? "Deactivate" : "Activate"}
                    onClick={async () => {
                      await toggleStudentStatus(student);
                      toast.success(student.status === "active" ? "Marked inactive" : "Marked active");
                    }}
                  >
                    <Power className="size-4" aria-hidden="true" />
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${student.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </li>
          ))}

        </ul>
      )}
    </div>
  );
}
