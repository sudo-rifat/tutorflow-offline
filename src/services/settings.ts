import { getDb } from "@/lib/db";
import { nowIso } from "@/lib/ids";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await getDb().appSettings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getDb().appSettings.put({ key, value, updatedAt: nowIso() });
}

export const LAST_BACKUP_KEY = "lastBackupAt";
