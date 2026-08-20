import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newId, todayString, yesterdayString } from "@/lib/ids";
import type { LessonItem } from "@/lib/types";
import { createLesson } from "@/services/lessons";
import { listSubjects } from "@/services/curriculum";
import { listStudents } from "@/services/students";

export const Route = createFileRoute("/lessons/new")({
  validateSearch: (search: Record<string, unknown>): { studentId?: string } => ({
    studentId: typeof search.studentId === "string" ? search.studentId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create Lesson — TutorFlow" },
      { name: "description", content: "Log today's subjects and notes for your student." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <NewLessonPage />
    </ClientOnly>
  ),
});

function NewLessonPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [lessonDate, setLessonDate] = useState(todayString());
  const [studentId, setStudentId] = useState(searchParams.studentId ?? "");
  const [items, setItems] = useState<LessonItem[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [saving, setSaving] = useState(false);

  const students = useLiveQuery(() => listStudents(), []);
  const subjects = useLiveQuery(async () => (studentId ? listSubjects(studentId) : []), [studentId]);

  useEffect(() => {
    if (searchParams.studentId) {
      setStudentId(searchParams.studentId);
    }
  }, [searchParams.studentId]);

  // When student changes, reset items
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    setItems([]);
  };

  const addSubjectItem = (subjectName: string, subjectId?: string) => {
    if (!subjectName.trim()) return;
    if (items.some((i) => i.subjectName.toLowerCase() === subjectName.trim().toLowerCase())) {
      toast.info(`${subjectName} is already added to this lesson.`);
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!studentId) {
      toast.error("Please select a student.");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one subject to this lesson.");
      return;
    }

    setSaving(true);
    try {
      const lesson = await createLesson({
        studentId,
        lessonDate,
        items,
        generalNote: generalNote.trim() || undefined,
      });
      toast.success("Lesson saved successfully! 🎉");
      navigate({ to: "/lessons/$lessonId", params: { lessonId: lesson.id } });
    } catch (error) {
      console.error("Failed to create lesson", error);
      toast.error("Unable to save this lesson. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <PageHeader
        title="Log New Lesson"
        description="Select student, date, and write notes for each subject taught."
      />

      <div className="card-surface grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="lessonDate">Date</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={lessonDate === todayString() ? "default" : "outline"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setLessonDate(todayString())}
              >
                Today
              </Button>
              <Button
                type="button"
                variant={lessonDate === yesterdayString() ? "default" : "outline"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setLessonDate(yesterdayString())}
              >
                Yesterday
              </Button>
            </div>
          </div>
          <Input
            id="lessonDate"
            type="date"
            value={lessonDate}
            onChange={(event) => setLessonDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="student">Student *</Label>
          <Select value={studentId} onValueChange={handleStudentChange}>
            <SelectTrigger id="student">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.className})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {studentId && (
        <section className="card-surface p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Subjects & Notes
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add subjects taught during this session and write what was covered.
              </p>
            </div>
          </div>

          {/* Quick Select Buttons from Student's Saved Subjects */}
          {subjects && subjects.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Add Student Subjects:</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((sub) => {
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

          {/* Custom Subject Adder */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Or type another subject name (e.g. Higher Math)"
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

          {/* Added Subjects List with Notes */}
          <div className="space-y-4 pt-2">
            {items.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                No subjects added yet. Click a subject above or type a name to add it to this lesson.
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
                      Lesson Notes / Covered Topics
                    </Label>
                    <Textarea
                      id={`notes-${item.id}`}
                      rows={2}
                      placeholder={`Write what was taught in ${item.subjectName} (e.g., Chapter 4 Ex 4.2 completed)`}
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
      )}

      <div className="card-surface p-4 space-y-2">
        <Label htmlFor="generalNote" className="text-sm font-medium">
          General Note / Remarks (Optional)
        </Label>
        <Textarea
          id="generalNote"
          rows={2}
          placeholder="Any overall notes for today's session..."
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
          className="text-xs"
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto font-bold" disabled={saving || !studentId}>
        {saving ? "Saving Lesson…" : "Save Lesson"}
      </Button>
    </form>
  );
}
