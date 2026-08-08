import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStudent, updateStudent, type StudentInput } from "@/services/students";
import type { Student, StudentStatus } from "@/lib/types";

const empty = {
  name: "",
  className: "",
  groupName: "",
  institution: "",
  phone: "",
  guardianName: "",
  preferredTime: "",
  startDate: "",
  status: "active" as StudentStatus,
  notes: "",
};

type FormState = typeof empty;

function fromStudent(student: Student): FormState {
  return {
    name: student.name,
    className: student.className,
    groupName: student.groupName ?? "",
    institution: student.institution ?? "",
    phone: student.phone ?? "",
    guardianName: student.guardianName ?? "",
    preferredTime: student.preferredTime ?? "",
    startDate: student.startDate ?? "",
    status: student.status,
    notes: student.notes ?? "",
  };
}

function toInput(form: FormState): StudentInput {
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    name: form.name.trim(),
    className: form.className.trim(),
    groupName: optional(form.groupName),
    institution: optional(form.institution),
    phone: optional(form.phone),
    guardianName: optional(form.guardianName),
    preferredTime: optional(form.preferredTime),
    startDate: optional(form.startDate),
    status: form.status,
    notes: optional(form.notes),
  };
}

export function StudentFormDialog({
  student,
  trigger,
  onSaved,
}: {
  student?: Student;
  trigger: ReactNode;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(student ? fromStudent(student) : empty);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; className?: string }>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = "Please enter the student's name.";
    if (!form.className.trim()) nextErrors.className = "Please enter the class.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (student) {
        await updateStudent(student.id, toInput(form));
        toast.success("Student updated");
      } else {
        await createStudent(toInput(form));
        toast.success("Student added");
        setForm(empty);
      }
      setOpen(false);
      onSaved?.();
    } catch (error) {
      console.error("Failed to save student", error);
      toast.error("Unable to save this student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setForm(student ? fromStudent(student) : empty);
        setErrors({});
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>Only the name and class are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="className">Class *</Label>
              <Input
                id="className"
                value={form.className}
                onChange={(e) => set("className", e.target.value)}
                placeholder="Class 10"
                required
              />
              {errors.className ? <p className="text-xs text-destructive">{errors.className}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupName">Group</Label>
              <Input id="groupName" value={form.groupName} onChange={(e) => set("groupName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={form.institution}
                onChange={(e) => set("institution", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guardianName">Guardian</Label>
              <Input
                id="guardianName"
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preferredTime">Preferred time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={form.preferredTime}
                onChange={(e) => set("preferredTime", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(value) => set("status", value as StudentStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : student ? "Save changes" : "Add student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
