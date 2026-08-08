import Dexie, { type Table } from "dexie";
import type {
  AppSetting,
  CarryForwardItem,
  Chapter,
  Lesson,
  LessonTopic,
  Student,
  Subject,
  Topic,
} from "./types";

export class TutorFlowDB extends Dexie {
  students!: Table<Student, string>;
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  topics!: Table<Topic, string>;
  lessons!: Table<Lesson, string>;
  lessonTopics!: Table<LessonTopic, string>;
  carryForwardItems!: Table<CarryForwardItem, string>;
  appSettings!: Table<AppSetting, string>;

  constructor() {
    super("tutorflow");

    // Version 1 — initial schema. Future schema changes MUST be added as a new
    // version block with an upgrade() so existing local data survives updates.
    this.version(1).stores({
      students: "id, name, className, status, updatedAt",
      subjects: "id, studentId, name, orderIndex",
      chapters: "id, subjectId, chapterNumber, title, orderIndex",
      topics: "id, chapterId, title, orderIndex",
      lessons: "id, studentId, subjectId, chapterId, lessonDate, updatedAt",
      lessonTopics: "id, lessonId, topicId, status, orderIndex",
      carryForwardItems: "id, studentId, topicId, originalLessonId, status, targetDate",
      appSettings: "key",
    });
  }
}

let instance: TutorFlowDB | null = null;

/** Dexie only exists in the browser — never call this during server rendering. */
export function getDb(): TutorFlowDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("Local database is only available in the browser.");
  }
  if (!instance) instance = new TutorFlowDB();
  return instance;
}

export const DATA_TABLES = [
  "students",
  "subjects",
  "chapters",
  "topics",
  "lessons",
  "lessonTopics",
  "carryForwardItems",
] as const;

export type DataTableName = (typeof DATA_TABLES)[number];
