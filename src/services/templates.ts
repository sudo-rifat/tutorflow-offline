import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import type {
  ClassTemplate,
  ID,
  TemplateChapter,
  TemplateSubject,
  TemplateTopic,
} from "@/lib/types";

const byOrder = <T extends { orderIndex: number }>(a: T, b: T) => a.orderIndex - b.orderIndex;

/* ----------------------------- class templates ---------------------------- */

export async function listClassTemplates(): Promise<ClassTemplate[]> {
  const rows = await getDb().classTemplates.toArray();
  return rows.sort(byOrder);
}

export async function createClassTemplate(name: string): Promise<ClassTemplate> {
  const ts = nowIso();
  const existing = await listClassTemplates();
  const row: ClassTemplate = {
    id: newId(),
    name: name.trim(),
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().classTemplates.add(row);
  return row;
}

export async function renameClassTemplate(id: ID, name: string): Promise<void> {
  await getDb().classTemplates.update(id, { name: name.trim(), updatedAt: nowIso() });
}

export async function deleteClassTemplateCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.classTemplates, db.templateSubjects, db.templateChapters, db.templateTopics],
    async () => {
      const subjects = await db.templateSubjects.where("classTemplateId").equals(id).toArray();
      for (const subject of subjects) await deleteTemplateSubjectRows(subject.id);
      await db.classTemplates.delete(id);
    },
  );
}

/* ---------------------------- template subjects --------------------------- */

export async function listTemplateSubjects(classTemplateId: ID): Promise<TemplateSubject[]> {
  const rows = await getDb()
    .templateSubjects.where("classTemplateId")
    .equals(classTemplateId)
    .toArray();
  return rows.sort(byOrder);
}

export async function createTemplateSubject(
  classTemplateId: ID,
  name: string,
): Promise<TemplateSubject> {
  const ts = nowIso();
  const existing = await listTemplateSubjects(classTemplateId);
  const row: TemplateSubject = {
    id: newId(),
    classTemplateId,
    name: name.trim(),
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().templateSubjects.add(row);
  return row;
}

export async function renameTemplateSubject(id: ID, name: string): Promise<void> {
  await getDb().templateSubjects.update(id, { name: name.trim(), updatedAt: nowIso() });
}

async function deleteTemplateSubjectRows(id: ID): Promise<void> {
  const db = getDb();
  const chapters = await db.templateChapters.where("templateSubjectId").equals(id).toArray();
  const chapterIds = chapters.map((c) => c.id);
  if (chapterIds.length) {
    await db.templateTopics.where("templateChapterId").anyOf(chapterIds).delete();
    await db.templateChapters.bulkDelete(chapterIds);
  }
  await db.templateSubjects.delete(id);
}

export async function deleteTemplateSubjectCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.templateSubjects, db.templateChapters, db.templateTopics],
    () => deleteTemplateSubjectRows(id),
  );
}

/* ---------------------------- template chapters --------------------------- */

export async function listTemplateChapters(templateSubjectId: ID): Promise<TemplateChapter[]> {
  const rows = await getDb()
    .templateChapters.where("templateSubjectId")
    .equals(templateSubjectId)
    .toArray();
  return rows.sort(byOrder);
}

export async function createTemplateChapter(
  templateSubjectId: ID,
  data: { chapterNumber: string; title: string },
): Promise<TemplateChapter> {
  const ts = nowIso();
  const existing = await listTemplateChapters(templateSubjectId);
  const row: TemplateChapter = {
    id: newId(),
    templateSubjectId,
    chapterNumber: data.chapterNumber.trim() || `${existing.length + 1}`,
    title: data.title.trim(),
    orderIndex: existing.length,
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().templateChapters.add(row);
  return row;
}

export async function updateTemplateChapter(
  id: ID,
  patch: Partial<Pick<TemplateChapter, "chapterNumber" | "title">>,
): Promise<void> {
  await getDb().templateChapters.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteTemplateChapterCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.templateChapters, db.templateTopics], async () => {
    await db.templateTopics.where("templateChapterId").equals(id).delete();
    await db.templateChapters.delete(id);
  });
}

/* ----------------------------- template topics ---------------------------- */

