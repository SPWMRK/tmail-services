import Link from "next/link";

import { copy } from "@/lib/copy";

import { LogoMark } from "./ui/graphics";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label={copy.header.home} className="flex items-center gap-2.5 rounded-lg">
          <LogoMark className="size-8" />
          <span className="text-[17px] font-semibold tracking-tight">TMail</span>
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6">
      <div className="flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl">{copy.footer.note}</p>
        <p className="shrink-0">{copy.footer.rights}</p>
      </div>
    </footer>
  );
}
