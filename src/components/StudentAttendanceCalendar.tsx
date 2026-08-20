import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function StudentAttendanceCalendar({ studentId, studentName }: StudentAttendanceCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  // Reload local attendance map
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

  // Month navigation handlers
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

  // Toggle date handler
  const handleToggleDate = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const isNowTaught = toggleAttendance(studentId, dateStr);
    
    // Format friendly date string for toast
    const dateObj = new Date(dateStr + "T00:00:00");
    const formatted = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (isNowTaught) {
      toast.success(`Marked taught on ${formatted} for ${studentName}`);
    } else {
      toast.info(`Removed attendance for ${formatted}`);
    }
  };

  // Statistics
  const monthStats = getMonthlyAttendanceStats(studentId, currentYear, currentMonth + 1);
  const totalAllTime = getTotalAttendanceCount(studentId);

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Format YYYY-MM-DD
  const formatIsoDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const todayIso = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const calendarGrid = [];

  // Padded days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
    const iso = formatIsoDate(prevYearNum, prevMonthIdx, dayNum);

    calendarGrid.push({
      dayNum,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isTaught: Boolean(attendanceMap[iso]),
    });
  }

  // Days in current month
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

  // Padded days for next month to complete grid (multiples of 7)
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
    const iso = formatIsoDate(nextYearNum, nextMonthIdx, dayNum);

    calendarGrid.push({
      dayNum,
      iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isTaught: Boolean(attendanceMap[iso]),
    });
  }

  const isCurrentMonthActive = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  return (
    <div className="space-y-4">
      {/* Summary Statistics Card */}
      <div className="card-surface p-4 rounded-xl border bg-card shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              Attendance Summary
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Attendance log for {studentName} ({MONTH_NAMES[currentMonth]} {currentYear})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
              <span className="text-primary font-bold mr-1">{monthStats.totalClasses}</span>
              {monthStats.totalClasses === 1 ? "Class" : "Classes"} Taught This Month
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs text-muted-foreground">
              {totalAllTime} Total All-Time
            </Badge>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="card-surface p-4 rounded-xl border bg-card shadow-sm space-y-4">
        {/* Navigation Controls & Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            {isCurrentMonthActive && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5 uppercase tracking-wide">
                Current Month
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              disabled={isCurrentMonthActive}
              className="h-8 text-xs font-medium"
            >
              <RotateCcw className="size-3 mr-1" />
              Today
            </Button>
            <div className="flex items-center border rounded-md p-0.5 bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="h-7 w-7 rounded"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="h-7 w-7 rounded"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-muted-foreground uppercase tracking-wider py-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarGrid.map((cell, idx) => {
            return (
              <button
                key={`${cell.iso}-${idx}`}
                type="button"
                onClick={() => handleToggleDate(cell.iso, cell.isCurrentMonth)}
                disabled={!cell.isCurrentMonth}
                className={`
                  relative flex flex-col items-center justify-between p-2 rounded-lg transition-all text-left min-h-[64px] sm:min-h-[74px] border
                  ${
                    !cell.isCurrentMonth
                      ? "opacity-30 bg-muted/10 border-transparent cursor-not-allowed"
                      : cell.isTaught
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-500/20 shadow-sm"
                      : "bg-background border-border hover:border-primary/50 hover:bg-accent/40"
                  }
                  ${cell.isToday ? "ring-2 ring-primary ring-offset-1 font-bold" : ""}
                `}
              >
                {/* Top Row: Date Number & Today indicator */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                      cell.isToday ? "bg-primary text-primary-foreground font-bold" : ""
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {cell.isToday && (
                    <span className="text-[9px] font-medium text-primary uppercase">Today</span>
                  )}
                </div>

                {/* Bottom Row: Checkbox/Toggle Indicator */}
                {cell.isCurrentMonth && (
                  <div className="mt-2 w-full flex items-center justify-center">
                    {cell.isTaught ? (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3.5 fill-emerald-500 text-white dark:text-emerald-950" />
                        <span className="hidden sm:inline">Taught</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground opacity-40 hover:opacity-100 transition-opacity">
                        <Circle className="size-3.5" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer instruction note */}
        <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Click any date to toggle attendance status for that day.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="size-3" /> Class Taught
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Circle className="size-3" /> Not Taught
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
