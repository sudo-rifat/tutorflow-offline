import { getDb } from "@/lib/db";
import { todayString } from "@/lib/ids";
import { createSubject } from "./curriculum";
import { createLesson } from "./lessons";
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
  const math = await createSubject(rahim.id, "Mathematics");
  const nusratMath = await createSubject(nusrat.id, "Mathematics");

  await createLesson({
    studentId: rahim.id,
    lessonDate: todayString(),
    items: [
      { id: "1", subjectId: physics.id, subjectName: physics.name, notes: "Chapter 2: Motion — Speed & Acceleration formulas solved." },
      { id: "2", subjectId: math.id, subjectName: math.name, notes: "Ex 3.1 Algebraic expressions" },
    ],
    generalNote: "Good concentration today.",
  });

  await createLesson({
    studentId: nusrat.id,
    lessonDate: todayString(),
    items: [
      { id: "3", subjectId: nusratMath.id, subjectName: nusratMath.name, notes: "Chapter 3: Factorisation basics" },
    ],
  });
}
