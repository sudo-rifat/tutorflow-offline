import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listStudents } from "@/services/students";
import { getAttendanceMap, toggleAttendance, ATTENDANCE_CHANGE_EVENT } from "@/services/attendance";

export function QuickDailyAttendanceCard() {
  const students = useLiveQuery(() => listStudents(), []);
  const today = new Date();

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});

  const refreshAllAttendance = useCallback(() => {
    if (!students) return;
    const map: Record<string, boolean> = {};
    for (const student of students) {
      const studentMap = getAttendanceMap(student.id);
      map[student.id] = Boolean(studentMap[todayIso]);
    }
    setAttendanceState(map);
  }, [students, todayIso]);

  useEffect(() => {
    refreshAllAttendance();

    const handleCustomChange = () => refreshAllAttendance();
    window.addEventListener(ATTENDANCE_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", handleCustomChange);

    return () => {
      window.removeEventListener(ATTENDANCE_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleCustomChange);
    };
  }, [refreshAllAttendance]);

  if (!students || students.length === 0) return null;

  const activeStudents = students.filter((s) => s.status === "active");
  if (activeStudents.length === 0) return null;

  const taughtCount = activeStudents.filter((s) => attendanceState[s.id]).length;

  const handleToggle = (studentId: string, studentName: string) => {
    const isNowTaught = toggleAttendance(studentId, todayIso);
    setAttendanceState((prev) => ({ ...prev, [studentId]: isNowTaught }));
    toast.success(isNowTaught ? `${studentName} marked taught` : `${studentName} attendance removed`);
  };

  return (
    <section className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Attendance today
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {taughtCount}/{activeStudents.length}
          </span>
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/attendance">Calendar</Link>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {activeStudents.map((student) => {
          const isTaught = Boolean(attendanceState[student.id]);
          return (
            <div
              key={student.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-3 py-2",
                isTaught ? "border-success/40 bg-success/10" : "border-border",
              )}
            >
              <Link
                to="/students/$studentId"
                params={{ studentId: student.id }}
                search={{ tab: "attendance" }}
                className="min-w-0 truncate text-sm font-medium hover:underline"
              >
                {student.name}
              </Link>
              <Button
                size="sm"
                variant={isTaught ? "secondary" : "outline"}
                onClick={() => handleToggle(student.id, student.name)}
                className="h-8 shrink-0 text-xs"
                aria-pressed={isTaught}
              >
                {isTaught ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                {isTaught ? "Taught" : "Mark"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
