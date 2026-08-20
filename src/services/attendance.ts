/**
 * Service for managing student attendance using localStorage for offline-first persistence.
 */

const STORAGE_PREFIX = "tutorflow_attendance_";
export const ATTENDANCE_CHANGE_EVENT = "tutorflow-attendance-changed";

/**
 * Retrieves the map of date strings (YYYY-MM-DD) to boolean status for a student.
 */
export function getAttendanceMap(studentId: string): Record<string, boolean> {
  if (typeof window === "undefined" || !studentId) return {};
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load attendance from localStorage:", error);
    return {};
  }
}

/**
 * Checks whether attendance is marked for a specific date (YYYY-MM-DD).
 */
export function isAttendanceMarked(studentId: string, dateStr: string): boolean {
  const map = getAttendanceMap(studentId);
  return Boolean(map[dateStr]);
}

/**
 * Toggles attendance for a student on a specific date (YYYY-MM-DD).
 * Returns the new attendance state for that date.
 */
export function toggleAttendance(studentId: string, dateStr: string): boolean {
  if (typeof window === "undefined" || !studentId || !dateStr) return false;
  try {
    const map = getAttendanceMap(studentId);
    const newState = !map[dateStr];
    if (newState) {
      map[dateStr] = true;
    } else {
      delete map[dateStr];
    }
    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(map));
    
    // Dispatch custom event for reactive UI updates across tabs/components
    window.dispatchEvent(
      new CustomEvent(ATTENDANCE_CHANGE_EVENT, {
        detail: { studentId, dateStr, state: newState },
      })
    );
    return newState;
  } catch (error) {
    console.error("Failed to save attendance to localStorage:", error);
    return false;
  }
}

/**
 * Explicitly sets attendance status for a student on a date.
 */
export function setAttendance(studentId: string, dateStr: string, status: boolean): void {
  if (typeof window === "undefined" || !studentId || !dateStr) return;
  try {
    const map = getAttendanceMap(studentId);
    if (status) {
      map[dateStr] = true;
    } else {
      delete map[dateStr];
    }
    localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(map));
    window.dispatchEvent(
      new CustomEvent(ATTENDANCE_CHANGE_EVENT, {
        detail: { studentId, dateStr, state: status },
      })
    );
  } catch (error) {
    console.error("Failed to set attendance:", error);
  }
}

/**
 * Returns statistics for a specific month (year: full year e.g. 2026, month: 1-12).
 */
export function getMonthlyAttendanceStats(
  studentId: string,
  year: number,
  month: number
): { totalClasses: number; dates: string[] } {
  const map = getAttendanceMap(studentId);
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  
  const dates = Object.keys(map).filter(
    (dateStr) => dateStr.startsWith(prefix) && map[dateStr]
  ).sort();

  return {
    totalClasses: dates.length,
    dates,
  };
}

/**
 * Returns all-time total classes count for a student.
 */
export function getTotalAttendanceCount(studentId: string): number {
  const map = getAttendanceMap(studentId);
  return Object.values(map).filter(Boolean).length;
}

/**
 * Exports all attendance records from localStorage as a record of studentId -> attendanceMap.
 */
export function exportAllAttendanceData(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {};
  const result: Record<string, Record<string, boolean>> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const studentId = key.replace(STORAGE_PREFIX, "");
        const raw = localStorage.getItem(key);
        if (raw) {
          result[studentId] = JSON.parse(raw);
        }
      }
    }
  } catch (error) {
    console.error("Failed to export attendance records:", error);
  }
  return result;
}

/**
 * Imports attendance records into localStorage.
 */
export function importAllAttendanceData(
  records: Record<string, Record<string, boolean>>,
  mode: "merge" | "replace"
): void {
  if (typeof window === "undefined" || !records) return;
  try {
    if (mode === "replace") {
      clearAllAttendanceData();
    }
    for (const [studentId, map] of Object.entries(records)) {
      if (!studentId || typeof map !== "object") continue;
      const existing = mode === "merge" ? getAttendanceMap(studentId) : {};
      const merged = { ...existing, ...map };
      localStorage.setItem(`${STORAGE_PREFIX}${studentId}`, JSON.stringify(merged));
    }
    window.dispatchEvent(new CustomEvent(ATTENDANCE_CHANGE_EVENT));
  } catch (error) {
    console.error("Failed to import attendance records:", error);
  }
}

/**
 * Clears all attendance records from localStorage.
 */
export function clearAllAttendanceData(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    window.dispatchEvent(new CustomEvent(ATTENDANCE_CHANGE_EVENT));
  } catch (error) {
    console.error("Failed to clear attendance data:", error);
  }
}

