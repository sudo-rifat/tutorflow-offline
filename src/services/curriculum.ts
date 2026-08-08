import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import type { Chapter, ID, Subject, Topic } from "@/lib/types";

const byOrder = <T extends { orderIndex: number }>(a: T, b: T) => a.orderIndex - b.orderIndex;

/* ------------------------------- subjects -------------------------------- */

export async function listSubjects(studentId: ID): Promise<Subject[]> {
  const rows = await getDb().subjects.where("studentId").equals(studentId).toArray();
  return rows.sort(byOrder);
}

export async function getSubject(id: ID): Promise<Subject | undefined> {
  return getDb().subjects.get(id);
}

export async function createSubject(studentId: ID, name: string): Promise<Subject> {
  const ts = nowIso();
  const existing = await listSubjects(studentId);
  const subject: Subject = {
    id: newId(),
    studentId,
    name: name.trim(),
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().subjects.add(subject);
  return subject;
}

export async function renameSubject(id: ID, name: string): Promise<void> {
  await getDb().subjects.update(id, { name: name.trim(), updatedAt: nowIso() });
}

export async function moveSubject(id: ID, direction: -1 | 1): Promise<void> {
  const db = getDb();
  const subject = await db.subjects.get(id);
  if (!subject) return;
  const siblings = await listSubjects(subject.studentId);
  await reorder(siblings, id, direction, (rowId, orderIndex) =>
    db.subjects.update(rowId, { orderIndex, updatedAt: nowIso() }),
  );
}

export async function deleteSubjectCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.subjects, db.chapters, db.topics, db.lessons, db.lessonTopics, db.carryForwardItems],
    async () => {
      const chapters = await db.chapters.where("subjectId").equals(id).toArray();
      const chapterIds = chapters.map((c) => c.id);
      const topics = chapterIds.length
        ? await db.topics.where("chapterId").anyOf(chapterIds).toArray()
        : [];
      const topicIds = topics.map((t) => t.id);
      const lessons = await db.lessons.where("subjectId").equals(id).toArray();
      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length) await db.lessonTopics.where("lessonId").anyOf(lessonIds).delete();
      if (topicIds.length) await db.carryForwardItems.where("topicId").anyOf(topicIds).delete();
      await db.lessons.bulkDelete(lessonIds);
      await db.topics.bulkDelete(topicIds);
      await db.chapters.bulkDelete(chapterIds);
      await db.subjects.delete(id);
    },
  );
}

/* ------------------------------- chapters -------------------------------- */

export async function listChapters(subjectId: ID): Promise<Chapter[]> {
  const rows = await getDb().chapters.where("subjectId").equals(subjectId).toArray();
  return rows.sort(byOrder);
}

export async function getChapter(id: ID): Promise<Chapter | undefined> {
  return getDb().chapters.get(id);
}

export async function createChapter(
  subjectId: ID,
  data: { chapterNumber: string; title: string; description?: string },
): Promise<Chapter> {
  const ts = nowIso();
  const existing = await listChapters(subjectId);
  const chapter: Chapter = {
    id: newId(),
    subjectId,
    chapterNumber: data.chapterNumber.trim(),
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().chapters.add(chapter);
  return chapter;
}

export async function updateChapter(
  id: ID,
  patch: Partial<Pick<Chapter, "chapterNumber" | "title" | "description">>,
): Promise<void> {
  await getDb().chapters.update(id, { ...patch, updatedAt: nowIso() });
}

export async function moveChapter(id: ID, direction: -1 | 1): Promise<void> {
  const db = getDb();
  const chapter = await db.chapters.get(id);
  if (!chapter) return;
  const siblings = await listChapters(chapter.subjectId);
  await reorder(siblings, id, direction, (rowId, orderIndex) =>
    db.chapters.update(rowId, { orderIndex, updatedAt: nowIso() }),
  );
}

export async function deleteChapterCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.chapters, db.topics, db.lessonTopics, db.carryForwardItems], async () => {
    const topics = await db.topics.where("chapterId").equals(id).toArray();
    const topicIds = topics.map((t) => t.id);
    if (topicIds.length) {
      await db.lessonTopics.where("topicId").anyOf(topicIds).delete();
      await db.carryForwardItems.where("topicId").anyOf(topicIds).delete();
      await db.topics.bulkDelete(topicIds);
    }
    await db.chapters.delete(id);
  });
}

/* -------------------------------- topics --------------------------------- */

export async function listTopics(chapterId: ID): Promise<Topic[]> {
  const rows = await getDb().topics.where("chapterId").equals(chapterId).toArray();
  return rows.sort(byOrder);
}

export async function listTopicsByChapters(chapterIds: ID[]): Promise<Topic[]> {
  if (!chapterIds.length) return [];
  const rows = await getDb().topics.where("chapterId").anyOf(chapterIds).toArray();
  return rows.sort(byOrder);
}

export async function getTopic(id: ID): Promise<Topic | undefined> {
  return getDb().topics.get(id);
}

export async function createTopic(
  chapterId: ID,
  data: { title: string; description?: string },
): Promise<Topic> {
  const ts = nowIso();
  const existing = await listTopics(chapterId);
  const topic: Topic = {
    id: newId(),
    chapterId,
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().topics.add(topic);
  return topic;
}

export async function createTopicsBulk(chapterId: ID, titles: string[]): Promise<void> {
  for (const title of titles) {
    if (title.trim()) await createTopic(chapterId, { title });
  }
}

export async function updateTopic(
  id: ID,
  patch: Partial<Pick<Topic, "title" | "description">>,
): Promise<void> {
  await getDb().topics.update(id, { ...patch, updatedAt: nowIso() });
}

export async function moveTopic(id: ID, direction: -1 | 1): Promise<void> {
  const db = getDb();
  const topic = await db.topics.get(id);
  if (!topic) return;
  const siblings = await listTopics(topic.chapterId);
  await reorder(siblings, id, direction, (rowId, orderIndex) =>
    db.topics.update(rowId, { orderIndex, updatedAt: nowIso() }),
  );
}

export async function deleteTopicCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.topics, db.lessonTopics, db.carryForwardItems], async () => {
    await db.lessonTopics.where("topicId").equals(id).delete();
    await db.carryForwardItems.where("topicId").equals(id).delete();
    await db.topics.delete(id);
  });
}

/* -------------------------------- helpers -------------------------------- */

async function reorder<T extends { id: ID; orderIndex: number }>(
  siblings: T[],
  id: ID,
  direction: -1 | 1,
  persist: (id: ID, orderIndex: number) => Promise<unknown>,
) {
  const index = siblings.findIndex((s) => s.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= siblings.length) return;
  const next = [...siblings];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  await Promise.all(next.map((row, i) => persist(row.id, i)));
}
