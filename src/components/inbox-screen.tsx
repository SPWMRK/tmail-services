"use client";

import { ArrowLeftRight, CircleAlert, RotateCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/use-environment";
import { useInbox } from "@/hooks/use-inbox";
import { errorText } from "@/lib/api";
import { type Copy, fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { useCopy } from "@/lib/lang";
import { goToLanding } from "@/lib/route";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { InboxList, MessagesToolbar, type ListState } from "./inbox";
import { MessageView } from "./message-view";
import { button } from "./ui/button";
import { CopyButton } from "./ui/copy-button";
import { toast } from "./ui/toast";

type Connection = "live" | "checking" | "offline" | "reconnecting";

const CONNECTION_DOT: Record<Connection, string> = {
  live: "bg-success",
  checking: "bg-accent",
  offline: "bg-warning",
  reconnecting: "bg-danger",
};

function announceNewMail(incoming: TMailMessage[], t: Copy) {
  if (incoming.length > 1) {
    toast("mail", fmt(t.inbox.newEmails, { n: incoming.length }));
    return;
  }
  const m = incoming[0];
  const from = detectService(m.senderEmail)?.name ?? (m.senderName || m.senderEmail || t.inbox.unknownSender);
  toast("mail", t.inbox.newEmail, `${from} · ${m.subject || t.inbox.noSubject}`);
}

/** One open inbox: address card on top, then the message list and the reader. */
export function InboxScreen({ email, initialMessages }: { email: string; initialMessages?: TMailMessage[] }) {
  const t = useCopy();
  const inbox = useInbox(email, { initialMessages, onNewMail: (incoming) => announceNewMail(incoming, t) });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const messagesTitleId = useId();

  // --- Selection + browser history (Back closes the email instead of leaving the inbox) ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<TMailMessage | null>(null);
  const pushedRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const messagesRef = useRef(inbox.messages);
  useEffect(() => {
    selectedRef.current = selectedId;
    messagesRef.current = inbox.messages;
  });
  const { setRead } = inbox;

  const restoreFocus = useCallback((id: string | null) => {
    if (!id) return;
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    });
  }, []);

  const openMessage = useCallback(
    (id: string) => {
      if (!pushedRef.current) {
        window.history.pushState({ tmailReader: true }, "");
        pushedRef.current = true;
      }
      setSelectedId(id);
      setLastOpened(messagesRef.current.find((m) => m.id === id) ?? null);
      setRead(id, true);
    },
    [setRead],
  );

  const closeMessage = useCallback(() => {
    if (pushedRef.current) {
      window.history.back(); // popstate below finishes the close
    } else {
      const id = selectedRef.current;
      setSelectedId(null);
      restoreFocus(id);
    }
  }, [restoreFocus]);

  useEffect(() => {
    const onPop = () => {
      if (!pushedRef.current) return;
      pushedRef.current = false;
      const id = selectedRef.current;
      setSelectedId(null);
      restoreFocus(id);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [restoreFocus]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) closeMessage();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, closeMessage]);

  // Lock page scroll behind the full-screen reader on small screens.
  const sheetOpen = !!selectedId && !isDesktop;
  useEffect(() => {
    if (!sheetOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [sheetOpen]);

  // Unread count in the tab title.
  const unread = inbox.messages.filter((m) => !inbox.readIds.has(m.id)).length;
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${t.meta.inboxTitle}` : t.meta.inboxTitle;
  }, [unread, t]);

  // --- Derived view state ---
  const selected = selectedId ? (inbox.messages.find((m) => m.id === selectedId) ?? null) : null;
  const gone = !!selectedId && !selected && inbox.status === "ready";

  const listState: ListState =
    !inbox.online && inbox.status !== "ready"
      ? "offline"
      : inbox.status === "ready"
        ? inbox.messages.length > 0
          ? "list"
          : "empty"
        : inbox.status;
  const hasList = listState === "list";

  const connection: Connection = !inbox.online ? "offline" : inbox.pollError ? "reconnecting" : inbox.refreshing ? "checking" : "live";
  const banner = inbox.status === "ready" ? (!inbox.online ? "offline" : inbox.pollError ? "reconnecting" : null) : null;

  return (
    <div className="mx-auto w-full max-w-6xl animate-screen-in px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      {/* Address card: which inbox this is, connection state, copy / change */}
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-3">
          <p className="eyebrow">{t.inbox.title}</p>
          <p role="status" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
            <span className={cx("size-1.5 rounded-full", CONNECTION_DOT[connection])} aria-hidden="true" />
            {t.inbox.status[connection]}
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="min-w-0 flex-1 select-all font-mono text-lg font-medium [overflow-wrap:anywhere] sm:text-xl">{email}</h1>
          <div className="flex gap-2">
            <CopyButton value={email} label={t.inbox.copyEmail} copiedLabel={t.inbox.emailCopied} toastTitle={t.inbox.emailCopied} className="flex-1 sm:flex-none" />
            <button type="button" onClick={goToLanding} className={button({ variant: "ghost" }, "flex-1 sm:flex-none")}>
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              {t.inbox.changeEmail}
            </button>
          </div>
        </div>
      </section>

      {/* Messages */}
      <section aria-labelledby={messagesTitleId} className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <MessagesToolbar
          titleId={messagesTitleId}
          count={inbox.messages.length}
          unread={unread}
          lastChecked={inbox.lastChecked}
          refreshing={inbox.refreshing}
          paused={!inbox.online}
          onRefresh={inbox.refresh}
        />

        {banner && (
          <div
            role="status"
            className={cx(
              "flex animate-fade-in items-center gap-3 border-b border-line px-4 py-2.5 text-sm sm:px-5",
              banner === "offline" ? "bg-warning-soft" : "bg-danger-soft",
            )}
          >
            {banner === "offline" ? (
              <WifiOff className="size-4 shrink-0 text-warning" aria-hidden="true" />
            ) : (
              <CircleAlert className="size-4 shrink-0 text-danger" aria-hidden="true" />
            )}
            <p className="min-w-0 flex-1">
              <span className="font-medium">{banner === "offline" ? t.inbox.offlineTitle : t.inbox.status.reconnecting}</span>{" "}
              <span className="text-muted">{banner === "offline" ? t.inbox.offlineBody : errorText(inbox.pollError, t)}</span>
            </p>
            {banner === "reconnecting" && (
              <button type="button" onClick={inbox.refresh} className={button({ variant: "ghost", size: "sm" }, "-my-1 shrink-0")}>
                <RotateCw className="size-3.5" aria-hidden="true" />
                {t.inbox.retry}
              </button>
            )}
          </div>
        )}

        {/* Two panes only when there is something to read; other states use the full width. */}
        <div className={cx(hasList && "lg:grid lg:h-[min(46rem,calc(100dvh-6rem))] lg:grid-cols-[minmax(320px,400px)_1fr]")}>
          <div className={cx(hasList ? "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:border-line" : "min-h-80")}>
            <InboxList
              state={listState}
              errorText={errorText(inbox.pollError, t)}
              messages={inbox.messages}
              selectedId={selectedId}
              readIds={inbox.readIds}
              freshIds={inbox.freshIds}
              now={inbox.lastChecked}
              onOpen={openMessage}
              onRetry={inbox.refresh}
              onChangeEmail={goToLanding}
            />
          </div>
          <MessageView
            className={cx(!hasList && "lg:hidden")}
            open={!!selectedId}
            message={selected ?? (selectedId ? null : lastOpened)}
            gone={gone}
            address={email}
            now={inbox.lastChecked}
            onClose={closeMessage}
          />
        </div>
      </section>
    </div>
  );
}
