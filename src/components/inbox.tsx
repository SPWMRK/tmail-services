"use client";

import { ArrowLeftRight, KeyRound, Paperclip, RefreshCw, RotateCw } from "lucide-react";
import { memo, useMemo } from "react";

import { POLL_MS } from "@/hooks/use-inbox";
import { copy, fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { clockTime, fullTime, relativeTime } from "@/lib/format";
import { detectCode, formatCode } from "@/lib/otp";
import { previewText } from "@/lib/preview";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { Avatar } from "./ui/avatar";
import { button } from "./ui/button";
import { CopyButton } from "./ui/copy-button";
import { CountdownRing, ProblemIllustration, WaitingIllustration } from "./ui/graphics";
import { ServiceLogo } from "./ui/service-logo";

// --- Panel toolbar ------------------------------------------------------------------

export function MessagesToolbar({
  titleId,
  count,
  lastChecked,
  refreshing,
  paused,
  onRefresh,
}: {
  titleId: string;
  count: number;
  lastChecked: number;
  refreshing: boolean;
  paused: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
      <h2 id={titleId} className="flex items-center gap-2 text-base font-semibold">
        {copy.inbox.messages}
        {count > 0 && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">{count}</span>}
      </h2>
      <p
        className="ml-auto hidden items-center gap-1.5 text-xs text-muted min-[420px]:flex"
        title={lastChecked ? fmt(copy.inbox.lastChecked, { time: clockTime(lastChecked) }) : undefined}
      >
        {paused ? copy.inbox.offlineTitle : refreshing ? copy.inbox.status.checking : copy.inbox.autoRefresh}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={paused}
        aria-label={copy.inbox.refreshAria}
        className={button({ variant: "secondary", size: "sm" }, "max-[419px]:ml-auto")}
      >
        <span className="relative grid size-5 place-items-center">
          {!refreshing && !paused && lastChecked > 0 && (
            <CountdownRing key={lastChecked} durationMs={POLL_MS} className="absolute inset-0 size-5 text-accent" />
          )}
          <RefreshCw className={cx("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
        </span>
        {copy.inbox.refresh}
      </button>
    </div>
  );
}

// --- List -----------------------------------------------------------------------

export type ListState = "loading" | "empty" | "list" | "error" | "unavailable" | "offline";

interface ListProps {
  state: ListState;
  errorText: string;
  messages: TMailMessage[];
  selectedId: string | null;
  readIds: Set<string>;
  freshIds: Set<string>;
  removingIds: Set<string>;
  now: number;
  refreshing: boolean;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onChangeEmail: () => void;
}

export function InboxList(props: ListProps) {
  const { state } = props;

  if (state === "loading") {
    return (
      <div aria-busy="true">
        <p className="sr-only" role="status">
          {copy.inbox.loading}
        </p>
        <ul aria-label={copy.inbox.listLabel}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-3 border-b border-line/70 px-4 py-4 sm:px-5" style={{ opacity: 1 - i * 0.25 }}>
              <span className="skeleton size-10 shrink-0 rounded-xl" />
              <span className="flex flex-1 flex-col gap-2 pt-0.5">
                <span className="skeleton h-3.5 w-2/5" />
                <span className="skeleton h-3.5 w-4/5" />
                <span className="skeleton h-3 w-3/5" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <EmptyState
        live
        art={<WaitingIllustration />}
        title={copy.inbox.waitingTitle}
        body={copy.inbox.waitingBody}
        action={
          <button type="button" onClick={props.onRetry} disabled={props.refreshing} className={button({ variant: "secondary" }, "disabled:opacity-80")}>
            <RefreshCw className={cx("size-4", props.refreshing && "animate-spin")} aria-hidden="true" />
            {props.refreshing ? copy.inbox.status.checking : copy.inbox.refresh}
          </button>
        }
        footnote={
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
              <span className="relative size-1.5 rounded-full bg-success" />
            </span>
            {copy.inbox.autoRefresh}
          </span>
        }
      />
    );
  }

  if (state === "offline") {
    return <EmptyState art={<ProblemIllustration tone="warning" className="h-20" />} title={copy.inbox.offlineTitle} body={copy.inbox.offlineBody} />;
  }

  if (state === "unavailable") {
    return (
      <EmptyState
        art={<ProblemIllustration tone="warning" className="h-20" />}
        title={copy.inbox.unavailableTitle}
        body={copy.inbox.unavailableBody}
        action={
          <button type="button" onClick={props.onChangeEmail} className={button({ variant: "secondary" })}>
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            {copy.inbox.changeEmail}
          </button>
        }
      />
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        art={<ProblemIllustration className="h-20" />}
        title={copy.inbox.errorTitle}
        body={props.errorText}
        action={
          <button type="button" onClick={props.onRetry} className={button({ variant: "secondary" })}>
            <RotateCw className="size-4" aria-hidden="true" />
            {copy.inbox.retry}
          </button>
        }
      />
    );
  }

  return (
    <ul aria-label={copy.inbox.listLabel} className="animate-fade-in">
      {props.messages.map((m) => (
        <MessageRow
          key={m.id}
          message={m}
          now={props.now}
          unread={!props.readIds.has(m.id)}
          fresh={props.freshIds.has(m.id)}
          removing={props.removingIds.has(m.id)}
          selected={m.id === props.selectedId}
          onOpen={props.onOpen}
        />
      ))}
    </ul>
  );
}

function EmptyState({
  art,
  title,
  body,
  action,
  footnote,
  live,
}: {
  art: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  footnote?: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div role={live ? "status" : undefined} className="flex animate-fade-in flex-col items-center justify-center gap-3 px-6 py-14 text-center sm:py-20">
      {art}
      <p className="mt-2 text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
      {footnote && <p className="text-xs text-muted">{footnote}</p>}
    </div>
  );
}

/** Logo for a known service, otherwise the sender's initials. */
export function SenderMark({ message, size = "md" }: { message: TMailMessage; size?: "md" | "lg" }) {
  const service = detectService(message.senderEmail);
  if (service) return <ServiceLogo service={service} size={size} />;
  const sender = message.senderName || message.senderEmail || copy.inbox.unknownSender;
  return <Avatar name={sender} seed={message.senderEmail || sender} size={size} />;
}

const MessageRow = memo(function MessageRow({
  message: m,
  now,
  unread,
  fresh,
  removing,
  selected,
  onOpen,
}: {
  message: TMailMessage;
  now: number;
  unread: boolean;
  fresh: boolean;
  removing: boolean;
  selected: boolean;
  onOpen: (id: string) => void;
}) {
  const sender = m.senderName || m.senderEmail || copy.inbox.unknownSender;
  const preview = useMemo(() => previewText(m.id, m.content), [m.id, m.content]);
  const code = useMemo(() => detectCode(m.id, m.subject, m.content), [m.id, m.subject, m.content]);

  return (
    <li
      className={cx(
        "grid transition-[grid-template-rows,opacity,translate] duration-200 ease-out",
        removing ? "grid-rows-[0fr] -translate-x-3 opacity-0" : "grid-rows-[1fr]",
      )}
    >
      <div className={cx("overflow-hidden", fresh && "animate-rise-in")}>
        <div
          className={cx(
            "relative border-b border-line/70 transition-colors duration-150",
            selected ? "bg-accent-soft" : "hover:bg-surface-2",
            fresh && !selected && "animate-fresh",
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              "absolute inset-y-2 left-0 w-[3px] origin-left rounded-r-full bg-accent transition-transform duration-200",
              selected ? "scale-x-100" : "scale-x-0",
            )}
          />
          <button
            type="button"
            data-message-id={m.id}
            onClick={() => onOpen(m.id)}
            aria-current={selected || undefined}
            className={cx("flex w-full cursor-pointer gap-3 px-4 pt-3.5 text-left sm:px-5", code ? "pb-2" : "pb-3.5")}
          >
            <span className="relative">
              <SenderMark message={m} />
              <span
                aria-hidden="true"
                className={cx(
                  "absolute -right-1 -top-1 size-3 rounded-full bg-accent ring-2 ring-surface transition-transform duration-200",
                  unread ? "scale-100" : "scale-0",
                )}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className={cx("truncate text-sm", unread ? "font-semibold text-ink" : "font-medium text-ink-2")}>{sender}</span>
                <time
                  dateTime={m.receivedAt ? new Date(m.receivedAt).toISOString() : undefined}
                  title={m.receivedAt ? fullTime(m.receivedAt) : m.date}
                  className={cx("ml-auto shrink-0 text-xs tabular-nums", unread ? "font-semibold text-accent" : "text-muted")}
                >
                  {m.receivedAt ? relativeTime(m.receivedAt, now, copy.time.justNow) : m.date}
                </time>
              </span>
              <span className={cx("mt-0.5 block truncate text-sm", unread ? "font-medium text-ink" : "text-ink-2")}>
                {m.subject || copy.inbox.noSubject}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                <span className="truncate">{preview || copy.inbox.noPreview}</span>
                {m.attachments.length > 0 && (
                  <span className="ml-auto flex shrink-0 items-center">
                    <Paperclip className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">{copy.inbox.hasAttachments}</span>
                  </span>
                )}
              </span>
              {unread && <span className="sr-only">{copy.inbox.unreadLabel}</span>}
            </span>
          </button>

          {code && (
            <div className="flex flex-wrap items-center gap-2 pb-3.5 pl-[68px] pr-4 sm:pl-[72px] sm:pr-5">
              <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-surface px-2.5 ring-1 ring-line">
                <KeyRound className="size-3.5 text-accent" aria-hidden="true" />
                <span className="text-xs font-medium text-muted">{copy.inbox.codeLabel}</span>
                <span className="font-mono text-[15px] font-semibold tracking-wider text-ink">{formatCode(code)}</span>
              </span>
              <CopyButton
                variant="soft"
                value={code}
                label={copy.code.copyShort}
                copiedLabel={copy.code.copied}
                toastTitle={copy.code.copiedToast}
                ariaLabel={fmt(copy.code.copyAria, { code })}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
});
