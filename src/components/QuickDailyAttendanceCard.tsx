import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, CalendarCheck, UserCheck, Plus, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listStudents } from "@/services/students";
import {
  getAttendanceMap,
  toggleAttendance,
  ATTENDANCE_CHANGE_EVENT,
} from "@/services/attendance";

export function QuickDailyAttendanceCard() {
  const students = useLiveQuery(() => listStudents(), []);
  const today = new Date();
  
  // Format today YYYY-MM-DD
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

    if (isNowTaught) {
      toast.success(`Marked ${studentName} as taught today! 🎉`);
    } else {
      toast.info(`Removed today's attendance for ${studentName}`);
    }
  };

  const formattedToday = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="card-surface p-4 sm:p-5 rounded-xl border bg-gradient-to-r from-emerald-500/5 via-card to-card border-emerald-500/20 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Today's Quick Attendance</h2>
              <Badge variant="outline" className="text-[11px] font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                {formattedToday}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-click attendance logger for active students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={taughtCount === activeStudents.length ? "default" : "secondary"}
            className="px-3 py-1 text-xs font-semibold"
          >
            <UserCheck className="size-3.5 mr-1" />
            {taughtCount} / {activeStudents.length} Taught Today
          </Badge>
          <Button asChild variant="ghost" size="sm" className="text-xs h-8">
            <Link to="/attendance">
              <Calendar className="size-3.5 mr-1" />
              Full Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid of students with 1-click attendance button */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {activeStudents.map((student) => {
          const isTaught = Boolean(attendanceState[student.id]);
          return (
            <div
              key={student.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isTaught
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
                  : "bg-background/80 hover:bg-accent/50 border-border"
              }`}
            >
              <div className="min-w-0 pr-2">
                <Link
                  to="/students/$studentId"
                  params={{ studentId: student.id }}
                  search={{ tab: "attendance" }}
                  className="font-semibold text-sm hover:underline truncate block"
                >
                  {student.name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  {student.className}
                  {student.preferredTime ? ` · ${student.preferredTime}` : ""}
                </p>
              </div>

              <Button
                size="sm"
                variant={isTaught ? "default" : "outline"}
                onClick={() => handleToggle(student.id, student.name)}
                className={`shrink-0 text-xs gap-1.5 h-8 font-medium ${
                  isTaught
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    : "border-dashed hover:border-emerald-500 hover:text-emerald-600"
                }`}
              >
                {isTaught ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Taught
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Mark Taught
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
