import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GraduationCap, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressBar } from "@/components/ProgressBar";
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
      { name: "description", content: "All your students, their subjects, progress and next lesson." },
      { property: "og:title", content: "Students — TutorFlow" },
      { property: "og:description", content: "All your students, their subjects, progress and next lesson." },
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
        description="Everything you teach, per student."
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
          {filtered.map(({ student, subjects, totals, nextLesson, carriedForward }) => (
            <li key={student.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    className="truncate text-base font-semibold hover:underline"
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
                {subjects.length ? subjects.map((s) => s.name).join(", ") : "No subjects yet"}
              </p>

              <div className="mt-3">
                <ProgressBar
                  percent={totals.percent}
                  label={`${totals.completed} of ${totals.total} topics completed`}
                />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <dt>Pending</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {totals.pending + totals.partial + totals.notStarted}
                  </dd>
                </div>
                <div>
                  <dt>Carried forward</dt>
                  <dd className="text-sm font-medium text-foreground">{carriedForward}</dd>
                </div>
                <div>
                  <dt>Next lesson</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {nextLesson ? formatDisplayDate(nextLesson.lessonDate) : "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link to="/students/$studentId" params={{ studentId: student.id }}>
                    View
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
                  description="This also deletes their subjects, chapters, topics and lesson history from this device. This cannot be undone."
                  onConfirm={async () => {
                    try {
                      await deleteStudentCascade(student.id);
                      toast.success("Student deleted");
                    } catch (error) {
                      console.error("Failed to delete student", error);
                      toast.error("Unable to delete this student. Please try again.");
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
