import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import type { ID, Student } from "@/lib/types";

export type StudentInput = Omit<Student, "id" | "createdAt" | "updatedAt"> &
  Partial<Pick<Student, "id">>;

export async function listStudents(): Promise<Student[]> {
  const all = await getDb().students.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStudent(id: ID): Promise<Student | undefined> {
  return getDb().students.get(id);
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const ts = nowIso();
  const student: Student = {
    ...input,
    id: input.id ?? newId(),
    createdAt: ts,
    updatedAt: ts,
  };
  await getDb().students.add(student);
  return student;
}

export async function updateStudent(id: ID, patch: Partial<StudentInput>): Promise<void> {
  await getDb().students.update(id, { ...patch, updatedAt: nowIso() });
}

export async function toggleStudentStatus(student: Student): Promise<void> {
  await updateStudent(student.id, {
    status: student.status === "active" ? "inactive" : "active",
  });
}

/**
 * Deleting a student removes everything that belongs only to them, so no
 * orphan subjects / chapters / topics / lessons are left behind.
 */
export async function deleteStudentCascade(id: ID): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.students, db.subjects, db.chapters, db.topics, db.lessons, db.lessonTopics, db.carryForwardItems],
    async () => {
      const subjects = await db.subjects.where("studentId").equals(id).toArray();
      const subjectIds = subjects.map((s) => s.id);
      const chapters = subjectIds.length
        ? await db.chapters.where("subjectId").anyOf(subjectIds).toArray()
        : [];
      const chapterIds = chapters.map((c) => c.id);
      const topics = chapterIds.length
        ? await db.topics.where("chapterId").anyOf(chapterIds).toArray()
        : [];
      const lessons = await db.lessons.where("studentId").equals(id).toArray();
      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length) await db.lessonTopics.where("lessonId").anyOf(lessonIds).delete();
      await db.carryForwardItems.where("studentId").equals(id).delete();
      await db.lessons.bulkDelete(lessonIds);
      await db.topics.bulkDelete(topics.map((t) => t.id));
      await db.chapters.bulkDelete(chapterIds);
      await db.subjects.bulkDelete(subjectIds);
      await db.students.delete(id);
    },
  );
}
