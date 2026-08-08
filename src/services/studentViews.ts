import { getDb } from "@/lib/db";
import { todayString } from "@/lib/ids";
import type { Lesson, Student, Subject } from "@/lib/types";
import { currentTopicStatusMap, summarize, type ProgressSummary } from "./progress";

export interface StudentOverview {
  student: Student;
  subjects: Subject[];
  totals: ProgressSummary & { chapters: number };
  nextLesson: Lesson | undefined;
  carriedForward: number;
}

export async function studentOverviews(): Promise<StudentOverview[]> {
  const db = getDb();
  const [students, subjects, chapters, topics, lessons, carry] = await Promise.all([
    db.students.toArray(),
    db.subjects.toArray(),
    db.chapters.toArray(),
    db.topics.toArray(),
    db.lessons.toArray(),
    db.carryForwardItems.toArray(),
  ]);

  const statuses = await currentTopicStatusMap(topics.map((t) => t.id));
  const today = todayString();

  return students
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => {
      const mySubjects = subjects
        .filter((s) => s.studentId === student.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      const subjectIds = new Set(mySubjects.map((s) => s.id));
      const myChapters = chapters.filter((c) => subjectIds.has(c.subjectId));
      const chapterIds = new Set(myChapters.map((c) => c.id));
      const myTopics = topics.filter((t) => chapterIds.has(t.chapterId));
      const summary = summarize(
        myTopics.map((t) => t.id),
        statuses,
      );

      const nextLesson = lessons
        .filter((l) => l.studentId === student.id && l.lessonDate >= today)
        .sort((a, b) => a.lessonDate.localeCompare(b.lessonDate))[0];

      return {
        student,
        subjects: mySubjects,
        totals: { ...summary, chapters: myChapters.length },
        nextLesson,
        carriedForward: carry.filter(
          (c) => c.studentId === student.id && (c.status === "open" || c.status === "scheduled"),
        ).length,
      };
    });
}

export async function studentOverview(studentId: string): Promise<StudentOverview | undefined> {
  const all = await studentOverviews();
  return all.find((o) => o.student.id === studentId);
}

export interface SubjectProgressRow {
  subject: Subject;
  summary: ProgressSummary;
  chapters: number;
}

export async function subjectProgressRows(studentId: string): Promise<SubjectProgressRow[]> {
  const db = getDb();
  const subjects = (await db.subjects.where("studentId").equals(studentId).toArray()).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const chapters = subjects.length
    ? await db.chapters.where("subjectId").anyOf(subjects.map((s) => s.id)).toArray()
    : [];
  const topics = chapters.length
    ? await db.topics.where("chapterId").anyOf(chapters.map((c) => c.id)).toArray()
    : [];
  const statuses = await currentTopicStatusMap(topics.map((t) => t.id));

  return subjects.map((subject) => {
    const chapterIds = new Set(chapters.filter((c) => c.subjectId === subject.id).map((c) => c.id));
    const topicIds = topics.filter((t) => chapterIds.has(t.chapterId)).map((t) => t.id);
    return { subject, summary: summarize(topicIds, statuses), chapters: chapterIds.size };
  });
}

export interface ChapterProgressRow {
  chapter: { id: string; chapterNumber: string; title: string; description?: string | undefined };
  summary: ProgressSummary;
}

export async function chapterProgressRows(subjectId: string): Promise<ChapterProgressRow[]> {
  const db = getDb();
  const chapters = (await db.chapters.where("subjectId").equals(subjectId).toArray()).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const topics = chapters.length
    ? await db.topics.where("chapterId").anyOf(chapters.map((c) => c.id)).toArray()
    : [];
  const statuses = await currentTopicStatusMap(topics.map((t) => t.id));

  return chapters.map((chapter) => ({
    chapter,
    summary: summarize(
      topics.filter((t) => t.chapterId === chapter.id).map((t) => t.id),
      statuses,
    ),
  }));
}
