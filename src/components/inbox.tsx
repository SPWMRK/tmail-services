"use client";

import { ArrowLeftRight, CircleAlert, Inbox, Paperclip, RefreshCw, RotateCw, WifiOff, type LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";

import { fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { clockTime, fullTime, relativeTime } from "@/lib/format";
import { useCopy } from "@/lib/lang";
import { previewText } from "@/lib/preview";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { Avatar } from "./ui/avatar";
import { button } from "./ui/button";
import { ServiceLogo } from "./ui/service-logo";

// --- Panel toolbar ------------------------------------------------------------------

export function MessagesToolbar({
  titleId,
  count,
  unread,
  lastChecked,
  refreshing,
  paused,
  onRefresh,
}: {
  titleId: string;
  count: number;
  unread: number;
  lastChecked: number;
  refreshing: boolean;
  paused: boolean;
  onRefresh: () => void;
}) {
  const t = useCopy();
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
      <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold">
        {t.inbox.messages}
        {count > 0 && <span className="font-medium tabular-nums text-muted">{count}</span>}
        {unread > 0 && (
          <span key={unread} className="animate-pop-in rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium tabular-nums text-accent">
            {fmt(t.inbox.unread, { n: unread })}
          </span>
        )}
      </h2>
      <p
        className="ml-auto hidden text-xs text-muted min-[420px]:block"
        title={lastChecked ? fmt(t.inbox.lastChecked, { time: clockTime(lastChecked, t.locale) }) : undefined}
      >
        {paused ? t.inbox.offlineTitle : refreshing ? t.inbox.status.checking : t.inbox.autoRefresh}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={paused}
        aria-label={t.inbox.refreshAria}
        className={button({ variant: "secondary", size: "sm" }, "max-[419px]:ml-auto")}
      >
        <RefreshCw className={cx("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
        {t.inbox.refresh}
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
  now: number;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onChangeEmail: () => void;
}

/** The message list, or the loading / empty / error state that replaces it. */
export function InboxList(props: ListProps) {
  const { state } = props;
  const t = useCopy();

  if (state === "loading") {
    return (
      <div aria-busy="true">
        <p className="sr-only" role="status">
          {t.inbox.loading}
        </p>
        <ul aria-label={t.inbox.listLabel}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-3 border-b border-line px-4 py-3.5 sm:px-5" style={{ opacity: 1 - i * 0.25 }}>
              <span className="skeleton size-10 shrink-0 rounded-lg" />
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
        icon={Inbox}
        tone="accent"
        title={t.inbox.waitingTitle}
        body={t.inbox.waitingBody}
      />
    );
  }

  if (state === "offline") {
    return <EmptyState icon={WifiOff} tone="warning" title={t.inbox.offlineTitle} body={t.inbox.offlineBody} />;
  }

  if (state === "unavailable") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="warning"
        title={t.inbox.unavailableTitle}
        body={t.inbox.unavailableBody}
        action={
          <button type="button" onClick={props.onChangeEmail} className={button({ variant: "secondary" })}>
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            {t.inbox.changeEmail}
          </button>
        }
      />
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="danger"
        title={t.inbox.errorTitle}
        body={props.errorText}
        action={
          <button type="button" onClick={props.onRetry} className={button({ variant: "secondary" })}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t.inbox.retry}
          </button>
        }
      />
    );
  }

  return (
    <ul aria-label={t.inbox.listLabel} className="animate-fade-in">
      {props.messages.map((m) => (
        <MessageRow
          key={m.id}
          message={m}
          now={props.now}
          unread={!props.readIds.has(m.id)}
          fresh={props.freshIds.has(m.id)}
          selected={m.id === props.selectedId}
          onOpen={props.onOpen}
        />
      ))}
    </ul>
  );
}

type Tone = "accent" | "warning" | "danger" | "muted";

const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  muted: "bg-surface-2 text-muted",
};

/** Icon in a tinted circle for the empty, error, and "pick an email" states. */
export function StateIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={cx("flex size-12 items-center justify-center rounded-full", TONE[tone])} aria-hidden="true">
      <Icon className="size-5" />
    </span>
  );
}

function EmptyState({
  icon,
  tone,
  title,
  body,
  action,
  live,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div role={live ? "status" : undefined} className="flex animate-fade-in flex-col items-center justify-center gap-2 px-6 py-16 text-center sm:py-20">
      <StateIcon icon={icon} tone={tone} />
      <p className="mt-2 font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted text-balance">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Logo for a known service, otherwise the sender's initials. */
export function SenderMark({ message, size = "md" }: { message: TMailMessage; size?: "md" | "lg" }) {
  const service = detectService(message.senderEmail);
  const t = useCopy();
  if (service) return <ServiceLogo service={service} size={size} />;
  const sender = message.senderName || message.senderEmail || t.inbox.unknownSender;
  return <Avatar name={sender} seed={message.senderEmail || sender} size={size} />;
}

const MessageRow = memo(function MessageRow({
  message: m,
  now,
  unread,
  fresh,
  selected,
  onOpen,
}: {
  message: TMailMessage;
  now: number;
  unread: boolean;
  fresh: boolean;
  selected: boolean;
  onOpen: (id: string) => void;
}) {
  const t = useCopy();
  const sender = m.senderName || m.senderEmail || t.inbox.unknownSender;
  const preview = useMemo(() => previewText(m.id, m.content), [m.id, m.content]);

  return (
    <li className={cx(fresh && "animate-rise-in")}>
      <div
        className={cx(
          "relative border-b border-line transition-colors duration-150",
          selected ? "bg-accent-soft" : "hover:bg-surface-2",
          fresh && !selected && "animate-fresh",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "absolute inset-y-0 left-0 w-0.5 origin-left bg-accent transition-transform duration-200",
            selected ? "scale-x-100" : "scale-x-0",
          )}
        />
        <button
          type="button"
          data-message-id={m.id}
          onClick={() => onOpen(m.id)}
          aria-current={selected || undefined}
          className="flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <span className="relative">
            <SenderMark message={m} />
            <span
              aria-hidden="true"
              className={cx(
                "absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-surface transition-transform duration-200",
                unread ? "scale-100" : "scale-0",
              )}
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className={cx("truncate text-sm", unread ? "font-semibold text-ink" : "font-medium text-ink-2")}>{sender}</span>
              <time
                dateTime={m.receivedAt ? new Date(m.receivedAt).toISOString() : undefined}
                title={m.receivedAt ? fullTime(m.receivedAt, t.locale) : m.date}
                className={cx("ml-auto shrink-0 text-xs tabular-nums", unread ? "font-semibold text-accent" : "text-muted")}
              >
                {m.receivedAt ? relativeTime(m.receivedAt, now, t.locale, t.time.justNow) : m.date}
              </time>
            </span>
            <span className={cx("mt-0.5 block truncate text-sm", unread ? "font-medium text-ink" : "text-ink-2")}>{m.subject || t.inbox.noSubject}</span>
            <span className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
              <span className="truncate">{preview || t.inbox.noPreview}</span>
              {m.attachments.length > 0 && (
                <span className="ml-auto flex shrink-0 items-center">
                  <Paperclip className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{t.inbox.hasAttachments}</span>
                </span>
              )}
            </span>
            {unread && <span className="sr-only">{t.inbox.unreadLabel}</span>}
          </span>
        </button>
      </div>
    </li>
  );
});
