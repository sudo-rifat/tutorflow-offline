import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  requireTypedWord,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  requireTypedWord?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const blocked = Boolean(requireTypedWord) && typed.trim() !== requireTypedWord;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireTypedWord ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-word">
              Type <span className="font-semibold">{requireTypedWord}</span> to continue
            </Label>
            <Input
              id="confirm-word"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              placeholder={requireTypedWord}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={blocked}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (event) => {
              event.preventDefault();
              if (blocked) return;
              await onConfirm();
              setOpen(false);
              setTyped("");
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
