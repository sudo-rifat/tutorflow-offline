import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, BookOpen, Pencil, Plus, Trash2, CalendarCheck, NotebookPen, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LessonCard } from "@/components/LessonCard";
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { EmptyState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSubject, deleteSubjectCascade, moveSubject, renameSubject } from "@/services/curriculum";
import { studentOverview } from "@/services/studentViews";
import { lessonHistory } from "@/services/views";
import { StudentAttendanceCalendar } from "@/components/StudentAttendanceCalendar";

const TABS = ["overview", "attendance", "info"] as const;
type TabValue = (typeof TABS)[number];

export const Route = createFileRoute("/students/$studentId")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabValue | undefined } => ({
    tab: TABS.includes(search["tab"] as TabValue) ? (search["tab"] as TabValue) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Student Profile — TutorFlow" },
      { name: "description", content: "Subjects, lessons, attendance and info for student." },
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
  const lessons = useLiveQuery(() => lessonHistory({ studentId }), [studentId]);
  const [newSubject, setNewSubject] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);

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

  const { student, subjects, totalLessons } = overview;

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
                  Edit Profile
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
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 gap-4">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-3 py-2 text-sm font-semibold flex items-center gap-1.5"
          >
            <NotebookPen className="size-4" />
            Overview & Lessons
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-3 py-2 text-sm font-semibold flex items-center gap-1.5"
          >
            <CalendarCheck className="size-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-3 py-2 text-sm font-semibold flex items-center gap-1.5"
          >
            <Info className="size-4" />
            Info & Notes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Lessons */}
        <TabsContent value="overview" className="space-y-5 pt-4">
          {/* Quick Action Bar */}
          <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary/5 via-card to-card border-primary/20">
            <div>
              <h3 className="font-semibold text-base">Quick Actions for {student.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalLessons} lessons logged · {subjects.length} subjects taught
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link to="/lessons/new" search={{ studentId: student.id }}>
                  <Plus className="size-4 mr-1" /> Log New Lesson
                </Link>
              </Button>
            </div>
          </div>

          {/* Subjects Management Box */}
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Student Subjects ({subjects.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowSubjectForm(!showSubjectForm)}
              >
                <Plus className="size-3 mr-1" /> Add Subject
              </Button>
            </div>

            {showSubjectForm && (
              <form
                className="flex gap-2 pt-1"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!newSubject.trim()) return;
                  try {
                    await createSubject(studentId, newSubject);
                    setNewSubject("");
                    setShowSubjectForm(false);
                    toast.success("Subject added");
                  } catch (error) {
                    console.error("Failed to add subject", error);
                    toast.error("Unable to add subject.");
                  }
                }}
              >
                <Input
                  value={newSubject}
                  onChange={(event) => setNewSubject(event.target.value)}
                  placeholder="Subject name (e.g. Higher Math)"
                  className="text-xs h-9"
                  autoFocus
                />
                <Button type="submit" size="sm">
                  Save
                </Button>
              </form>
            )}

            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No subjects added yet. Click "Add Subject" above to add your first subject for {student.name}.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/30 text-xs font-semibold"
                  >
                    <span>{sub.name}</span>
                    <ConfirmDialog
                      title={`Delete subject ${sub.name}?`}
                      description="This subject will be removed for this student."
                      onConfirm={async () => {
                        await deleteSubjectCascade(sub.id);
                        toast.success("Subject deleted");
                      }}
                      trigger={
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Lesson History</h3>
            {lessons === undefined ? (
              <LoadingState />
            ) : lessons.length === 0 ? (
              <EmptyState title="No lessons logged yet." description="Click 'Log New Lesson' above to create one." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {lessons.map((summary) => (
                  <LessonCard key={summary.lesson.id} summary={summary} showDate />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Attendance */}
        <TabsContent value="attendance" className="pt-4">
          <StudentAttendanceCalendar studentId={studentId} studentName={student.name} />
        </TabsContent>

        {/* Tab 3: Info & Notes */}
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="card-surface p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-base border-b pb-2">Student Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Class / Grade:</span>
                <span className="font-semibold">{student.className}</span>
              </div>
              {student.groupName && (
                <div>
                  <span className="text-muted-foreground block">Group / Section:</span>
                  <span className="font-semibold">{student.groupName}</span>
                </div>
              )}
              {student.preferredTime && (
                <div>
                  <span className="text-muted-foreground block">Preferred Class Time:</span>
                  <span className="font-semibold">{student.preferredTime}</span>
                </div>
              )}
              {student.guardianName && (
                <div>
                  <span className="text-muted-foreground block">Guardian Name:</span>
                  <span className="font-semibold">{student.guardianName}</span>
                </div>
              )}
              {student.phone && (
                <div>
                  <span className="text-muted-foreground block">Phone Number:</span>
                  <span className="font-semibold">{student.phone}</span>
                </div>
              )}
              {student.institution && (
                <div>
                  <span className="text-muted-foreground block">Institution / School:</span>
                  <span className="font-semibold">{student.institution}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-surface p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-base border-b pb-2">Teacher Notes & Remarks</h3>
            {student.notes ? (
              <p className="whitespace-pre-wrap text-xs">{student.notes}</p>
            ) : (
              <p className="text-muted-foreground text-xs italic">No personal notes added yet. Click "Edit Profile" above to add remarks.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
