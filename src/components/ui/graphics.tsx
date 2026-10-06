// Hand-made SVG marks and illustrations. Colors come from currentColor / theme tokens.
import { useId } from "react";

import { cx } from "@/lib/cx";

export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <rect x="7" y="10" width="18" height="13" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="m8 12 8 5.5 8-5.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.5" cy="9.5" r="3.5" fill="#fff" />
      <path d="M24.5 8v1.6l1 .8" fill="none" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Landing hero: a code card rising out of an envelope, with a verified badge. */
export function HeroIllustration({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 240 190" fill="none" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="58%" r="50%">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-env`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="108" rx="116" ry="82" fill={`url(#${id}-glow)`} />

      {/* envelope back + open flap */}
      <path d="M48 96 120 48l72 48v60a10 10 0 0 1-10 10H58a10 10 0 0 1-10-10V96Z" fill={`url(#${id}-env)`} opacity="0.55" />

      {/* code card, gently floating */}
      <g className="animate-float [animation-duration:4.5s]">
        <rect x="68" y="34" width="104" height="100" rx="12" fill="var(--surface)" stroke="var(--line-strong)" />
        <rect x="81" y="48" width="40" height="6" rx="3" fill="var(--accent)" opacity="0.7" />
        <rect x="81" y="60" width="74" height="5" rx="2.5" fill="var(--surface-3)" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x={81 + i * 13.4} y="76" width="10.5" height="15" rx="3" fill="var(--accent-soft)" stroke="var(--accent-line)" />
            <circle cx={86.25 + i * 13.4} cy="83.5" r="2" fill="var(--accent)" className="code-dot" style={{ animationDelay: `${i * 0.18}s` }} />
          </g>
        ))}
        <rect x="81" y="101" width="58" height="5" rx="2.5" fill="var(--surface-3)" />
      </g>

      {/* envelope front pocket */}
      <path d="M48 102 120 142l72-40v54a10 10 0 0 1-10 10H58a10 10 0 0 1-10-10v-54Z" fill={`url(#${id}-env)`} />
      <path d="M49 103 120 142l71-39" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />

      {/* verified badge */}
      <g className="animate-pop-in [animation-delay:0.35s]" style={{ transformOrigin: "188px 52px" }}>
        <circle cx="188" cy="52" r="15" fill="var(--success)" stroke="var(--surface)" strokeWidth="3" />
        <path d="m181 52 5 5 9-10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* sparkles */}
      <circle cx="40" cy="64" r="3" fill="var(--sky)" className="animate-float [animation-delay:0.8s]" opacity="0.7" />
      <circle cx="206" cy="122" r="2.5" fill="var(--accent)" className="animate-float [animation-delay:1.6s]" opacity="0.6" />
      <circle cx="58" cy="30" r="2" fill="var(--accent)" className="animate-float [animation-delay:2.2s]" opacity="0.5" />
    </svg>
  );
}

/** Check mark that draws itself; pair with a parent re-mount to replay. */
export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 12.5 10 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        className="animate-draw"
        style={{ ["--path-length" as string]: "24" }}
      />
    </svg>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cx("animate-spin", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Envelope floating above radar rings — "waiting for mail". */
export function WaitingIllustration({ className }: { className?: string }) {
  return (
    <div className={cx("relative flex size-28 items-center justify-center", className)} aria-hidden="true">
      <span className="absolute inset-0 animate-radar rounded-full border border-accent/40" />
      <span className="absolute inset-0 animate-radar rounded-full border border-accent/40 [animation-delay:1.2s]" />
      <span className="absolute inset-5 rounded-full bg-accent-soft" />
      <svg viewBox="0 0 64 64" className="relative size-14 animate-float text-accent">
        <rect x="8" y="16" width="48" height="34" rx="7" fill="var(--surface)" stroke="currentColor" strokeWidth="2.5" />
        <path d="m10 19 22 16 22-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="52" cy="16" r="7" fill="var(--sky)" stroke="var(--surface)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

/** Open envelope — "pick an email to read". */
export function ReaderIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 80" fill="none" aria-hidden="true" className={className}>
      <path d="M14 34 48 10l34 24v34a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V34Z" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="2" />
      <rect x="26" y="20" width="44" height="34" rx="4" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      <path d="M33 30h22M33 37h30M33 44h16" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m14 34 34 22 34-22" stroke="var(--line-strong)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** Envelope with a warning badge — failures and missing mail. */
export function ProblemIllustration({ tone = "danger", className }: { tone?: "danger" | "warning"; className?: string }) {
  const color = tone === "danger" ? "var(--danger)" : "var(--warning)";
  return (
    <svg viewBox="0 0 80 72" fill="none" aria-hidden="true" className={className}>
      <rect x="8" y="18" width="52" height="38" rx="7" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="2" />
      <path d="m10 21 24 17 24-17" stroke="var(--line-strong)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="58" cy="20" r="13" fill="var(--surface)" stroke={color} strokeWidth="2.5" className="animate-pop-in" />
      <path d="M58 13.5v8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="58" cy="26" r="1.6" fill={color} />
    </svg>
  );
}

/** Ring that fills over `durationMs`; restart by changing the React key. */
export function CountdownRing({ durationMs, paused, className }: { durationMs: number; paused?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cx("-rotate-90", className)}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="countdown-ring"
        style={{ animationDuration: `${durationMs}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </svg>
  );
}
