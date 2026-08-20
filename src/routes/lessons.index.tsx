import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { NotebookPen, Plus, X } from "lucide-react";
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
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");

  const students = useLiveQuery(() => listStudents(), []);
  const lessons = useLiveQuery(
    () =>
      lessonHistory({
        ...(studentId !== "all" ? { studentId } : {}),
        ...(date ? { date } : {}),
        query,
      }),
    [studentId, date, query],
  );

  const hasFilters = studentId !== "all" || date !== "" || query !== "";

  const resetFilters = () => {
    setStudentId("all");
    setDate("");
    setQuery("");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lessons History"
        description="Filter and review all your logged lessons."
        action={
          <Button asChild>
            <Link to="/lessons/new">
              <Plus className="size-4" aria-hidden="true" />
              Log New Lesson
            </Link>
          </Button>
        }
      />

      <div className="card-surface p-3.5 space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger aria-label="Filter by student">
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.className})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects or notes"
            aria-label="Search lessons"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <span>
              Showing <strong>{lessons?.length ?? 0}</strong> matching lessons
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs px-2">
              <X className="size-3 mr-1" /> Clear Filters
            </Button>
          </div>
        )}
      </div>

      {lessons === undefined ? (
        <LoadingState />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-5" />}
          title={hasFilters ? "No lessons match your search filters." : "No lessons logged yet."}
          description={hasFilters ? "Try clearing the filters." : "Log your first lesson to build your teaching history."}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/lessons/new">
                  <Plus className="size-4 mr-1" /> Log Lesson Now
                </Link>
              </Button>
            )
          }
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
