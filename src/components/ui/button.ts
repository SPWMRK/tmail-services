import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg" | "icon-sm";

const BASE =
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
  "icon-sm": "size-9 rounded-lg",
};

/** Class names for a button (or a link styled as one). */
export function button({ variant = "secondary", size = "md" }: { variant?: Variant; size?: Size } = {}, extra?: string) {
  return cx(BASE, VARIANTS[variant], SIZES[size], extra);
}
