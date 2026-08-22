import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAttendanceMap,
  toggleAttendance,
  getMonthlyAttendanceStats,
  getTotalAttendanceCount,
  ATTENDANCE_CHANGE_EVENT,
} from "@/services/attendance";

interface StudentAttendanceCalendarProps {
  studentId: string;
  studentName: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function StudentAttendanceCalendar({ studentId, studentName }: StudentAttendanceCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  const refreshAttendance = useCallback(() => {
    setAttendanceMap(getAttendanceMap(studentId));
  }, [studentId]);

  useEffect(() => {
    refreshAttendance();

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ studentId: string }>;
      if (!customEvent.detail || customEvent.detail.studentId === studentId) {
        refreshAttendance();
      }
    };

    window.addEventListener(ATTENDANCE_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", refreshAttendance);

    return () => {
      window.removeEventListener(ATTENDANCE_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", refreshAttendance);
    };
  }, [studentId, refreshAttendance]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleToggleDate = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const isNowTaught = toggleAttendance(studentId, dateStr);
    const formatted = new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    toast.success(isNowTaught ? `${studentName} taught on ${formatted}` : `Removed ${formatted}`);
  };

  const monthStats = getMonthlyAttendanceStats(studentId, currentYear, currentMonth + 1);
  const totalAllTime = getTotalAttendanceCount(studentId);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const formatIsoDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const todayIso = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const calendarGrid: {
    dayNum: number;
    iso: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isTaught: boolean;
  }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
    const iso = formatIsoDate(prevYearNum, prevMonthIdx, dayNum);
    calendarGrid.push({ dayNum, iso, isCurrentMonth: false, isToday: false, isTaught: false });
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const iso = formatIsoDate(currentYear, currentMonth, dayNum);
    calendarGrid.push({
      dayNum,
      iso,
      isCurrentMonth: true,
      isToday: iso === todayIso,
      isTaught: Boolean(attendanceMap[iso]),
    });
  }

  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
    const iso = formatIsoDate(nextYearNum, nextMonthIdx, dayNum);
    calendarGrid.push({ dayNum, iso, isCurrentMonth: false, isToday: false, isTaught: false });
  }

  const isCurrentMonthActive = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-muted-foreground">
            {monthStats.totalClasses} this month · {totalAllTime} total
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonthActive ? (
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-xs">
              Today
            </Button>
          ) : null}
          <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month" className="size-8">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month" className="size-8">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((day, i) => (
          <div key={`${day}-${i}`} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarGrid.map((cell, idx) => (
          <button
            key={`${cell.iso}-${idx}`}
            type="button"
            onClick={() => handleToggleDate(cell.iso, cell.isCurrentMonth)}
            disabled={!cell.isCurrentMonth}
            aria-pressed={cell.isTaught}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md border text-sm transition-colors",
              !cell.isCurrentMonth && "border-transparent text-transparent",
              cell.isCurrentMonth && !cell.isTaught && "border-border hover:bg-accent",
              cell.isTaught && "border-success bg-success text-success-foreground font-semibold",
              cell.isToday && !cell.isTaught && "ring-2 ring-ring",
            )}
          >
            {cell.isCurrentMonth ? cell.dayNum : ""}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Tap a date to mark a class taught.</p>
    </div>
  );
}
