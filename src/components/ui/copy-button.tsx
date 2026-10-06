"use client";

import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { writeClipboard } from "@/lib/clipboard";
import { copy as text } from "@/lib/copy";
import { cx } from "@/lib/cx";

import { button } from "./button";
import { AnimatedCheck } from "./graphics";
import { toast } from "./toast";

interface Props {
  value: string;
  label: string;
  copiedLabel: string;
  /** Toast shown after copying; omit for none. */
  toastTitle?: string;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "soft";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Hide the text label below the sm breakpoint (icon-only on phones). */
  compact?: boolean;
}

/** Copies `value` and morphs into an animated "copied" state for a moment. */
export function CopyButton({ value, label, copiedLabel, toastTitle, ariaLabel, variant = "secondary", size = "md", className, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (await writeClipboard(value)) {
      setCopied(true);
      setCount((n) => n + 1);
      if (toastTitle) toast("success", toastTitle, value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } else {
      toast("error", text.toast.copyFailed);
    }
  }

  const base =
    variant === "soft"
      ? cx(
          "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          copied ? "bg-success-soft text-success" : "bg-surface text-accent ring-1 ring-accent-line hover:bg-accent-soft",
        )
      : button(
          { variant: variant === "primary" ? "primary" : "secondary", size },
          copied ? (variant === "primary" ? "bg-success text-white hover:bg-success dark:text-bg" : "text-success") : undefined,
        );

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={cx(base, className)}>
      {copied ? (
        <AnimatedCheck key={count} className={size === "lg" ? "size-5" : "size-4"} />
      ) : (
        <Copy className={size === "lg" ? "size-[18px]" : "size-4"} aria-hidden="true" />
      )}
      <span key={String(copied)} className={cx("animate-fade-in", compact && "max-sm:sr-only")}>
        {copied ? copiedLabel : label}
      </span>
      {!toastTitle && (
        // The toast region already announces copies; without a toast, announce here.
        <span className="sr-only" aria-live="polite">
          {copied ? copiedLabel : ""}
        </span>
      )}
    </button>
  );
}
