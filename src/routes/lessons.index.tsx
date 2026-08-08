import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { NotebookPen, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { LessonCard } from "@/components/LessonCard";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listStudents } from "@/services/students";
import { lessonHistory } from "@/services/views";

export const Route = createFileRoute("/lessons/")({
  head: () => ({
    meta: [
      { title: "Lesson History — TutorFlow" },
      { name: "description", content: "Filter and review every lesson you have taught, offline." },
      { property: "og:title", content: "Lesson History — TutorFlow" },
      { property: "og:description", content: "Filter and review every lesson you have taught, offline." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <LessonsPage />
    </ClientOnly>
  ),
});

function LessonsPage() {
  const [studentId, setStudentId] = useState("all");
  const [status, setStatus] = useState<"all" | "complete" | "incomplete">("all");
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");

  const students = useLiveQuery(() => listStudents(), []);
  const lessons = useLiveQuery(
    () =>
      lessonHistory({
        ...(studentId !== "all" ? { studentId } : {}),
        ...(date ? { date } : {}),
        status,
        query,
      }),
    [studentId, status, date, query],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lessons"
        description="Your full teaching history, stored on this device."
        action={
          <Button asChild>
            <Link to="/lessons/new">
              <Plus className="size-4" aria-hidden="true" />
              New lesson
            </Link>
          </Button>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger aria-label="Filter by student">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {students?.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="complete">Fully completed</SelectItem>
            <SelectItem value="incomplete">Has unfinished topics</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics or notes"
          aria-label="Search lessons"
        />
      </div>

      {lessons === undefined ? (
        <LoadingState />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-5" />}
          title="No lessons match these filters."
          description="Clear the filters or create a new lesson."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lessons.map((summary) => (
            <LessonCard key={summary.lesson.id} summary={summary} showDate />
          ))}
        </div>
      )}
    </div>
  );
}
