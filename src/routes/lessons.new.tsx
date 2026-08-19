import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { toast } from "sonner";
import { ApplyTemplateDialog } from "@/components/ApplyTemplateDialog";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayString } from "@/lib/ids";
import { listChapters, listSubjects, listTopics } from "@/services/curriculum";
import { consumeCarryForwardForTopics, createLesson } from "@/services/lessons";
import { listStudents } from "@/services/students";
import { carryForwardViews } from "@/services/views";

export const Route = createFileRoute("/lessons/new")({
  head: () => ({
    meta: [
      { title: "Create Lesson — TutorFlow" },
      { name: "description", content: "Plan a lesson in seconds: student, subject, chapter and topics." },
      { property: "og:title", content: "Create Lesson — TutorFlow" },
      { property: "og:description", content: "Plan a lesson in seconds: student, subject, chapter and topics." },
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
  const [lessonDate, setLessonDate] = useState(todayString());
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [lessonGoal, setLessonGoal] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [saving, setSaving] = useState(false);

  const students = useLiveQuery(() => listStudents(), []);
  const subjects = useLiveQuery(async () => (studentId ? listSubjects(studentId) : []), [studentId]);
  const chapters = useLiveQuery(async () => (subjectId ? listChapters(subjectId) : []), [subjectId]);
  const topics = useLiveQuery(async () => (chapterId ? listTopics(chapterId) : []), [chapterId]);
  const carried = useLiveQuery(
    async () => (studentId ? carryForwardViews(studentId) : []),
    [studentId],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!studentId || !subjectId) {
      toast.error("Please choose a student and a subject.");
      return;
    }
    setSaving(true);
    try {
      const lesson = await createLesson(
        {
          studentId,
          subjectId,
          chapterId: chapterId || undefined,
          lessonDate,
          lessonGoal: lessonGoal.trim() || undefined,
          generalNote: generalNote.trim() || undefined,
        },
        selected,
      );
      await consumeCarryForwardForTopics(studentId, selected);
      toast.success("Lesson created");
      navigate({ to: "/lessons/$lessonId", params: { lessonId: lesson.id } });
    } catch (error) {
      console.error("Failed to create lesson", error);
      toast.error("Unable to create this lesson. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const activeStudent = students?.find((student) => student.id === studentId);
  const needsSubjects = Boolean(studentId) && subjects !== undefined && subjects.length === 0;

  const carriedForThisSubject = carried?.filter((view) => !selected.includes(view.item.topicId)) ?? [];

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PageHeader title="New lesson" description="Only the student and subject are required." />

      <div className="card-surface grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lessonDate">Date</Label>
          <Input
            id="lessonDate"
            type="date"
            value={lessonDate}
            onChange={(event) => setLessonDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="student">Student *</Label>
          <Select
            value={studentId}
            onValueChange={(value) => {
              setStudentId(value);
              setSubjectId("");
              setChapterId("");
              setSelected([]);
            }}
          >
            <SelectTrigger id="student">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} · {student.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject *</Label>
          <Select
            value={subjectId}
            onValueChange={(value) => {
              setSubjectId(value);
              setChapterId("");
              setSelected([]);
            }}
            disabled={!studentId}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder={studentId ? "Choose a subject" : "Choose a student first"} />
            </SelectTrigger>
            <SelectContent>
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chapter">Chapter</Label>
          <Select
            value={chapterId}
            onValueChange={(value) => {
              setChapterId(value);
              setSelected([]);
            }}
            disabled={!subjectId}
          >
            <SelectTrigger id="chapter">
              <SelectValue placeholder={subjectId ? "Choose a chapter" : "Choose a subject first"} />
            </SelectTrigger>
            <SelectContent>
              {chapters?.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  Chapter {chapter.chapterNumber} — {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsSubjects && activeStudent ? (
        <div className="card-surface flex flex-wrap items-center justify-between gap-2 p-4">
          <p className="text-sm text-muted-foreground">
            {activeStudent.name} has no subjects yet. Copy them from your {activeStudent.className}{" "}
            template.
          </p>
          <ApplyTemplateDialog
            studentId={activeStudent.id}
            studentClassName={activeStudent.className}
            trigger={
              <Button type="button" size="sm" variant="secondary">
                Add from class template
              </Button>
            }
          />
        </div>
      ) : null}

      {chapterId ? (
        <section className="card-surface p-4">
          <h2 className="mb-2 font-semibold">Topics for this lesson</h2>
          {topics && topics.length ? (
            <ul className="space-y-1">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <label className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm">
                    <Checkbox
                      checked={selected.includes(topic.id)}
                      onCheckedChange={() => toggle(topic.id)}
                      aria-label={topic.title}
                    />
                    {topic.title}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">This chapter has no topics yet.</p>
          )}
        </section>
      ) : null}

      {carriedForThisSubject.length ? (
        <section className="card-surface p-4">
          <h2 className="mb-2 font-semibold">Carried forward from earlier lessons</h2>
          <ul className="space-y-1">
            {carriedForThisSubject.map((view) => (
              <li key={view.item.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm">
                  <Checkbox
                    checked={selected.includes(view.item.topicId)}
                    onCheckedChange={() => toggle(view.item.topicId)}
                    aria-label={view.topic?.title ?? "Topic"}
                  />
                  <span>
                    {view.topic?.title ?? "Removed topic"}
                    {view.chapter ? (
                      <span className="text-muted-foreground"> · Chapter {view.chapter.chapterNumber}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="card-surface space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="lessonGoal">Lesson goal</Label>
          <Input id="lessonGoal" value={lessonGoal} onChange={(e) => setLessonGoal(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="generalNote">General note</Label>
          <Textarea id="generalNote" rows={3} value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving}>
        {saving ? "Saving…" : "Create lesson"}
      </Button>
    </form>
  );
}
