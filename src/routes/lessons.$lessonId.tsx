import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, BookOpen, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate, newId } from "@/lib/ids";
import type { LessonItem } from "@/lib/types";
import { deleteLesson, updateLesson } from "@/services/lessons";
import { getLessonSummary } from "@/services/views";
import { listSubjects } from "@/services/curriculum";

export const Route = createFileRoute("/lessons/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson Details — TutorFlow" },
      { name: "description", content: "View and edit lesson subjects and notes." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <LessonPage />
    </ClientOnly>
  ),
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const summary = useLiveQuery(() => getLessonSummary(lessonId), [lessonId]);

  const [items, setItems] = useState<LessonItem[]>([]);
  const [generalNote, setGeneralNote] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const studentSubjects = useLiveQuery(
    async () => (summary?.student ? listSubjects(summary.student.id) : []),
    [summary?.student?.id]
  );

  useEffect(() => {
    if (summary?.lesson) {
      setItems(summary.lesson.items || []);
      setGeneralNote(summary.lesson.generalNote || "");
    }
  }, [summary]);

  if (summary === undefined) return <LoadingState />;
  if (!summary) {
    return (
      <EmptyState
        title="Lesson not found."
        action={
          <Button asChild>
            <Link to="/lessons">Back to lessons</Link>
          </Button>
        }
      />
    );
  }

  const { lesson, student } = summary;

  const addSubjectItem = (subjectName: string, subjectId?: string) => {
    if (!subjectName.trim()) return;
    if (items.some((i) => i.subjectName.toLowerCase() === subjectName.trim().toLowerCase())) {
      toast.info(`${subjectName} is already added.`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: newId(),
        subjectId,
        subjectName: subjectName.trim(),
        notes: "",
      },
    ]);
  };

  const updateItemNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLesson(lesson.id, {
        items,
        generalNote: generalNote.trim() || undefined,
      });
      toast.success("Lesson updated!");
    } catch (error) {
      console.error("Failed to update lesson", error);
      toast.error("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/lessons">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All lessons
        </Link>
      </Button>

      <PageHeader
        title={student?.name ?? "Lesson"}
        description={`${formatDisplayDate(lesson.lessonDate)} · ${student?.className ?? ""}`}
        action={
          <ConfirmDialog
            title="Delete this lesson?"
            description="This lesson record will be permanently deleted."
            onConfirm={async () => {
              await deleteLesson(lesson.id);
              toast.success("Lesson deleted");
              navigate({ to: "/lessons" });
            }}
            trigger={
              <Button variant="outline" className="text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete Lesson
              </Button>
            }
          />
        }
      />

      <section className="card-surface p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              Subjects & Notes Taught
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Subjects and notes logged for this session.
            </p>
          </div>
        </div>

        {studentSubjects && studentSubjects.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Add Student Subject:</Label>
            <div className="flex flex-wrap gap-2">
              {studentSubjects.map((sub) => {
                const isAdded = items.some(
                  (i) => i.subjectName.toLowerCase() === sub.name.toLowerCase()
                );
                return (
                  <Button
                    key={sub.id}
                    type="button"
                    size="sm"
                    variant={isAdded ? "secondary" : "outline"}
                    disabled={isAdded}
                    onClick={() => addSubjectItem(sub.name, sub.id)}
                    className="text-xs"
                  >
                    <Plus className="size-3 mr-1" />
                    {sub.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Or type another subject name"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            className="text-xs h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubjectItem(customSubject);
                setCustomSubject("");
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              addSubjectItem(customSubject);
              setCustomSubject("");
            }}
            disabled={!customSubject.trim()}
          >
            Add
          </Button>
        </div>

        <div className="space-y-4 pt-2">
          {items.length === 0 ? (
            <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
              No subjects added to this lesson yet.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="p-3.5 border rounded-xl bg-card space-y-2 relative shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <span className="font-bold text-sm text-primary flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    {item.subjectName}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`notes-${item.id}`} className="text-xs font-medium text-muted-foreground">
                    Lesson Notes / Topics Covered
                  </Label>
                  <Textarea
                    id={`notes-${item.id}`}
                    rows={2}
                    placeholder="Notes..."
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="card-surface p-4 space-y-2">
        <Label htmlFor="generalNote" className="text-sm font-medium">
          General Note / Remarks
        </Label>
        <Textarea
          id="generalNote"
          rows={2}
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
          className="text-xs"
        />
      </div>

      <Button onClick={handleSave} size="lg" className="w-full sm:w-auto font-bold" disabled={saving}>
        <Save className="size-4 mr-2" />
        {saving ? "Saving Changes…" : "Save Changes"}
      </Button>
    </div>
  );
}
