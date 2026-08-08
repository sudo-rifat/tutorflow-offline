import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  APP_VERSION,
  BackupValidationError,
  clearAllData,
  countBackup,
  exportBackup,
  importBackup,
  parseBackup,
  type BackupFile,
  type ImportMode,
} from "@/services/backup";
import { LAST_BACKUP_KEY, getSetting } from "@/services/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Backups — TutorFlow" },
      { name: "description", content: "Export a backup, restore one, or clear the data stored on this device." },
      { property: "og:title", content: "Settings & Backups — TutorFlow" },
      { property: "og:description", content: "Export a backup, restore one, or clear data on this device." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <SettingsPage />
    </ClientOnly>
  ),
});

function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function SettingsPage() {
  const lastBackup = useLiveQuery(() => getSetting<string | null>(LAST_BACKUP_KEY, null), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    try {
      const parsed = parseBackup(await file.text());
      setPending(parsed);
      setMode("merge");
    } catch (error) {
      if (error instanceof BackupValidationError) toast.error(error.message);
      else {
        console.error("Backup import failed", error);
        toast.error("We couldn't read that file. Please choose a TutorFlow backup.");
      }
    }
  }

  const counts = pending ? countBackup(pending) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your data lives on this device only." />

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-semibold">Data management</h2>
        <p className="text-sm text-muted-foreground">
          Your data is stored on this device. Export regular backups so you can restore everything if the browser
          data is cleared.
        </p>
        <p className="text-sm">
          {lastBackup ? `Last backup: ${daysAgo(lastBackup)}` : "You have never made a backup yet."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              try {
                const name = await exportBackup();
                toast.success(`Backup saved as ${name}`);
              } catch (error) {
                console.error("Backup export failed", error);
                toast.error("Unable to create the backup file. Please try again.");
              }
            }}
          >
            <Download className="size-4" aria-hidden="true" />
            Export backup
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Import backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleFile(file);
            }}
          />
        </div>
      </section>

      <section className="card-surface space-y-3 p-4">
        <h2 className="font-semibold">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          This removes every student, subject, chapter, topic, lesson and setting from this device permanently.
        </p>
        <ConfirmDialog
          title="Delete all local data?"
          description="All students, lessons, subjects, topics and settings will be permanently deleted from this device. Export a backup first if you might need this data."
          confirmLabel="Delete everything"
          requireTypedWord="DELETE"
          onConfirm={async () => {
            try {
              await clearAllData();
              toast.success("All local data deleted");
            } catch (error) {
              console.error("Clear data failed", error);
              toast.error("Unable to clear the data. Please try again.");
            }
          }}
          trigger={<Button variant="destructive">Delete all local data</Button>}
        />
      </section>

      <section className="card-surface space-y-1 p-4 text-sm">
        <h2 className="font-semibold">About</h2>
        <p className="text-muted-foreground">TutorFlow {APP_VERSION} — Plan. Teach. Track. Offline.</p>
        <p className="text-muted-foreground">
          Nothing you type is sent anywhere. No account, no cloud, no analytics.
        </p>
      </section>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import this backup?</DialogTitle>
            <DialogDescription>
              {counts
                ? `This backup contains ${counts.students} students, ${counts.subjects} subjects, ${counts.chapters} chapters, ${counts.topics} topics and ${counts.lessons} lessons.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as ImportMode)} className="gap-3">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge" className="font-normal">
                <span className="font-medium">Merge (recommended)</span>
                <span className="block text-xs text-muted-foreground">
                  Keeps what you have and adds or updates the records from the backup.
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="replace" id="replace" />
              <Label htmlFor="replace" className="font-normal">
                <span className="font-medium">Replace all</span>
                <span className="block text-xs text-muted-foreground">
                  Warning: this deletes your current local data first.
                </span>
              </Label>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (!pending) return;
                setBusy(true);
                try {
                  await importBackup(pending, mode);
                  toast.success("Backup imported");
                  setPending(null);
                } catch (error) {
                  console.error("Backup import failed", error);
                  toast.error("The import didn't finish. Your existing data is unchanged.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
