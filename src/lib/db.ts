import Dexie, { type Table } from "dexie";
import type {
  AppSetting,
  ClassTemplate,
  CarryForwardItem,
  Chapter,
  Lesson,
  LessonTopic,
  Student,
  Subject,
  TemplateChapter,
  TemplateSubject,
  TemplateTopic,
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
  classTemplates!: Table<ClassTemplate, string>;
  templateSubjects!: Table<TemplateSubject, string>;
  templateChapters!: Table<TemplateChapter, string>;
  templateTopics!: Table<TemplateTopic, string>;

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

    // Version 2 — reusable class-level curriculum templates (class → subject →
    // chapter → topic) that can be copied onto any student.
    this.version(2).stores({
      classTemplates: "id, name, orderIndex",
      templateSubjects: "id, classTemplateId, name, orderIndex",
      templateChapters: "id, templateSubjectId, chapterNumber, orderIndex",
      templateTopics: "id, templateChapterId, orderIndex",
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
  "classTemplates",
  "templateSubjects",
  "templateChapters",
  "templateTopics",
] as const;

export type DataTableName = (typeof DATA_TABLES)[number];
