import { DATA_TABLES, getDb, type DataTableName } from "@/lib/db";
import { nowIso, toLocalDateString } from "@/lib/ids";
import { LAST_BACKUP_KEY, setSetting } from "./settings";
import {
  exportAllAttendanceData,
  importAllAttendanceData,
  clearAllAttendanceData,
} from "./attendance";

export const APP_VERSION = "1.0.0";
export const BACKUP_VERSION = 1;

export interface BackupFile {
  appName: "TutorFlow";
  backupVersion: number;
  appVersion: string;
  exportedAt: string;
  data: Record<DataTableName, unknown[]>;
  attendance?: Record<string, Record<string, boolean>>;
}

export type BackupCounts = Record<DataTableName, number>;

export async function buildBackup(): Promise<BackupFile> {
  const db = getDb();
  const data = {} as Record<DataTableName, unknown[]>;
  for (const table of DATA_TABLES) {
    data[table] = await db.table(table).toArray();
  }
  return {
    appName: "TutorFlow",
    backupVersion: BACKUP_VERSION,
    appVersion: APP_VERSION,
    exportedAt: nowIso(),
    data,
    attendance: exportAllAttendanceData(),
  };
}

export function backupFileName(): string {
  return `TutorFlow_Backup_${toLocalDateString()}.json`;
}

export async function exportBackup(): Promise<string> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  await setSetting(LAST_BACKUP_KEY, nowIso());
  return link.download;
}

export class BackupValidationError extends Error {}

/** Parses and validates a backup file without touching the database. */
export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupValidationError("This file isn't a valid TutorFlow backup file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BackupValidationError("This backup file is not compatible with TutorFlow.");
  }

  const file = parsed as Partial<BackupFile>;
  if (file.appName !== "TutorFlow") {
    throw new BackupValidationError("This backup file was not created by TutorFlow.");
  }
  if (typeof file.backupVersion !== "number" || file.backupVersion > BACKUP_VERSION) {
    throw new BackupValidationError(
      "This backup was made by a newer version of TutorFlow. Please update the app first.",
    );
  }
  if (!file.data || typeof file.data !== "object") {
    throw new BackupValidationError("This backup file has no data in it.");
  }

  const data = {} as Record<DataTableName, unknown[]>;
  for (const table of DATA_TABLES) {
    const rows = (file.data as Record<string, unknown>)[table];
    if (rows === undefined) {
      data[table] = [];
      continue;
    }
    if (!Array.isArray(rows)) {
      throw new BackupValidationError("This backup file is damaged and can't be imported.");
    }
    for (const row of rows) {
      if (!row || typeof row !== "object" || typeof (row as { id?: unknown }).id !== "string") {
        throw new BackupValidationError("Some records in this backup are missing their ID.");
      }
    }
    data[table] = rows;
  }

  return {
    appName: "TutorFlow",
    backupVersion: file.backupVersion,
    appVersion: typeof file.appVersion === "string" ? file.appVersion : "unknown",
    exportedAt: typeof file.exportedAt === "string" ? file.exportedAt : nowIso(),
    data,
    attendance: file.attendance && typeof file.attendance === "object" ? file.attendance : undefined,
  };
}

export function countBackup(file: BackupFile): BackupCounts {
  const counts = {} as BackupCounts;
  for (const table of DATA_TABLES) counts[table] = file.data[table]?.length ?? 0;
  return counts;
}

export type ImportMode = "merge" | "replace";

export async function importBackup(file: BackupFile, mode: ImportMode): Promise<BackupCounts> {
  const db = getDb();
  const tables = DATA_TABLES.map((name) => db.table(name));

  await db.transaction("rw", tables, async () => {
    if (mode === "replace") {
      for (const table of tables) await table.clear();
    }
    for (const name of DATA_TABLES) {
      const rows = file.data[name] ?? [];
      if (rows.length) await db.table(name).bulkPut(rows as never[]);
    }
  });

  if (file.attendance) {
    importAllAttendanceData(file.attendance, mode);
  }

  return countBackup(file);
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  const tables = [...DATA_TABLES.map((name) => db.table(name)), db.appSettings];
  await db.transaction("rw", tables, async () => {
    for (const table of tables) await table.clear();
  });
  clearAllAttendanceData();
}
