"use client";

import { ArrowLeft, CircleAlert, Clock, Download, FileText, MailOpen, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { fileExtension, fullTime, relativeTime } from "@/lib/format";
import { useCopy } from "@/lib/lang";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { EmailFrame } from "./email-frame";
import { SenderMark, StateIcon } from "./inbox";
import { button } from "./ui/button";

interface Props {
  className?: string;
  /** A message is selected (sheet open on mobile). */
  open: boolean;
  /** What to show: the selected message, or the last one while the mobile sheet slides away. */
  message: TMailMessage | null;
  /** Selected message disappeared from the inbox. */
  gone: boolean;
  address: string;
  now: number;
  onClose: () => void;
}

/** Desktop: right-hand pane. Mobile/tablet: full-screen sheet sliding in from the right. */
export function MessageView({ className, open, message, gone, address, now, onClose }: Props) {
  const t = useCopy();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [message?.id]);

  const showContent = open ? message || gone : message; // keep last content during the mobile exit slide

  return (
    // Mobile: a full-screen frame that clips the sheet while it waits off-screen, so it never widens the page.
    // Desktop: just the right-hand pane.
    <div
      inert={!open}
      className={cx(
        "pointer-events-none fixed inset-0 z-40 overflow-hidden",
        "lg:pointer-events-auto lg:static lg:z-auto lg:min-h-0 lg:overflow-visible",
        className,
      )}
    >
      <div
        className={cx(
          "pointer-events-auto absolute inset-0 flex flex-col bg-surface transition-transform duration-300 ease-sheet",
          "lg:static lg:h-full lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <Placeholder className={cx("hidden", !open && "lg:flex")} />

        {showContent && (
          <div className={cx("flex h-full min-h-0 flex-col", !open && "lg:hidden")}>
            <div className="flex items-center gap-1 border-b border-line px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-3 lg:pt-2">
              <button type="button" onClick={onClose} className={button({ variant: "ghost", size: "sm" }, "lg:hidden")}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t.reader.back}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.reader.close}
                className={button({ variant: "ghost", size: "icon-sm" }, "ml-auto max-lg:hidden")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              {gone || !message ? (
                <Gone onBack={onClose} />
              ) : (
                <Article key={message.id} message={message} address={address} now={now} focusOnMount={open} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Article({ message: m, address, now, focusOnMount }: { message: TMailMessage; address: string; now: number; focusOnMount: boolean }) {
  const t = useCopy();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sender = m.senderName || m.senderEmail || t.inbox.unknownSender;
  const service = detectService(m.senderEmail);

  useEffect(() => {
    // Move focus into the reader so keyboard and screen-reader users land on the email.
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
    // Only on mount: each message gets its own Article (keyed by id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article className="animate-fade-in px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start gap-3">
        <SenderMark message={m} size="lg" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-ink [overflow-wrap:anywhere]">{sender}</span>
            {service && service.name !== sender && (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-muted">{service.name}</span>
            )}
          </p>
          {m.senderEmail && m.senderEmail !== sender && <p className="text-muted [overflow-wrap:anywhere]">{m.senderEmail}</p>}
          <p className="text-muted">
            {t.reader.to} <span className="font-mono text-ink-2 [overflow-wrap:anywhere]">{address}</span>
          </p>
        </div>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-xl font-semibold leading-snug tracking-tight text-balance outline-none [overflow-wrap:anywhere] sm:text-2xl"
      >
        {m.subject || t.inbox.noSubject}
      </h2>
      {(m.receivedAt || m.date) && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          {m.receivedAt ? (
            <time dateTime={new Date(m.receivedAt).toISOString()} title={fullTime(m.receivedAt, t.locale)}>
              {fmt(t.reader.received, { time: relativeTime(m.receivedAt, now, t.locale, t.time.justNow) })} · {fullTime(m.receivedAt, t.locale)}
            </time>
          ) : (
            m.date
          )}
        </p>
      )}

      {m.attachments.length > 0 && (
        <section className="mt-6">
          <h3 className="eyebrow">{fmt(t.reader.attachments, { n: m.attachments.length })}</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {m.attachments.map((a) => {
              const ext = fileExtension(a.name);
              return (
                <li key={a.url}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fmt(t.reader.download, { name: a.name })}
                    className="group flex items-center gap-3 rounded-xl border border-line p-2.5 pr-3 transition-colors hover:border-accent-line hover:bg-accent-soft"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-[10px] font-bold tracking-wide text-accent">
                      {ext || <FileText className="size-4" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={a.name}>
                      {a.name}
                    </span>
                    <Download className="size-4 shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <EmailFrame html={m.content} title={m.subject || t.reader.contentTitle} emptyText={t.reader.noContent} />
      </div>
    </article>
  );
}

function Placeholder({ className }: { className?: string }) {
  const t = useCopy();
  return (
    <div className={cx("h-full flex-col items-center justify-center gap-2 p-10 text-center", className)}>
      <StateIcon icon={MailOpen} tone="muted" />
      <p className="mt-2 font-semibold">{t.reader.emptyTitle}</p>
      <p className="max-w-xs text-sm text-muted">{t.reader.emptyBody}</p>
    </div>
  );
}

function Gone({ onBack }: { onBack: () => void }) {
  const t = useCopy();
  return (
    <div role="status" className="flex h-full animate-fade-in flex-col items-center justify-center gap-2 p-10 text-center">
      <StateIcon icon={CircleAlert} tone="warning" />
      <p className="mt-2 font-semibold">{t.reader.goneTitle}</p>
      <p className="max-w-xs text-sm text-muted">{t.reader.goneBody}</p>
      <button type="button" onClick={onBack} className={button({ variant: "secondary" }, "mt-3")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t.reader.back}
      </button>
    </div>
  );
}
