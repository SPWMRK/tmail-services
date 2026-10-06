import type { Service } from "@/lib/services";
import { cx } from "@/lib/cx";

// Brand-colored monogram tiles. Swap the inner mark for official logo files if you have them.
const STYLE: Record<Service["id"], { background: string; mark: React.ReactNode }> = {
  iqiyi: {
    background: "linear-gradient(135deg, #2bd65a, #00a92f)",
    mark: <span className="text-[15px] font-extrabold italic tracking-tight">iQ</span>,
  },
  wetv: {
    background: "linear-gradient(135deg, #ff9a3d, #ff4f3a)",
    mark: <span className="text-[10.5px] font-extrabold tracking-tight">WeTV</span>,
  },
  disney: {
    background: "linear-gradient(135deg, #1a3c9e, #0b1741)",
    mark: (
      <span className="text-[15px] font-bold tracking-tight">
        D<span className="text-[#5ad1ff]">+</span>
      </span>
    ),
  },
};

export function ServiceLogo({ service, size = "md", className }: { service: Service; size?: "sm" | "md" | "lg"; className?: string }) {
  const style = STYLE[service.id];
  return (
    <span
      role="img"
      aria-label={service.name}
      style={{ background: style.background }}
      className={cx(
        "flex shrink-0 items-center justify-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_4px_12px_-4px_rgb(0_0_0/0.35)]",
        size === "sm" && "size-8 rounded-lg [&>span]:scale-[0.82]",
        size === "md" && "size-10 rounded-xl",
        size === "lg" && "size-12 rounded-2xl [&>span]:scale-110",
        className,
      )}
    >
      {style.mark}
    </span>
  );
}
