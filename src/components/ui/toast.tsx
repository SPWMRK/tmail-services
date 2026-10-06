"use client";

import { CircleAlert, Mail, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cx } from "@/lib/cx";
import { copy } from "@/lib/copy";

import { AnimatedCheck } from "./graphics";

type Tone = "success" | "error" | "info" | "mail";

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
  leaving: boolean;
}

const DURATION: Record<Tone, number> = { success: 3000, info: 3500, mail: 5000, error: 6000 };
const EXIT_MS = 160;
const MAX_VISIBLE = 3;

// Module-level store so any component can raise a toast without a provider.
let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function dismiss(id: number) {
  if (!toasts.some((t) => t.id === id && !t.leaving)) return;
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, EXIT_MS);
}

export function toast(tone: Tone, title: string, description?: string) {
  const id = nextId++;
  toasts = [...toasts.filter((t) => !t.leaving).slice(-(MAX_VISIBLE - 1)), { id, tone, title, description, leaving: false }];
  emit();
  setTimeout(() => dismiss(id), DURATION[tone]);
}

const EMPTY: Toast[] = [];

function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "success") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success-soft text-success">
        <AnimatedCheck className="size-4" />
      </span>
    );
  }
  if (tone === "error") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-danger-soft text-danger">
        <CircleAlert className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent">
      <Mail className="size-4" aria-hidden="true" />
    </span>
  );
}

export function Toaster() {
  const items = useToasts();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:px-6 sm:pb-6"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cx(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3 pr-2 shadow-pop backdrop-blur-xl",
            item.leaving ? "opacity-0 transition-opacity duration-150" : "animate-rise-in",
          )}
        >
          <ToneIcon tone={item.tone} />
          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.title}</p>
            {item.description && <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{item.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label={copy.toast.dismiss}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
