import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/TopicStatus";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTopic,
  deleteTopicCascade,
  getChapter,
  getSubject,
  listTopics,
  moveTopic,
  updateTopic,
} from "@/services/curriculum";
import { currentTopicStatusMap, summarize } from "@/services/progress";

export const Route = createFileRoute("/chapters/$chapterId")({
  head: () => ({
    meta: [
      { title: "Chapter Topics — TutorFlow" },
      { name: "description", content: "Manage the topics of a chapter and see their teaching status." },
      { property: "og:title", content: "Chapter Topics — TutorFlow" },
      { property: "og:description", content: "Manage the topics of a chapter and see their teaching status." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <ChapterPage />
    </ClientOnly>
  ),
});

function ChapterPage() {
  const { chapterId } = Route.useParams();
  const chapter = useLiveQuery(() => getChapter(chapterId), [chapterId]);
  const subject = useLiveQuery(
    async () => (chapter ? getSubject(chapter.subjectId) : undefined),
    [chapter?.subjectId],
  );
  const data = useLiveQuery(async () => {
    const topics = await listTopics(chapterId);
    const statuses = await currentTopicStatusMap(topics.map((t) => t.id));
    return { topics, statuses, summary: summarize(topics.map((t) => t.id), statuses) };
  }, [chapterId]);
  const [title, setTitle] = useState("");

  if (chapter === undefined) return <LoadingState />;
  if (!chapter) {
    return (
      <EmptyState
        title="Chapter not found."
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
        <Link to="/subjects/$subjectId" params={{ subjectId: chapter.subjectId }}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {subject?.name ?? "Subject"}
        </Link>
      </Button>

      <PageHeader
        title={`Chapter ${chapter.chapterNumber} — ${chapter.title}`}
        description={chapter.description}
      />

      {data ? (
        <div className="card-surface p-4">
          <ProgressBar percent={data.summary.percent} label={`${data.topics.length} topics`} />
          <p className="mt-3 text-sm text-muted-foreground">
            {data.summary.completed} completed · {data.summary.partial} partial · {data.summary.pending} pending ·{" "}
            {data.summary.notStarted} not started
          </p>
        </div>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) return;
          try {
            await createTopic(chapterId, { title });
            setTitle("");
            toast.success("Topic added");
          } catch (error) {
            console.error("Failed to add topic", error);
            toast.error("Unable to add this topic. Please try again.");
          }
        }}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a topic, e.g. Velocity"
          aria-label="Topic title"
        />
        <Button type="submit">
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </form>

      {data === undefined ? (
        <LoadingState />
      ) : data.topics.length === 0 ? (
        <EmptyState title="No topics yet." description="Add the topics you will teach in this chapter." />
      ) : (
        <ul className="card-surface divide-y divide-border">
          {data.topics.map((topic) => (
            <li key={topic.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{topic.title}</p>
                <StatusChip status={data.statuses.get(topic.id)} className="mt-1" />
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => moveTopic(topic.id, -1)}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => moveTopic(topic.id, 1)}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Rename ${topic.title}`}
                  onClick={async () => {
                    const next = window.prompt("Topic title", topic.title);
                    if (next?.trim()) await updateTopic(topic.id, { title: next.trim() });
                  }}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <ConfirmDialog
                  title={`Delete ${topic.title}?`}
                  description="This topic and its records inside lessons will be removed."
                  onConfirm={async () => {
                    await deleteTopicCascade(topic.id);
                    toast.success("Topic deleted");
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${topic.title}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
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
