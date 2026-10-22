"use client";

import Link from "next/link";

import type { Lang } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { setLang, useCopy, useLang } from "@/lib/lang";

import { LogoMark } from "./ui/graphics";

// Each language is named in its own language, whatever the page language is.
const LANGUAGES: { id: Lang; short: string; name: string }[] = [
  { id: "th", short: "TH", name: "ภาษาไทย" },
  { id: "en", short: "EN", name: "English" },
];

export function SiteHeader() {
  const t = useCopy();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label={t.header.home} className="flex items-center gap-2.5 rounded-lg">
          <LogoMark className="size-8" />
          <span className="text-base font-semibold tracking-tight">TMail</span>
        </Link>
        <LanguageSwitch />
      </div>
    </header>
  );
}

function LanguageSwitch() {
  const t = useCopy();
  const current = useLang();
  return (
    <div role="group" aria-label={t.header.language} className="ml-auto flex rounded-full border border-line bg-surface p-1">
      {LANGUAGES.map(({ id, short, name }) => (
        <button
          key={id}
          type="button"
          lang={id}
          aria-label={name}
          aria-pressed={current === id}
          onClick={() => setLang(id)}
          className={cx(
            "h-8 min-w-11 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            current === id ? "bg-accent text-accent-ink" : "text-muted hover:text-ink",
          )}
        >
          {short}
        </button>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const t = useCopy();
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
      <div className="flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:justify-between sm:gap-6">
        <p className="max-w-xl">{t.footer.note}</p>
        <p className="shrink-0">{t.footer.rights}</p>
      </div>
    </footer>
  );
}
