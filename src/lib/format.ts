/** `locale` and `justNow` come from the current language's copy. */
export function relativeTime(ms: number, now: number, locale: string, justNow: string): string {
  const sec = Math.round((ms - now) / 1000);
  const abs = Math.abs(sec);
  if (abs < 45) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(sec / 86400), "day");
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(ms);
}

export function fullTime(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(ms);
}

export function clockTime(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(ms);
}

export function initials(name: string): string {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  const chars = parts.length > 1 ? [...parts[0]][0] + [...parts[1]][0] : [...clean].slice(0, 2).join("");
  return chars.toUpperCase();
}

/** Stable 0–5 bucket for avatar colors. */
export function colorIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash) % 6;
}

const EXT_RE = /\.([a-z0-9]{1,5})$/i;

export function fileExtension(name: string): string {
  return EXT_RE.exec(name)?.[1]?.toUpperCase() ?? "";
}
