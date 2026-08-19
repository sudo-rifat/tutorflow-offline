import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addTemplateTopics,
  createClassTemplate,
  createTemplateChapter,
  createTemplateSubject,
  deleteClassTemplateCascade,
  deleteTemplateChapterCascade,
  deleteTemplateSubjectCascade,
  deleteTemplateTopic,
  listClassTemplates,
  listTemplateChapters,
  listTemplateSubjects,
  listTemplateTopics,
  renameClassTemplate,
  renameTemplateSubject,
  updateTemplateChapter,
  updateTemplateTopic,
} from "@/services/templates";

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum Templates — TutorFlow" },
      {
        name: "description",
        content:
          "Build a reusable subject, chapter and topic list for every class, then apply it to any student in one tap.",
      },
      { property: "og:title", content: "Curriculum Templates — TutorFlow" },
      {
        property: "og:description",
        content: "Reusable class-wise subject, chapter and topic lists for fast lesson planning.",
      },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <CurriculumPage />
    </ClientOnly>
  ),
});

function CurriculumPage() {
  const classes = useLiveQuery(() => listClassTemplates(), []);
  const [selectedId, setSelectedId] = useState("");
  const [newClass, setNewClass] = useState("");

  const activeId = selectedId || classes?.[0]?.id || "";
  const activeClass = classes?.find((c) => c.id === activeId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Curriculum templates"
        description="Set up subjects, chapters and topics once per class. Then apply them to any student."
      />

      <form
        className="card-surface flex flex-col gap-2 p-4 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newClass.trim()) return;
          const created = await createClassTemplate(newClass);
          setNewClass("");
          setSelectedId(created.id);
          toast.success("Class added");
        }}
      >
        <Input
          value={newClass}
          onChange={(event) => setNewClass(event.target.value)}
          placeholder="Add a class, e.g. Class 9"
          aria-label="Class name"
        />
        <Button type="submit">
          <Plus className="size-4" aria-hidden="true" />
          Add class
        </Button>
      </form>

      {classes === undefined ? (
        <LoadingState />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-5" />}
          title="No class templates yet."
          description="Add a class above, e.g. Class 9 or Class 10."
        />
      ) : (
        <div className="space-y-4">
          <div className="card-surface flex flex-wrap items-center gap-2 p-4">
            <Select value={activeId} onValueChange={setSelectedId}>
              <SelectTrigger className="min-w-48" aria-label="Choose a class">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeClass ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Rename ${activeClass.name}`}
                  onClick={async () => {
                    const name = window.prompt("Class name", activeClass.name);
                    if (name?.trim()) await renameClassTemplate(activeClass.id, name);
                  }}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <ConfirmDialog
                  title={`Delete ${activeClass.name}?`}
                  description="Its template subjects, chapters and topics will be removed. Students already using them keep their own copies."
                  onConfirm={async () => {
                    await deleteClassTemplateCascade(activeClass.id);
                    setSelectedId("");
                    toast.success("Class template deleted");
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={`Delete ${activeClass.name}`}>
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  }
                />
              </>
            ) : null}
          </div>

          {activeId ? <SubjectList classTemplateId={activeId} /> : null}
        </div>
      )}
    </div>
  );
}

function SubjectList({ classTemplateId }: { classTemplateId: string }) {
  const subjects = useLiveQuery(() => listTemplateSubjects(classTemplateId), [classTemplateId]);
  const [name, setName] = useState("");

  return (
    <section className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim()) return;
          await createTemplateSubject(classTemplateId, name);
          setName("");
          toast.success("Subject added to this class");
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a subject, e.g. Physics"
          aria-label="Template subject name"
        />
        <Button type="submit" variant="secondary">
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </form>

      {subjects === undefined ? (
        <LoadingState />
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects in this class template yet.</p>
      ) : (
        <ul className="space-y-3">
          {subjects.map((subject) => (
            <li key={subject.id} className="card-surface p-4">
              <SubjectRow
                id={subject.id}
                name={subject.name}
                onRename={async () => {
                  const next = window.prompt("Subject name", subject.name);
                  if (next?.trim()) await renameTemplateSubject(subject.id, next);
                }}
                onDelete={async () => {
                  await deleteTemplateSubjectCascade(subject.id);
                  toast.success("Subject removed from template");
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SubjectRow({
  id,
  name,
  onRename,
  onDelete,
}: {
  id: string;
  name: string;
  onRename: () => void | Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const chapters = useLiveQuery(async () => (open ? listTemplateChapters(id) : []), [id, open]);
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center gap-2 text-left text-base font-semibold"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          )}
          {name}
        </button>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" aria-label={`Rename ${name}`} onClick={onRename}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <ConfirmDialog
            title={`Delete ${name} from this class template?`}
            description="Its template chapters and topics will also be removed."
            onConfirm={onDelete}
            trigger={
              <Button variant="ghost" size="icon" aria-label={`Delete ${name}`}>
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border pt-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!chapterTitle.trim()) return;
              await createTemplateChapter(id, { chapterNumber, title: chapterTitle });
              setChapterNumber("");
              setChapterTitle("");
              toast.success("Chapter added");
            }}
          >
            <Input
              className="sm:w-24"
              value={chapterNumber}
              onChange={(event) => setChapterNumber(event.target.value)}
              placeholder="No."
              aria-label="Chapter number"
            />
            <Input
              value={chapterTitle}
              onChange={(event) => setChapterTitle(event.target.value)}
              placeholder="Chapter title"
              aria-label="Chapter title"
            />
            <Button type="submit" variant="secondary">
              <Plus className="size-4" aria-hidden="true" />
              Chapter
            </Button>
          </form>

          {chapters?.length ? (
            <ul className="space-y-2">
              {chapters.map((chapter) => (
                <li key={chapter.id} className="rounded-md border border-border p-3">
                  <ChapterRow
                    id={chapter.id}
                    label={`Chapter ${chapter.chapterNumber} — ${chapter.title}`}
                    onRename={async () => {
                      const title = window.prompt("Chapter title", chapter.title);
                      if (title?.trim()) await updateTemplateChapter(chapter.id, { title });
                    }}
                    onDelete={async () => {
                      await deleteTemplateChapterCascade(chapter.id);
                      toast.success("Chapter deleted");
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No chapters yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChapterRow({
  id,
  label,
  onRename,
  onDelete,
}: {
  id: string;
  label: string;
  onRename: () => void | Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const topics = useLiveQuery(async () => (open ? listTemplateTopics(id) : []), [id, open]);
  const [paste, setPaste] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex min-h-9 flex-1 items-center gap-2 text-left text-sm font-medium"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          )}
          {label}
        </button>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" aria-label={`Rename ${label}`} onClick={onRename}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <ConfirmDialog
            title="Delete this chapter?"
            description="Its template topics will also be removed."
            onConfirm={onDelete}
            trigger={
              <Button variant="ghost" size="icon" aria-label={`Delete ${label}`}>
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </div>

      {open ? (
        <div className="space-y-2 pl-6">
          {topics?.length ? (
            <ul className="space-y-1">
              {topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{topic.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Rename ${topic.title}`}
                    onClick={async () => {
                      const title = window.prompt("Topic", topic.title);
                      if (title?.trim()) await updateTemplateTopic(topic.id, title);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${topic.title}`}
                    onClick={async () => {
                      await deleteTemplateTopic(topic.id);
                    }}
                  >
                    <Trash2 className="size-3.5 text-destructive" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No topics yet.</p>
          )}

          <Textarea
            rows={3}
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            placeholder="Paste topics — one per line"
            aria-label="Paste topics"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const added = await addTemplateTopics(id, paste);
              if (!added) {
                toast.error("Please paste at least one topic.");
                return;
              }
              setPaste("");
              toast.success(`${added} topic${added > 1 ? "s" : ""} added`);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add topics
          </Button>
        </div>
      ) : null}
    </div>
  );
}
