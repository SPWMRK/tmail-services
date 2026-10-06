"use client";

import { ArrowLeft, Clock, Download, FileText, KeyRound, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { copy, fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { fileExtension, fullTime, relativeTime } from "@/lib/format";
import { detectCode, formatCode } from "@/lib/otp";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { EmailFrame } from "./email-frame";
import { SenderMark } from "./inbox";
import { button } from "./ui/button";
import { CopyButton } from "./ui/copy-button";
import { ProblemIllustration, ReaderIllustration } from "./ui/graphics";

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
  onDelete: (message: TMailMessage) => void;
}

/** Desktop: right-hand pane. Mobile/tablet: full-screen sheet sliding in from the right. */
export function MessageView({ className, open, message, gone, address, now, onClose, onDelete }: Props) {
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
                {copy.reader.back}
              </button>
              {message && !gone && (
                <button type="button" onClick={() => onDelete(message)} className={button({ variant: "danger-ghost", size: "sm" }, "ml-auto")}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  {copy.reader.delete}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.reader.close}
                className={button({ variant: "ghost", size: "icon-sm" }, cx("max-lg:hidden", (!message || gone) && "ml-auto"))}
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sender = m.senderName || m.senderEmail || copy.inbox.unknownSender;
  const service = detectService(m.senderEmail);
  const code = useMemo(() => detectCode(m.id, m.subject, m.content), [m.id, m.subject, m.content]);

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
            {copy.reader.to} <span className="font-mono text-ink-2 [overflow-wrap:anywhere]">{address}</span>
          </p>
        </div>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-xl font-semibold leading-snug tracking-tight text-balance outline-none [overflow-wrap:anywhere] sm:text-2xl"
      >
        {m.subject || copy.inbox.noSubject}
      </h2>
      {(m.receivedAt || m.date) && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          {m.receivedAt ? (
            <time dateTime={new Date(m.receivedAt).toISOString()} title={fullTime(m.receivedAt)}>
              {fmt(copy.reader.received, { time: relativeTime(m.receivedAt, now, copy.time.justNow) })} · {fullTime(m.receivedAt)}
            </time>
          ) : (
            m.date
          )}
        </p>
      )}

      {code && <CodePanel code={code} />}

      {m.attachments.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{fmt(copy.reader.attachments, { n: m.attachments.length })}</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {m.attachments.map((a) => {
              const ext = fileExtension(a.name);
              return (
                <li key={a.url}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fmt(copy.reader.download, { name: a.name })}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-2.5 pr-3 transition-colors hover:border-accent-line hover:bg-accent-soft"
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
        <EmailFrame html={m.content} title={m.subject || copy.reader.contentTitle} emptyText={copy.reader.noContent} />
      </div>
    </article>
  );
}

/** The detected verification code — the most important thing in the email. */
function CodePanel({ code }: { code: string }) {
  return (
    <section
      aria-label={copy.code.title}
      className="glow-field relative mt-5 animate-rise-in overflow-hidden rounded-2xl border border-accent-line bg-gradient-to-br from-accent-soft via-surface to-surface p-4 sm:p-5"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-accent">
        <KeyRound className="size-4" aria-hidden="true" />
        {copy.code.title}
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <p className="select-all font-mono text-[40px] font-semibold leading-none tracking-[0.12em] text-ink tabular-nums sm:text-5xl">
          {formatCode(code)}
        </p>
        <CopyButton
          variant="primary"
          size="lg"
          value={code}
          label={copy.code.copy}
          copiedLabel={copy.code.copied}
          toastTitle={copy.code.copiedToast}
          ariaLabel={fmt(copy.code.copyAria, { code })}
          className="w-full sm:ml-auto sm:w-auto sm:min-w-40"
        />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Clock className="size-3.5" aria-hidden="true" />
        {copy.code.expiryHint}
      </p>
    </section>
  );
}

function Placeholder({ className }: { className?: string }) {
  return (
    <div className={cx("h-full flex-col items-center justify-center gap-2 p-10 text-center", className)}>
      <ReaderIllustration className="mb-2 h-20" />
      <p className="font-semibold">{copy.reader.emptyTitle}</p>
      <p className="max-w-xs text-sm text-muted">{copy.reader.emptyBody}</p>
    </div>
  );
}

function Gone({ onBack }: { onBack: () => void }) {
  return (
    <div role="status" className="flex h-full animate-fade-in flex-col items-center justify-center gap-2 p-10 text-center">
      <ProblemIllustration tone="warning" className="mb-2 h-20" />
      <p className="font-semibold">{copy.reader.goneTitle}</p>
      <p className="max-w-xs text-sm text-muted">{copy.reader.goneBody}</p>
      <button type="button" onClick={onBack} className={button({ variant: "secondary" }, "mt-3")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {copy.reader.back}
      </button>
    </div>
  );
}
