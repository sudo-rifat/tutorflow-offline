import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LessonCard } from "@/components/LessonCard";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChapter, deleteChapterCascade, getSubject, moveChapter, updateChapter } from "@/services/curriculum";
import { getStudent } from "@/services/students";
import { chapterProgressRows } from "@/services/studentViews";
import { lessonHistory } from "@/services/views";

export const Route = createFileRoute("/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject — TutorFlow" },
      { name: "description", content: "Chapters, topic progress and recent lessons for one subject." },
      { property: "og:title", content: "Subject — TutorFlow" },
      { property: "og:description", content: "Chapters, topic progress and recent lessons for one subject." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <SubjectPage />
    </ClientOnly>
  ),
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const subject = useLiveQuery(() => getSubject(subjectId), [subjectId]);
  const student = useLiveQuery(
    async () => (subject ? getStudent(subject.studentId) : undefined),
    [subject?.studentId],
  );
  const chapters = useLiveQuery(() => chapterProgressRows(subjectId), [subjectId]);
  const lessons = useLiveQuery(() => lessonHistory({ subjectId }), [subjectId]);
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");

  if (subject === undefined) return <LoadingState />;
  if (!subject) {
    return (
      <EmptyState
        title="Subject not found."
        action={
          <Button asChild>
            <Link to="/students">Back to students</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/students/$studentId" params={{ studentId: subject.studentId }}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {student?.name ?? "Student"}
        </Link>
      </Button>

      <PageHeader title={subject.name} description={student ? `${student.name} · ${student.className}` : undefined} />

      <form
        className="card-surface flex flex-col gap-2 p-4 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) return;
          try {
            await createChapter(subjectId, { chapterNumber: number.trim() || "—", title });
            setNumber("");
            setTitle("");
            toast.success("Chapter added");
          } catch (error) {
            console.error("Failed to add chapter", error);
            toast.error("Unable to add this chapter. Please try again.");
          }
        }}
      >
        <Input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="No."
          aria-label="Chapter number"
          className="sm:w-24"
        />
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Chapter title, e.g. Motion"
          aria-label="Chapter title"
        />
        <Button type="submit">
          <Plus className="size-4" aria-hidden="true" />
          Add chapter
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Chapters</h2>
        {chapters === undefined ? (
          <LoadingState />
        ) : chapters.length === 0 ? (
          <EmptyState title="No chapters yet." description="Add the first chapter of this subject." />
        ) : (
          <ul className="space-y-3">
            {chapters.map(({ chapter, summary }) => (
              <li key={chapter.id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/chapters/$chapterId"
                    params={{ chapterId: chapter.id }}
                    className="font-semibold hover:underline"
                  >
                    Chapter {chapter.chapterNumber} — {chapter.title}
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move chapter up"
                      onClick={() => moveChapter(chapter.id, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move chapter down"
                      onClick={() => moveChapter(chapter.id, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Rename chapter"
                      onClick={async () => {
                        const next = window.prompt("Chapter title", chapter.title);
                        if (next?.trim()) await updateChapter(chapter.id, { title: next.trim() });
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <ConfirmDialog
                      title={`Delete chapter ${chapter.chapterNumber}?`}
                      description="Its topics and their lesson records will also be deleted."
                      onConfirm={async () => {
                        await deleteChapterCascade(chapter.id);
                        toast.success("Chapter deleted");
                      }}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete chapter"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                {chapter.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{chapter.description}</p>
                ) : null}
                <div className="mt-3">
                  <ProgressBar
                    percent={summary.percent}
                    label={`${summary.completed}/${summary.total} topics completed`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lessons && lessons.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent lessons</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {lessons.slice(0, 4).map((summary) => (
              <LessonCard key={summary.lesson.id} summary={summary} showDate />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
