import { getDb } from "@/lib/db";
import { todayString } from "@/lib/ids";
import type {
  ID,
  Lesson,
  Student,
  Subject,
} from "@/lib/types";

export interface LessonSummary {
  lesson: Lesson;
  student: Student | undefined;
}

async function buildSummaries(lessons: Lesson[]): Promise<LessonSummary[]> {
  const db = getDb();
  if (!lessons.length) return [];

  const studentIds = [...new Set(lessons.map((l) => l.studentId))];
  const students = await db.students.bulkGet(studentIds);
  const studentMap = new Map(students.filter(Boolean).map((s) => [s!.id, s!] as const));

  return lessons.map((lesson) => ({
    lesson,
    student: studentMap.get(lesson.studentId),
  }));
}

export async function getLessonSummary(lessonId: ID): Promise<LessonSummary | undefined> {
  const lesson = await getDb().lessons.get(lessonId);
  if (!lesson) return undefined;
  const [summary] = await buildSummaries([lesson]);
  return summary;
}

export async function todaysLessons(): Promise<LessonSummary[]> {
  const db = getDb();
  const lessons = await db.lessons.where("lessonDate").equals(todayString()).toArray();
  const summaries = await buildSummaries(lessons);
  return summaries.sort((a, b) =>
    (a.student?.preferredTime ?? "99:99").localeCompare(b.student?.preferredTime ?? "99:99"),
  );
}

export interface LessonFilters {
  studentId?: string;
  subjectId?: string;
  date?: string;
  query?: string;
}

export async function lessonHistory(filters: LessonFilters = {}): Promise<LessonSummary[]> {
  const db = getDb();
  let lessons = await db.lessons.toArray();
  if (filters.studentId) lessons = lessons.filter((l) => l.studentId === filters.studentId);
  if (filters.date) lessons = lessons.filter((l) => l.lessonDate === filters.date);
  if (filters.subjectId) {
    lessons = lessons.filter((l) => l.items.some((item) => item.subjectId === filters.subjectId));
  }
  lessons.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate) || b.createdAt.localeCompare(a.createdAt));

  let summaries = await buildSummaries(lessons);

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    summaries = summaries.filter((s) =>
      [
        s.student?.name,
        s.lesson.generalNote,
        ...s.lesson.items.map((i) => `${i.subjectName} ${i.notes}`),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }
  return summaries;
}

export interface DashboardStats {
  activeStudents: number;
  todaysLessons: number;
  totalLessons: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const [activeStudents, lessonsToday, totalLessons] = await Promise.all([
    db.students.where("status").equals("active").count(),
    db.lessons.where("lessonDate").equals(todayString()).count(),
    db.lessons.count(),
  ]);

  return {
    activeStudents,
    todaysLessons: lessonsToday,
    totalLessons,
  };
}

export interface SearchHit {
  kind: "student" | "subject" | "lesson";
  title: string;
  subtitle: string;
  to: string;
  params: Record<string, string>;
  badge?: string;
}

/** Fully local search — works with no internet at all. */
export async function searchEverything(rawQuery: string): Promise<SearchHit[]> {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return [];
  const db = getDb();

  const [students, subjects, lessons] = await Promise.all([
    db.students.toArray(),
    db.subjects.toArray(),
    db.lessons.toArray(),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s] as const));
  const hits: SearchHit[] = [];

  for (const student of students) {
    if (`${student.name} ${student.className}`.toLowerCase().includes(q)) {
      hits.push({
        kind: "student",
        title: student.name,
        subtitle: student.className,
        to: "/students/$studentId",
        params: { studentId: student.id },
        badge: student.status === "active" ? "Active" : "Inactive",
      });
    }
  }

  for (const subject of subjects) {
    if (subject.name.toLowerCase().includes(q)) {
      hits.push({
        kind: "subject",
        title: subject.name,
        subtitle: studentMap.get(subject.studentId)?.name ?? "Unknown student",
        to: "/students/$studentId",
        params: { studentId: subject.studentId },
      });
    }
  }

  for (const lesson of lessons) {
    const haystack = [
      lesson.generalNote,
      ...lesson.items.map((i) => `${i.subjectName} ${i.notes}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      hits.push({
        kind: "lesson",
        title: `${studentMap.get(lesson.studentId)?.name ?? "Student"} · ${lesson.items.map((i) => i.subjectName).join(", ")}`,
        subtitle: lesson.lessonDate,
        to: "/lessons/$lessonId",
        params: { lessonId: lesson.id },
      });
    }
  }

  return hits.slice(0, 60);
}
