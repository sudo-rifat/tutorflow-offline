import { getDb } from "@/lib/db";
import { todayString } from "@/lib/ids";
import type { Lesson, Student, Subject } from "@/lib/types";

export interface StudentOverview {
  student: Student;
  subjects: Subject[];
  nextLesson: Lesson | undefined;
  totalLessons: number;
}

export async function studentOverviews(): Promise<StudentOverview[]> {
  const db = getDb();
  const [students, subjects, lessons] = await Promise.all([
    db.students.toArray(),
    db.subjects.toArray(),
    db.lessons.toArray(),
  ]);

  const today = todayString();

  return students
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => {
      const mySubjects = subjects
        .filter((s) => s.studentId === student.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const studentLessons = lessons.filter((l) => l.studentId === student.id);

      const nextLesson = studentLessons
        .filter((l) => l.lessonDate >= today)
        .sort((a, b) => a.lessonDate.localeCompare(b.lessonDate))[0];

      return {
        student,
        subjects: mySubjects,
        nextLesson,
        totalLessons: studentLessons.length,
      };
    });
}

export async function studentOverview(studentId: string): Promise<StudentOverview | undefined> {
  const all = await studentOverviews();
  return all.find((o) => o.student.id === studentId);
}

export async function chapterProgressRows(_subjectId: string) {
  return [];
}
