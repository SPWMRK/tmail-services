"use client";

import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { writeClipboard } from "@/lib/clipboard";
import { cx } from "@/lib/cx";
import { useCopy } from "@/lib/lang";

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
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Copies `value` and morphs into an animated "copied" state for a moment. */
export function CopyButton({ value, label, copiedLabel, toastTitle, ariaLabel, size = "md", className }: Props) {
  const t = useCopy();
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
      toast("error", t.toast.copyFailed);
    }
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={button({ size }, cx(copied && "text-success", className))}>
      {copied ? (
        <AnimatedCheck key={count} className={size === "lg" ? "size-5" : "size-4"} />
      ) : (
        <Copy className={size === "lg" ? "size-[18px]" : "size-4"} aria-hidden="true" />
      )}
      <span key={String(copied)} className="animate-fade-in">
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