export async function listTemplateTopics(templateChapterId: ID): Promise<TemplateTopic[]> {
  const rows = await getDb()
    .templateTopics.where("templateChapterId")
    .equals(templateChapterId)
    .toArray();
  return rows.sort(byOrder);
}

/** Accepts one topic per line (paste-friendly) and appends them all. */
export async function addTemplateTopics(templateChapterId: ID, text: string): Promise<number> {
  const titles = text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  if (!titles.length) return 0;

  const ts = nowIso();
  const existing = await listTemplateTopics(templateChapterId);
  const rows: TemplateTopic[] = titles.map((title, i) => ({
    id: newId(),
    templateChapterId,
    title,
    orderIndex: existing.length + i,
    createdAt: ts,
    updatedAt: ts,
  }));
  await getDb().templateTopics.bulkAdd(rows);
  return rows.length;
}

export async function updateTemplateTopic(id: ID, title: string): Promise<void> {
  await getDb().templateTopics.update(id, { title: title.trim(), updatedAt: nowIso() });
}

export async function deleteTemplateTopic(id: ID): Promise<void> {
  await getDb().templateTopics.delete(id);
}

/* ------------------------------- apply to student ------------------------- */

export interface TemplateSubjectSummary {
  subject: TemplateSubject;
  chapters: number;
  topics: number;
}

export async function templateSubjectSummaries(
  classTemplateId: ID,
): Promise<TemplateSubjectSummary[]> {
  const db = getDb();
  const subjects = await listTemplateSubjects(classTemplateId);
  const result: TemplateSubjectSummary[] = [];
  for (const subject of subjects) {
    const chapters = await listTemplateChapters(subject.id);
    const chapterIds = chapters.map((c) => c.id);
    const topics = chapterIds.length
      ? await db.templateTopics.where("templateChapterId").anyOf(chapterIds).count()
      : 0;
    result.push({ subject, chapters: chapters.length, topics });
  }
  return result;
}

/**
 * Copies template subjects (with their chapters and topics) onto a student.
 * Copies are independent: editing the student's curriculum never changes the
 * template, and vice versa.
 */
export async function applyTemplateSubjectsToStudent(
  studentId: ID,
  templateSubjectIds: ID[],
): Promise<{ subjects: number; chapters: number; topics: number }> {
  const db = getDb();
  if (!templateSubjectIds.length) return { subjects: 0, chapters: 0, topics: 0 };

  return db.transaction(
    "rw",
    [db.subjects, db.chapters, db.topics, db.templateSubjects, db.templateChapters, db.templateTopics],
    async () => {
      const ts = nowIso();
      let subjectOrder = await db.subjects.where("studentId").equals(studentId).count();
      const counts = { subjects: 0, chapters: 0, topics: 0 };

      for (const templateSubjectId of templateSubjectIds) {
        const templateSubject = await db.templateSubjects.get(templateSubjectId);
        if (!templateSubject) continue;

        const subjectId = newId();
        await db.subjects.add({
          id: subjectId,
          studentId,
          name: templateSubject.name,
          orderIndex: subjectOrder++,
          createdAt: ts,
          updatedAt: ts,
        });
        counts.subjects += 1;

        const templateChapters = (
          await db.templateChapters.where("templateSubjectId").equals(templateSubjectId).toArray()
        ).sort(byOrder);

        for (const [chapterIndex, templateChapter] of templateChapters.entries()) {
          const chapterId = newId();
          await db.chapters.add({
            id: chapterId,
            subjectId,
            chapterNumber: templateChapter.chapterNumber,
            title: templateChapter.title,
            description: templateChapter.description,
            orderIndex: chapterIndex,
            createdAt: ts,
            updatedAt: ts,
          });
          counts.chapters += 1;

          const templateTopics = (
            await db.templateTopics.where("templateChapterId").equals(templateChapter.id).toArray()
          ).sort(byOrder);

          if (templateTopics.length) {
            await db.topics.bulkAdd(
              templateTopics.map((topic, i) => ({
                id: newId(),
                chapterId,
                title: topic.title,
                description: topic.description,
                orderIndex: i,
                createdAt: ts,
                updatedAt: ts,
              })),
            );
            counts.topics += templateTopics.length;
          }
        }
      }

      return counts;
    },
  );
}
