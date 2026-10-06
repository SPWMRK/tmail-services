"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { button } from "./button";
import { Spinner } from "./graphics";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busyLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive-action confirmation built on native <dialog> (focus trap, Esc, inert background). */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, busyLabel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // safest default for a destructive dialog
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault(); // we close through state so React stays in charge
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel(); // backdrop click
      }}
      className="modal m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-0 text-ink shadow-pop"
    >
      <div className="p-6">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <Trash2 className="size-5" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={descId} className="mt-1.5 text-sm text-muted [overflow-wrap:anywhere]">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={button({ variant: "secondary" })}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={button({ variant: "danger" }, "disabled:opacity-90")}
          >
            {busy ? <Spinner className="size-4" /> : <Trash2 className="size-4" aria-hidden="true" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
