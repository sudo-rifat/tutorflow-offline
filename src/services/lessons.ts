import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import type { ID, Lesson, LessonItem } from "@/lib/types";

export interface LessonInput {
  studentId: ID;
  lessonDate: string;
  items: LessonItem[];
  generalNote?: string | undefined;
}

/* -------------------------------- lessons -------------------------------- */

export async function listLessons(): Promise<Lesson[]> {
  const rows = await getDb().lessons.toArray();
  return rows.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
}

export async function listLessonsByDate(date: string): Promise<Lesson[]> {
  return getDb().lessons.where("lessonDate").equals(date).toArray();
}

export async function listLessonsByStudent(studentId: ID): Promise<Lesson[]> {
  const rows = await getDb().lessons.where("studentId").equals(studentId).toArray();
  return rows.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
}

export async function getLesson(id: ID): Promise<Lesson | undefined> {
  return getDb().lessons.get(id);
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  const db = getDb();
  const ts = nowIso();
  const lesson: Lesson = {
    id: newId(),
    studentId: input.studentId,
    lessonDate: input.lessonDate,
    items: input.items || [],
    generalNote: input.generalNote,
    createdAt: ts,
    updatedAt: ts,
  };

  await db.lessons.add(lesson);
  return lesson;
}

export async function updateLesson(id: ID, patch: Partial<LessonInput>): Promise<void> {
  await getDb().lessons.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteLesson(id: ID): Promise<void> {
  const db = getDb();
  await db.lessons.delete(id);
}
