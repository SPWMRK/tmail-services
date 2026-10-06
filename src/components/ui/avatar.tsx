import { colorIndex, initials } from "@/lib/format";
import { cx } from "@/lib/cx";

export function Avatar({ name, seed, size = "md" }: { name: string; seed: string; size?: "md" | "lg" }) {
  const tone = colorIndex(seed || name);
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: `var(--avatar-${tone}-bg)`, color: `var(--avatar-${tone}-fg)` }}
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "lg" ? "size-11 text-sm" : "size-10 text-xs",
      )}
    >
      {initials(name)}
    </span>
  );
}
