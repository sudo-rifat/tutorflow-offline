import { getDb } from "@/lib/db";
import { todayString, tomorrowString } from "@/lib/ids";
import { createChapter, createSubject, createTopicsBulk, listChapters, listTopics } from "./curriculum";
import { carryForwardUnfinished, createLesson, listLessonTopics, setLessonTopicNote, setLessonTopicStatus } from "./lessons";
import { createStudent } from "./students";

/** Adds a realistic starter set so a brand-new install isn't an empty shell. */
export async function seedSampleData(): Promise<void> {
  const db = getDb();
  if ((await db.students.count()) > 0) return;

  const rahim = await createStudent({
    name: "Rahim Uddin",
    className: "Class 10",
    groupName: "Science",
    institution: "Dhaka Ideal School",
    phone: "01700000000",
    guardianName: "Mr. Karim Uddin",
    preferredTime: "19:00",
    startDate: todayString(),
    status: "active",
    notes: "Strong in algebra, needs support with motion concepts.",
  });

  const nusrat = await createStudent({
    name: "Nusrat Jahan",
    className: "Class 9",
    groupName: "Science",
    preferredTime: "17:30",
    status: "active",
  });

  const physics = await createSubject(rahim.id, "Physics");
  await createSubject(rahim.id, "Mathematics");
  const nusratMath = await createSubject(nusrat.id, "Mathematics");

  await createChapter(physics.id, {
    chapterNumber: "01",
    title: "Measurement",
    description: "Units, instruments and measurement errors.",
  });
  const motion = await createChapter(physics.id, {
    chapterNumber: "02",
    title: "Motion",
    description: "Distance, displacement, speed, velocity and acceleration.",
  });
  await createTopicsBulk(motion.id, [
    "Distance",
    "Displacement",
    "Speed",
    "Velocity",
    "Acceleration",
  ]);

  const algebra = await createChapter(nusratMath.id, {
    chapterNumber: "03",
    title: "Algebraic Expressions",
  });
  await createTopicsBulk(algebra.id, ["Factorisation", "Simplification"]);

  const motionTopics = await listTopics(motion.id);
  const [distance, displacement, , velocity, acceleration] = motionTopics;

  const todayLesson = await createLesson(
    {
      studentId: rahim.id,
      subjectId: physics.id,
      chapterId: motion.id,
      lessonDate: todayString(),
      lessonGoal: "Finish the basics of motion.",
    },
    motionTopics.map((t) => t.id),
  );

  const rows = await listLessonTopics(todayLesson.id);
  for (const row of rows) {
    if (row.topicId === distance?.id || row.topicId === displacement?.id) {
      await setLessonTopicStatus(row.id, "completed");
    }
    if (row.topicId === velocity?.id) {
      await setLessonTopicStatus(row.id, "partial");
      await setLessonTopicNote(row.id, "Confusing velocity with speed — revise next class.");
    }
  }

  await carryForwardUnfinished(todayLesson.id, tomorrowString());

  const nusratChapters = await listChapters(nusratMath.id);
  const firstChapter = nusratChapters[0];
  if (firstChapter) {
    const topics = await listTopics(firstChapter.id);
    await createLesson(
      {
        studentId: nusrat.id,
        subjectId: nusratMath.id,
        chapterId: firstChapter.id,
        lessonDate: todayString(),
        lessonGoal: "Practise factorisation.",
      },
      topics.map((t) => t.id),
    );
  }

  void acceleration;
}
