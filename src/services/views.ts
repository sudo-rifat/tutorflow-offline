import { getDb } from "@/lib/db";
import { todayString } from "@/lib/ids";
import type {
  CarryForwardItem,
  Chapter,
  ID,
  Lesson,
  LessonTopic,
  Student,
  Subject,
  Topic,
  TopicStatus,
} from "@/lib/types";
import { currentTopicStatusMap } from "./progress";

export interface LessonSummary {
  lesson: Lesson;
  student: Student | undefined;
  subject: Subject | undefined;
  chapter: Chapter | undefined;
  topics: { lessonTopic: LessonTopic; topic: Topic | undefined }[];
  counts: Record<TopicStatus, number>;
  percent: number;
}

async function buildSummaries(lessons: Lesson[]): Promise<LessonSummary[]> {
  const db = getDb();
  if (!lessons.length) return [];

  const lessonIds = lessons.map((l) => l.id);
  const lessonTopics = await db.lessonTopics.where("lessonId").anyOf(lessonIds).toArray();
  const topicIds = [...new Set(lessonTopics.map((lt) => lt.topicId))];
  const [students, subjects, chapters, topics] = await Promise.all([
    db.students.bulkGet([...new Set(lessons.map((l) => l.studentId))]),
    db.subjects.bulkGet([...new Set(lessons.map((l) => l.subjectId))]),
    db.chapters.bulkGet([...new Set(lessons.map((l) => l.chapterId).filter(Boolean) as ID[])]),
    topicIds.length ? db.topics.bulkGet(topicIds) : Promise.resolve([]),
  ]);

  const studentMap = new Map(students.filter(Boolean).map((s) => [s!.id, s!] as const));
  const subjectMap = new Map(subjects.filter(Boolean).map((s) => [s!.id, s!] as const));
  const chapterMap = new Map(chapters.filter(Boolean).map((c) => [c!.id, c!] as const));
  const topicMap = new Map(topics.filter(Boolean).map((t) => [t!.id, t!] as const));

  return lessons.map((lesson) => {
    const rows = lessonTopics
      .filter((lt) => lt.lessonId === lesson.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((lessonTopic) => ({ lessonTopic, topic: topicMap.get(lessonTopic.topicId) }));

    const counts: Record<TopicStatus, number> = { completed: 0, partial: 0, pending: 0 };
    for (const row of rows) counts[row.lessonTopic.status] += 1;
    const total = rows.length;
    const percent = total ? Math.round(((counts.completed + counts.partial * 0.5) / total) * 100) : 0;

    return {
      lesson,
      student: studentMap.get(lesson.studentId),
      subject: subjectMap.get(lesson.subjectId),
      chapter: lesson.chapterId ? chapterMap.get(lesson.chapterId) : undefined,
      topics: rows,
      counts,
      percent,
    };
  });
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
  status?: "all" | "complete" | "incomplete";
  query?: string;
}

export async function lessonHistory(filters: LessonFilters = {}): Promise<LessonSummary[]> {
  const db = getDb();
  let lessons = await db.lessons.toArray();
  if (filters.studentId) lessons = lessons.filter((l) => l.studentId === filters.studentId);
  if (filters.subjectId) lessons = lessons.filter((l) => l.subjectId === filters.subjectId);
  if (filters.date) lessons = lessons.filter((l) => l.lessonDate === filters.date);
  lessons.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate) || b.createdAt.localeCompare(a.createdAt));

  let summaries = await buildSummaries(lessons);
  if (filters.status === "complete") {
    summaries = summaries.filter((s) => s.topics.length > 0 && s.counts.completed === s.topics.length);
  } else if (filters.status === "incomplete") {
    summaries = summaries.filter((s) => s.counts.partial + s.counts.pending > 0);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    summaries = summaries.filter((s) =>
      [
        s.student?.name,
        s.subject?.name,
        s.chapter?.title,
        s.chapter?.chapterNumber,
        s.lesson.lessonGoal,
        s.lesson.generalNote,
        ...s.topics.map((t) => t.topic?.title),
        ...s.topics.map((t) => t.lessonTopic.note),
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
  pendingTopics: number;
  carriedForward: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const [activeStudents, lessonsToday, lessonTopics, carry] = await Promise.all([
    db.students.where("status").equals("active").count(),
    db.lessons.where("lessonDate").equals(todayString()).count(),
    db.lessonTopics.toArray(),
    db.carryForwardItems.toArray(),
  ]);

  const topicIds = [...new Set(lessonTopics.map((lt) => lt.topicId))];
  const statuses = await currentTopicStatusMap(topicIds);
  let pendingTopics = 0;
  for (const status of statuses.values()) if (status !== "completed") pendingTopics += 1;

  return {
    activeStudents,
    todaysLessons: lessonsToday,
    pendingTopics,
    carriedForward: carry.filter((c) => c.status === "open" || c.status === "scheduled").length,
  };
}

export interface CarryForwardView {
  item: CarryForwardItem;
  topic: Topic | undefined;
  student: Student | undefined;
  chapter: Chapter | undefined;
}

export async function carryForwardViews(studentId?: ID): Promise<CarryForwardView[]> {
  const db = getDb();
  const all = await db.carryForwardItems.toArray();
  const open = all.filter(
    (c) => (c.status === "open" || c.status === "scheduled") && (!studentId || c.studentId === studentId),
  );
  if (!open.length) return [];

  const topics = await db.topics.bulkGet([...new Set(open.map((c) => c.topicId))]);
  const topicMap = new Map(topics.filter(Boolean).map((t) => [t!.id, t!] as const));
  const chapters = await db.chapters.bulkGet([
    ...new Set(topics.filter(Boolean).map((t) => t!.chapterId)),
  ]);
  const chapterMap = new Map(chapters.filter(Boolean).map((c) => [c!.id, c!] as const));
  const students = await db.students.bulkGet([...new Set(open.map((c) => c.studentId))]);
  const studentMap = new Map(students.filter(Boolean).map((s) => [s!.id, s!] as const));

  return open
    .sort((a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"))
    .map((item) => {
      const topic = topicMap.get(item.topicId);
      return {
        item,
        topic,
        student: studentMap.get(item.studentId),
        chapter: topic ? chapterMap.get(topic.chapterId) : undefined,
      };
    });
}

export interface SearchHit {
  kind: "student" | "subject" | "chapter" | "topic" | "lesson";
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

  const [students, subjects, chapters, topics, lessons, lessonTopics] = await Promise.all([
    db.students.toArray(),
    db.subjects.toArray(),
    db.chapters.toArray(),
    db.topics.toArray(),
    db.lessons.toArray(),
    db.lessonTopics.toArray(),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s] as const));
  const subjectMap = new Map(subjects.map((s) => [s.id, s] as const));
  const chapterMap = new Map(chapters.map((c) => [c.id, c] as const));
  const topicMap = new Map(topics.map((t) => [t.id, t] as const));
  const statuses = await currentTopicStatusMap(topics.map((t) => t.id));

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
        to: "/subjects/$subjectId",
        params: { subjectId: subject.id },
      });
    }
  }

  for (const chapter of chapters) {
    if (`${chapter.chapterNumber} ${chapter.title}`.toLowerCase().includes(q)) {
      const subject = subjectMap.get(chapter.subjectId);
      hits.push({
        kind: "chapter",
        title: `Chapter ${chapter.chapterNumber} — ${chapter.title}`,
        subtitle: `${subject?.name ?? "Subject"} · ${studentMap.get(subject?.studentId ?? "")?.name ?? ""}`,
        to: "/chapters/$chapterId",
        params: { chapterId: chapter.id },
      });
    }
  }

  for (const topic of topics) {
    if (topic.title.toLowerCase().includes(q)) {
      const chapter = chapterMap.get(topic.chapterId);
      const subject = chapter ? subjectMap.get(chapter.subjectId) : undefined;
      hits.push({
        kind: "topic",
        title: topic.title,
        subtitle: `${studentMap.get(subject?.studentId ?? "")?.name ?? ""} · ${subject?.name ?? ""} · Chapter ${chapter?.chapterNumber ?? "?"}`,
        to: "/chapters/$chapterId",
        params: { chapterId: topic.chapterId },
        badge: statuses.get(topic.id) ?? "Not started",
      });
    }
  }

  for (const lesson of lessons) {
    const notes = lessonTopics.filter((lt) => lt.lessonId === lesson.id);
    const haystack = [
      lesson.lessonGoal,
      lesson.generalNote,
      ...notes.map((n) => n.note),
      ...notes.map((n) => topicMap.get(n.topicId)?.title),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      hits.push({
        kind: "lesson",
        title: `${studentMap.get(lesson.studentId)?.name ?? "Lesson"} · ${subjectMap.get(lesson.subjectId)?.name ?? ""}`,
        subtitle: lesson.lessonDate,
        to: "/lessons/$lessonId",
        params: { lessonId: lesson.id },
      });
    }
  }

  return hits.slice(0, 60);
}
