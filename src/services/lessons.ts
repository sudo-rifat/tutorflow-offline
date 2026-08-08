import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import type { CarryForwardItem, ID, Lesson, LessonTopic, TopicStatus } from "@/lib/types";

export interface LessonInput {
  studentId: ID;
  subjectId: ID;
  chapterId?: ID | undefined;
  lessonDate: string;
  lessonGoal?: string | undefined;
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

export async function createLesson(input: LessonInput, topicIds: ID[] = []): Promise<Lesson> {
  const db = getDb();
  const ts = nowIso();
  const lesson: Lesson = { id: newId(), ...input, createdAt: ts, updatedAt: ts };

  await db.transaction("rw", [db.lessons, db.lessonTopics], async () => {
    await db.lessons.add(lesson);
    const rows: LessonTopic[] = topicIds.map((topicId, i) => ({
      id: newId(),
      lessonId: lesson.id,
      topicId,
      status: "pending",
      orderIndex: i,
      createdAt: ts,
      updatedAt: ts,
    }));
    if (rows.length) await db.lessonTopics.bulkAdd(rows);
  });

  return lesson;
}

export async function updateLesson(id: ID, patch: Partial<LessonInput>): Promise<void> {
  await getDb().lessons.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteLesson(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.lessons, db.lessonTopics, db.carryForwardItems], async () => {
    await db.lessonTopics.where("lessonId").equals(id).delete();
    await db.carryForwardItems.where("originalLessonId").equals(id).delete();
    await db.lessons.delete(id);
  });
}

/* ----------------------------- lesson topics ----------------------------- */

export async function listLessonTopics(lessonId: ID): Promise<LessonTopic[]> {
  const rows = await getDb().lessonTopics.where("lessonId").equals(lessonId).toArray();
  return rows.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function listAllLessonTopics(): Promise<LessonTopic[]> {
  return getDb().lessonTopics.toArray();
}

export async function addTopicsToLesson(lessonId: ID, topicIds: ID[]): Promise<void> {
  const db = getDb();
  const existing = await listLessonTopics(lessonId);
  const known = new Set(existing.map((r) => r.topicId));
  const ts = nowIso();
  const rows: LessonTopic[] = topicIds
    .filter((id) => !known.has(id))
    .map((topicId, i) => ({
      id: newId(),
      lessonId,
      topicId,
      status: "pending",
      orderIndex: existing.length + i,
      createdAt: ts,
      updatedAt: ts,
    }));
  if (rows.length) await db.lessonTopics.bulkAdd(rows);
}

export async function setLessonTopicStatus(id: ID, status: TopicStatus): Promise<void> {
  await getDb().lessonTopics.update(id, { status, updatedAt: nowIso() });
}

export async function setLessonTopicNote(id: ID, note: string): Promise<void> {
  await getDb().lessonTopics.update(id, { note, updatedAt: nowIso() });
}

export async function setLessonTopicRating(id: ID, rating: number | undefined): Promise<void> {
  await getDb().lessonTopics.update(id, { understandingRating: rating, updatedAt: nowIso() });
}

export async function removeLessonTopic(id: ID): Promise<void> {
  await getDb().lessonTopics.delete(id);
}

/* ------------------------------ carry forward ----------------------------- */

export async function listCarryForward(status?: CarryForwardItem["status"]): Promise<CarryForwardItem[]> {
  const rows = await getDb().carryForwardItems.toArray();
  const filtered = status ? rows.filter((r) => r.status === status) : rows;
  return filtered.sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""));
}

export async function listCarryForwardForStudent(studentId: ID): Promise<CarryForwardItem[]> {
  const rows = await getDb().carryForwardItems.where("studentId").equals(studentId).toArray();
  return rows.filter((r) => r.status === "open" || r.status === "scheduled");
}

/**
 * Creates carry-forward references for every unfinished topic of a lesson.
 * The original lesson rows are never modified, so history stays intact.
 */
export async function carryForwardUnfinished(lessonId: ID, targetDate?: string): Promise<number> {
  const db = getDb();
  const lesson = await db.lessons.get(lessonId);
  if (!lesson) return 0;
  const topics = await listLessonTopics(lessonId);
  const unfinished = topics.filter((t) => t.status !== "completed");
  const existing = await db.carryForwardItems.where("originalLessonId").equals(lessonId).toArray();
  const known = new Set(existing.filter((e) => e.status !== "removed").map((e) => e.topicId));
  const ts = nowIso();

  const rows: CarryForwardItem[] = unfinished
    .filter((t) => !known.has(t.topicId))
    .map((t) => ({
      id: newId(),
      originalLessonId: lessonId,
      topicId: t.topicId,
      studentId: lesson.studentId,
      targetDate,
      status: targetDate ? "scheduled" : "open",
      createdAt: ts,
      updatedAt: ts,
    }));

  if (rows.length) await db.carryForwardItems.bulkAdd(rows);
  return rows.length;
}

export async function rescheduleCarryForward(id: ID, targetDate: string): Promise<void> {
  await getDb().carryForwardItems.update(id, {
    targetDate,
    status: "scheduled",
    updatedAt: nowIso(),
  });
}

export async function removeCarryForward(id: ID): Promise<void> {
  await getDb().carryForwardItems.update(id, { status: "removed", updatedAt: nowIso() });
}

export async function completeCarryForward(id: ID): Promise<void> {
  await getDb().carryForwardItems.update(id, { status: "done", updatedAt: nowIso() });
}

/** When a carried-forward topic lands in a new lesson, close the reference. */
export async function consumeCarryForwardForTopics(studentId: ID, topicIds: ID[]): Promise<void> {
  if (!topicIds.length) return;
  const db = getDb();
  const rows = await db.carryForwardItems.where("studentId").equals(studentId).toArray();
  const ids = rows
    .filter((r) => topicIds.includes(r.topicId) && (r.status === "open" || r.status === "scheduled"))
    .map((r) => r.id);
  await Promise.all(ids.map((id) => completeCarryForward(id)));
}
