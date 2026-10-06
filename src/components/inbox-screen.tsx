"use client";

import { ArrowLeftRight, CircleAlert, Inbox, Mail, RotateCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/use-environment";
import { useInbox } from "@/hooks/use-inbox";
import { errorText } from "@/lib/api";
import { copy, fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { detectCode, formatCode } from "@/lib/otp";
import { goToLanding } from "@/lib/route";
import { detectService } from "@/lib/services";
import type { TMailMessage } from "@/lib/tmail/types";

import { InboxList, MessagesToolbar, type ListState } from "./inbox";
import { MessageView } from "./message-view";
import { button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { CopyButton } from "./ui/copy-button";
import { toast } from "./ui/toast";

type Connection = "live" | "checking" | "offline" | "reconnecting";

const CONNECTION_DOT: Record<Connection, { color: string; ping: boolean }> = {
  live: { color: "bg-success", ping: true },
  checking: { color: "bg-accent", ping: true },
  offline: { color: "bg-warning", ping: false },
  reconnecting: { color: "bg-danger", ping: false },
};

function announceNewMail(incoming: TMailMessage[]) {
  if (incoming.length > 1) {
    toast("mail", fmt(copy.inbox.newEmails, { n: incoming.length }));
    return;
  }
  const m = incoming[0];
  const from = detectService(m.senderEmail)?.name ?? (m.senderName || m.senderEmail || copy.inbox.unknownSender);
  const code = detectCode(m.id, m.subject, m.content);
  if (code) toast("mail", copy.inbox.newCode, `${from} · ${formatCode(code)}`);
  else toast("mail", copy.inbox.newEmail, `${from} — ${m.subject || copy.inbox.noSubject}`);
}

export function InboxScreen({ email, initialMessages }: { email: string; initialMessages?: TMailMessage[] }) {
  const inbox = useInbox(email, { initialMessages, onNewMail: announceNewMail });
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

  // Esc closes the reader (dialogs handle their own Esc first).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("dialog[open]")) return;
      closeMessage();
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
    document.title = unread > 0 ? `(${unread}) ${copy.meta.inboxTitle}` : copy.meta.inboxTitle;
  }, [unread]);

  // --- Delete ---
  const [pendingDelete, setPendingDelete] = useState<TMailMessage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      await inbox.remove(id);
      if (selectedRef.current === id) closeMessage();
      toast("success", copy.toast.deleted);
    } catch {
      toast("error", copy.toast.deleteFailed);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

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
  const dot = CONNECTION_DOT[connection];

  return (
    <div className="mx-auto w-full max-w-6xl animate-screen-in px-4 pb-6 pt-6 sm:px-6 sm:pt-10">
      {/* Inbox header: which inbox this is, copy it, unread + connection */}
      <section className="rounded-[28px] border border-line bg-surface/85 p-4 shadow-card backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-sky text-white shadow-[0_8px_20px_-8px_var(--accent-glow)]">
            <Inbox className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {copy.inbox.title}
              {unread > 0 && (
                <span key={unread} className="animate-pop-in rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent-ink">
                  {fmt(copy.inbox.unread, { n: unread })}
                </span>
              )}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted" role="status">
              <span className="relative flex size-2">
                {dot.ping && <span className={cx("absolute inset-0 animate-ping rounded-full opacity-60", dot.color)} />}
                <span className={cx("relative size-2 rounded-full", dot.color)} />
              </span>
              {copy.inbox.status[connection]}
            </p>
          </div>
          <button type="button" onClick={goToLanding} className={button({ variant: "ghost", size: "sm" }, "ml-auto")}>
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">{copy.inbox.changeEmail}</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3">
            <Mail className="size-5 shrink-0 text-muted" aria-hidden="true" />
            <p className="min-w-0 select-all font-mono text-base font-medium [overflow-wrap:anywhere] sm:text-lg">{email}</p>
          </div>
          <CopyButton
            value={email}
            label={copy.inbox.copyEmail}
            copiedLabel={copy.inbox.emailCopied}
            toastTitle={copy.inbox.emailCopied}
            size="lg"
            className="sm:w-48"
          />
        </div>
      </section>

      {/* Messages */}
      <section aria-labelledby={messagesTitleId} className="mt-5 overflow-hidden rounded-[28px] border border-line bg-surface shadow-card sm:mt-6">
        <MessagesToolbar
          titleId={messagesTitleId}
          count={inbox.messages.length}
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
              <span className="font-medium">{banner === "offline" ? copy.inbox.offlineTitle : copy.inbox.status.reconnecting}</span>{" "}
              <span className="text-muted">{banner === "offline" ? copy.inbox.offlineBody : errorText(inbox.pollError)}</span>
            </p>
            {banner === "reconnecting" && (
              <button type="button" onClick={inbox.refresh} className={button({ variant: "ghost", size: "sm" }, "-my-1 shrink-0")}>
                <RotateCw className="size-3.5" aria-hidden="true" />
                {copy.inbox.retry}
              </button>
            )}
          </div>
        )}

        {/* Two panes only when there is something to read; other states use the full width. */}
        <div className={cx(hasList && "lg:grid lg:h-[min(46rem,calc(100dvh-6rem))] lg:grid-cols-[minmax(340px,420px)_1fr]")}>
          <div className={cx("min-h-80", hasList && "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:border-line")}>
            <InboxList
              state={listState}
              errorText={errorText(inbox.pollError)}
              messages={inbox.messages}
              selectedId={selectedId}
              readIds={inbox.readIds}
              freshIds={inbox.freshIds}
              removingIds={inbox.removingIds}
              now={inbox.lastChecked}
              refreshing={inbox.refreshing}
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
            onDelete={(message) => {
              setPendingDelete(message);
              setConfirmOpen(true);
            }}
          />
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={copy.dialog.deleteTitle}
        description={fmt(copy.dialog.deleteBody, { subject: pendingDelete?.subject || copy.inbox.noSubject })}
        confirmLabel={copy.dialog.deleteConfirm}
        cancelLabel={copy.dialog.cancel}
        busyLabel={copy.dialog.deleting}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
