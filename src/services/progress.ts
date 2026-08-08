import { getDb } from "@/lib/db";
import type { ID, LessonTopic, TopicStatus } from "@/lib/types";

export interface ProgressSummary {
  total: number;
  completed: number;
  partial: number;
  pending: number;
  notStarted: number;
  percent: number;
}

/**
 * Current status of a topic = the status recorded in the MOST RECENT lesson that
 * contained it. Repeating a lesson can never inflate progress because each topic
 * is counted exactly once.
 */
export async function currentTopicStatusMap(topicIds: ID[]): Promise<Map<ID, TopicStatus>> {
  const map = new Map<ID, TopicStatus>();
  if (!topicIds.length) return map;

  const db = getDb();
  const lessonTopics = await db.lessonTopics.where("topicId").anyOf(topicIds).toArray();
  if (!lessonTopics.length) return map;

  const lessonIds = [...new Set(lessonTopics.map((lt) => lt.lessonId))];
  const lessons = await db.lessons.where("id").anyOf(lessonIds).toArray();
  const dateOf = new Map(lessons.map((l) => [l.id, l.lessonDate] as const));

  const best = new Map<ID, { date: string; updatedAt: string; row: LessonTopic }>();
  for (const row of lessonTopics) {
    const date = dateOf.get(row.lessonId) ?? "";
    const current = best.get(row.topicId);
    const newer =
      !current ||
      date > current.date ||
      (date === current.date && row.updatedAt > current.updatedAt);
    if (newer) best.set(row.topicId, { date, updatedAt: row.updatedAt, row });
  }

  for (const [topicId, entry] of best) map.set(topicId, entry.row.status);
  return map;
}

export function summarize(topicIds: ID[], statuses: Map<ID, TopicStatus>): ProgressSummary {
  let completed = 0;
  let partial = 0;
  let pending = 0;
  let notStarted = 0;

  for (const id of topicIds) {
    const status = statuses.get(id);
    if (status === "completed") completed += 1;
    else if (status === "partial") partial += 1;
    else if (status === "pending") pending += 1;
    else notStarted += 1;
  }

  const total = topicIds.length;
  // Partial counts as half a topic so progress reflects real teaching state.
  const percent = total === 0 ? 0 : Math.round(((completed + partial * 0.5) / total) * 100);
  return { total, completed, partial, pending, notStarted, percent };
}

export async function progressForTopics(topicIds: ID[]): Promise<ProgressSummary> {
  const statuses = await currentTopicStatusMap(topicIds);
  return summarize(topicIds, statuses);
}

export async function progressForChapter(chapterId: ID): Promise<ProgressSummary> {
  const topics = await getDb().topics.where("chapterId").equals(chapterId).toArray();
  return progressForTopics(topics.map((t) => t.id));
}

export async function progressForSubject(subjectId: ID): Promise<ProgressSummary> {
  const db = getDb();
  const chapters = await db.chapters.where("subjectId").equals(subjectId).toArray();
  const topics = chapters.length
    ? await db.topics.where("chapterId").anyOf(chapters.map((c) => c.id)).toArray()
    : [];
  return progressForTopics(topics.map((t) => t.id));
}

export async function progressForStudent(studentId: ID): Promise<
  ProgressSummary & { subjects: number; chapters: number }
> {
  const db = getDb();
  const subjects = await db.subjects.where("studentId").equals(studentId).toArray();
  const chapters = subjects.length
    ? await db.chapters.where("subjectId").anyOf(subjects.map((s) => s.id)).toArray()
    : [];
  const topics = chapters.length
    ? await db.topics.where("chapterId").anyOf(chapters.map((c) => c.id)).toArray()
    : [];
  const summary = await progressForTopics(topics.map((t) => t.id));
  return { ...summary, subjects: subjects.length, chapters: chapters.length };
}
