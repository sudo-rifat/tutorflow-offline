import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressBar } from "@/components/ProgressBar";
import { TopicStatusButtons } from "@/components/TopicStatus";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate, tomorrowString } from "@/lib/ids";
import {
  carryForwardUnfinished,
  deleteLesson,
  removeLessonTopic,
  setLessonTopicNote,
  setLessonTopicStatus,
  updateLesson,
} from "@/services/lessons";
import { getLessonSummary } from "@/services/views";

export const Route = createFileRoute("/lessons/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — TutorFlow" },
      { name: "description", content: "Mark topics completed, partial or pending while you teach." },
      { property: "og:title", content: "Lesson — TutorFlow" },
      { property: "og:description", content: "Mark topics completed, partial or pending while you teach." },
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

  const { lesson, student, subject, chapter, topics, counts } = summary;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/lessons">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All lessons
        </Link>
      </Button>

      <PageHeader
        title={student?.name ?? "Lesson"}
        description={`${formatDisplayDate(lesson.lessonDate)} · ${subject?.name ?? ""}${
          chapter ? ` · Chapter ${chapter.chapterNumber} — ${chapter.title}` : ""
        }`}
        action={
          <ConfirmDialog
            title="Delete this lesson?"
            description="The lesson and its topic records will be removed from this device."
            onConfirm={async () => {
              await deleteLesson(lesson.id);
              toast.success("Lesson deleted");
              navigate({ to: "/lessons" });
            }}
            trigger={
              <Button variant="outline" className="text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            }
          />
        }
      />

      <div className="card-surface space-y-3 p-4">
        <ProgressBar
          percent={summary.percent}
          label={`${counts.completed} completed · ${counts.partial} partial · ${counts.pending} pending`}
        />
        <div className="space-y-1.5">
          <label htmlFor="goal" className="text-xs text-muted-foreground">
            Lesson goal
          </label>
          <Input
            id="goal"
            defaultValue={lesson.lessonGoal ?? ""}
            onBlur={(event) => updateLesson(lesson.id, { lessonGoal: event.target.value })}
            placeholder="What is the aim of this lesson?"
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Topics</h2>
        {topics.length === 0 ? (
          <EmptyState title="No topics in this lesson." description="Add topics from the chapter page." />
        ) : (
          <ul className="space-y-3">
            {topics.map(({ lessonTopic, topic }) => (
              <li key={lessonTopic.id} className="card-surface space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{topic?.title ?? "Removed topic"}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${topic?.title ?? "topic"} from this lesson`}
                    onClick={() => removeLessonTopic(lessonTopic.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <TopicStatusButtons
                  value={lessonTopic.status}
                  topicTitle={topic?.title ?? "topic"}
                  onChange={(status) => setLessonTopicStatus(lessonTopic.id, status)}
                />
                <Input
                  defaultValue={lessonTopic.note ?? ""}
                  placeholder="Short note (optional)"
                  aria-label={`Note for ${topic?.title ?? "topic"}`}
                  onBlur={(event) => setLessonTopicNote(lessonTopic.id, event.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="card-surface space-y-2 p-4">
        <label htmlFor="generalNote" className="text-xs text-muted-foreground">
          General lesson note
        </label>
        <Textarea
          id="generalNote"
          rows={3}
          defaultValue={lesson.generalNote ?? ""}
          onBlur={(event) => updateLesson(lesson.id, { generalNote: event.target.value })}
        />
      </div>

      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={async () => {
          const created = await carryForwardUnfinished(lesson.id, tomorrowString());
          if (created === 0) {
            toast.info("Nothing left to carry forward.");
          } else {
            toast.success(`${created} topic${created > 1 ? "s" : ""} carried forward to tomorrow`);
          }
        }}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Carry forward unfinished topics
      </Button>
    </div>
  );
}
