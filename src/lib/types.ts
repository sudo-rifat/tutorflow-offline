export type ID = string;

export type StudentStatus = "active" | "inactive";
export type TopicStatus = "pending" | "partial" | "completed";
export type CarryForwardStatus = "open" | "scheduled" | "done" | "removed";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Student extends Timestamps {
  id: ID;
  name: string;
  className: string;
  groupName?: string | undefined;
  institution?: string | undefined;
  phone?: string | undefined;
  guardianName?: string | undefined;
  preferredTime?: string | undefined;
  startDate?: string | undefined;
  status: StudentStatus;
  notes?: string | undefined;
}

export interface Subject extends Timestamps {
  id: ID;
  studentId: ID;
  name: string;
  orderIndex: number;
}

export interface Chapter extends Timestamps {
  id: ID;
  subjectId: ID;
  chapterNumber: string;
  title: string;
  description?: string | undefined;
  orderIndex: number;
}

export interface Topic extends Timestamps {
  id: ID;
  chapterId: ID;
  title: string;
  description?: string | undefined;
  orderIndex: number;
}

export interface Lesson extends Timestamps {
  id: ID;
  studentId: ID;
  subjectId: ID;
  chapterId?: ID | undefined;
  /** ISO date only, e.g. 2026-08-08 (local calendar day) */
  lessonDate: string;
  lessonGoal?: string | undefined;
  generalNote?: string | undefined;
}

export interface LessonTopic extends Timestamps {
  id: ID;
  lessonId: ID;
  topicId: ID;
  status: TopicStatus;
  note?: string | undefined;
  understandingRating?: number | undefined;
  orderIndex: number;
}

export interface CarryForwardItem extends Timestamps {
  id: ID;
  originalLessonId: ID;
  topicId: ID;
  studentId: ID;
  targetDate?: string | undefined;
  status: CarryForwardStatus;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  completed: "Completed",
  partial: "Partial",
  pending: "Pending",
};

export const TOPIC_STATUS_MARK: Record<TopicStatus, string> = {
  completed: "✓",
  partial: "~",
  pending: "○",
};
