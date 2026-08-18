import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LessonCard } from "@/components/LessonCard";
import { ProgressBar } from "@/components/ProgressBar";
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { EmptyState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSubject, deleteSubjectCascade, moveSubject, renameSubject } from "@/services/curriculum";
import { studentOverview, subjectProgressRows } from "@/services/studentViews";
import { lessonHistory } from "@/services/views";

const TABS = ["overview", "subjects", "lessons", "notes"] as const;
type TabValue = (typeof TABS)[number];

export const Route = createFileRoute("/students/$studentId")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabValue | undefined } => ({
    tab: TABS.includes(search["tab"] as TabValue) ? (search["tab"] as TabValue) : undefined,
  }),


  head: () => ({
    meta: [
      { title: "Student Profile — TutorFlow" },
      { name: "description", content: "Subjects, chapters, topics, lessons and progress for one student." },
      { property: "og:title", content: "Student Profile — TutorFlow" },
      { property: "og:description", content: "Subjects, chapters, topics, lessons and progress for one student." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <StudentProfile />
    </ClientOnly>
  ),
});


function StudentProfile() {
  const { studentId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const overview = useLiveQuery(() => studentOverview(studentId), [studentId]);
  const subjectRows = useLiveQuery(() => subjectProgressRows(studentId), [studentId]);
  const lessons = useLiveQuery(() => lessonHistory({ studentId }), [studentId]);
  const [newSubject, setNewSubject] = useState("");


  if (overview === undefined) return <LoadingState />;
  if (!overview) {
    return (
      <EmptyState
        title="Student not found."
        description="This student may have been deleted."
        action={
          <Button asChild>
            <Link to="/students">Back to students</Link>
          </Button>
        }
      />
    );
  }

  const { student, totals } = overview;

  return (
    <div className="space-y-5">
      <PageHeader
        title={student.name}
        description={`${student.className}${student.groupName ? ` · ${student.groupName}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={student.status === "active" ? "default" : "secondary"}>
              {student.status === "active" ? "Active" : "Inactive"}
            </Badge>
            <StudentFormDialog
              student={student}
              trigger={
                <Button variant="outline">
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              }
            />
          </div>
        }
      />

      <Tabs
        value={tab ?? "overview"}
        onValueChange={(value) =>
          navigate({ search: { tab: value as TabValue }, params: { studentId }, replace: true })
        }
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Subjects" value={overview.subjects.length} />
            <Stat label="Chapters" value={totals.chapters} />
            <Stat label="Topics" value={totals.total} />
            <Stat label="Completed" value={totals.completed} />
          </div>
          <div className="card-surface p-4">
            <ProgressBar percent={totals.percent} label="Overall progress" />
            <p className="mt-3 text-sm text-muted-foreground">
              {totals.completed} completed · {totals.partial} partial · {totals.pending} pending ·{" "}
              {totals.notStarted} not started
            </p>
          </div>
          {student.phone || student.guardianName || student.preferredTime ? (
            <div className="card-surface space-y-1 p-4 text-sm">
              {student.preferredTime ? <p>Preferred time: {student.preferredTime}</p> : null}
              {student.guardianName ? <p>Guardian: {student.guardianName}</p> : null}
              {student.phone ? <p>Phone: {student.phone}</p> : null}
              {student.institution ? <p>Institution: {student.institution}</p> : null}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 pt-4">
          <form
            className="flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newSubject.trim()) return;
              try {
                await createSubject(studentId, newSubject);
                setNewSubject("");
                toast.success("Subject added");
              } catch (error) {
                console.error("Failed to add subject", error);
                toast.error("Unable to add this subject. Please try again.");
              }
            }}
          >
            <Input
              value={newSubject}
              onChange={(event) => setNewSubject(event.target.value)}
              placeholder="Add a subject, e.g. Physics"
              aria-label="Subject name"
            />
            <Button type="submit">
              <Plus className="size-4" aria-hidden="true" />
              Add
            </Button>
          </form>

          {subjectRows === undefined ? (
            <LoadingState />
          ) : subjectRows.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-5" />}
              title="No subjects yet."
              description="Add the subjects you teach this student."
            />
          ) : (
            <ul className="space-y-3">
              {subjectRows.map(({ subject, summary, chapters }) => (
                <li key={subject.id} className="card-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/subjects/$subjectId"
                      params={{ subjectId: subject.id }}
                      className="text-base font-semibold hover:underline"
                    >
                      {subject.name}
                    </Link>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${subject.name} up`}
                        onClick={() => moveSubject(subject.id, -1)}
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${subject.name} down`}
                        onClick={() => moveSubject(subject.id, 1)}
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${subject.name}`}
                        onClick={async () => {
                          const name = window.prompt("Subject name", subject.name);
                          if (name?.trim()) await renameSubject(subject.id, name);
                        }}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <ConfirmDialog
                        title={`Delete ${subject.name}?`}
                        description="Its chapters, topics and lessons for this subject will also be deleted."
                        onConfirm={async () => {
                          await deleteSubjectCascade(subject.id);
                          toast.success("Subject deleted");
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${subject.name}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chapters} chapters · {summary.total} topics
                  </p>
                  <div className="mt-3">
                    <ProgressBar percent={summary.percent} label="Progress" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4 pt-4">
          {lessons === undefined ? (
            <LoadingState />
          ) : lessons.length === 0 ? (
            <EmptyState title="No lessons yet." description="Create a lesson to start tracking progress." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {lessons.map((summary) => (
                <LessonCard key={summary.lesson.id} summary={summary} showDate />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <div className="card-surface p-4 text-sm">
            {student.notes ? (
              <p className="whitespace-pre-wrap">{student.notes}</p>
            ) : (
              <p className="text-muted-foreground">No notes yet. Use Edit to add notes about this student.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
