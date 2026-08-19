import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyTemplateSubjectsToStudent,
  listClassTemplates,
  templateSubjectSummaries,
} from "@/services/templates";

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Copies a class template's subjects (with chapters + topics) onto a student. */
export function ApplyTemplateDialog({
  studentId,
  studentClassName,
  trigger,
}: {
  studentId: string;
  studentClassName?: string | undefined;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const classes = useLiveQuery(async () => (open ? listClassTemplates() : undefined), [open]);
  const rows = useLiveQuery(
    async () => (classId ? templateSubjectSummaries(classId) : []),
    [classId],
  );

  // Pre-pick the class that matches the student's own class name.
  useEffect(() => {
    if (!open || classId || !classes?.length) return;
    const wanted = normalise(studentClassName ?? "");
    const match = classes.find(
      (row) => wanted && (normalise(row.name) === wanted || normalise(row.name).includes(wanted)),
    );
    setClassId((match ?? classes[0]!).id);
  }, [open, classId, classes, studentClassName]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelected([]);
          setClassId("");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add subjects from a class template</DialogTitle>
          <DialogDescription>
            The chosen subjects, their chapters and topics are copied to this student. Later edits
            stay separate from the template.
          </DialogDescription>
        </DialogHeader>

        {classes === undefined ? null : classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No class templates yet.{" "}
            <Link to="/curriculum" className="underline" onClick={() => setOpen(false)}>
              Create one first
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="template-class">Class</Label>
              <Select value={classId} onValueChange={(value) => { setClassId(value); setSelected([]); }}>
                <SelectTrigger id="template-class">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rows?.length ? (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {rows.map(({ subject, chapters, topics }) => (
                  <li key={subject.id}>
                    <label className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm">
                      <Checkbox
                        checked={selected.includes(subject.id)}
                        onCheckedChange={() => toggle(subject.id)}
                        aria-label={subject.name}
                      />
                      <span>
                        {subject.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {chapters} chapter{chapters === 1 ? "" : "s"} · {topics} topic
                          {topics === 1 ? "" : "s"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                This class template has no subjects yet.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!selected.length || saving}
            onClick={async () => {
              setSaving(true);
              try {
                const counts = await applyTemplateSubjectsToStudent(studentId, selected);
                toast.success(
                  `Added ${counts.subjects} subject${counts.subjects === 1 ? "" : "s"}, ${counts.chapters} chapters, ${counts.topics} topics`,
                );
                setOpen(false);
                setSelected([]);
              } catch (error) {
                console.error("Failed to apply template", error);
                toast.error("Unable to copy this template. Please try again.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Adding…" : "Add to student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
