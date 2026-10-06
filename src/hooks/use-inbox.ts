"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, getMessages, removeMessage } from "@/lib/api";
import { detectService } from "@/lib/services";
import { loadStringList, saveStringList } from "@/lib/storage";
import type { TMailMessage } from "@/lib/tmail/types";

import { useOnline } from "./use-environment";

export const POLL_MS = 10_000;
const RATE_LIMITED_POLL_MS = 30_000;
const FRESH_MS = 6_000;
export const REMOVE_ANIMATION_MS = 220;
const MAX_READ_IDS = 500;
const STORAGE_READ = "tmail:read";

/** loading: first fetch · ready: have data · error: first fetch failed · unavailable: server rejected this inbox */
export type InboxStatus = "loading" | "ready" | "error" | "unavailable";

function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError("Unexpected error", "UNKNOWN", 0);
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** The inbox only shows mail from supported services (iQIYI, WeTV, Disney+); other senders are ignored. */
function supportedOnly(list: TMailMessage[]): TMailMessage[] {
  return list.filter((m) => detectService(m.senderEmail) !== null);
}

function withAdded(set: Set<string>, ids: string[]): Set<string> {
  const next = new Set(set);
  ids.forEach((id) => next.add(id));
  return next;
}

function withRemoved(set: Set<string>, ids: string[]): Set<string> {
  const next = new Set(set);
  ids.forEach((id) => next.delete(id));
  return next;
}

interface Options {
  /** Messages already fetched while accessing the inbox, shown instantly while the first poll runs. */
  initialMessages?: TMailMessage[];
  /** Called with messages that arrive while the inbox is open. */
  onNewMail?: (messages: TMailMessage[]) => void;
}

/**
 * State and behavior of one inbox: polling, read/unread, delete.
 * The caller keys this by email, so switching inboxes starts fresh.
 */
export function useInbox(email: string, { initialMessages, onNewMail }: Options = {}) {
  const online = useOnline();

  const [messages, setMessages] = useState<TMailMessage[]>(() => supportedOnly(initialMessages ?? []));
  const [status, setStatus] = useState<InboxStatus>(() => (initialMessages ? "ready" : "loading"));
  const [pollError, setPollError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(0);
  // Bumping this restarts the polling loop, i.e. "check now".
  const [pollNonce, setPollNonce] = useState(0);

  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(loadStringList(STORAGE_READ)));
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());

  // Ids already seen; null until the first successful fetch.
  const knownIdsRef = useRef<Set<string> | null>(
    initialMessages ? new Set(supportedOnly(initialMessages).map((m) => m.id)) : null,
  );
  const onNewMailRef = useRef(onNewMail);
  useEffect(() => {
    onNewMailRef.current = onNewMail;
  });

  // Poll while the tab is visible and the browser is online.
  useEffect(() => {
    if (!online) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function tick() {
      if (stopped) return;
      let delay = POLL_MS;
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        setRefreshing(true);
        try {
          const list = supportedOnly(await getMessages(email, controller.signal));
          if (stopped) return;

          const known = knownIdsRef.current;
          if (known) {
            const incoming = list.filter((m) => !known.has(m.id));
            if (incoming.length > 0) {
              const ids = incoming.map((m) => m.id);
              ids.forEach((id) => known.add(id));
              setFreshIds((prev) => withAdded(prev, ids));
              setTimeout(() => setFreshIds((prev) => withRemoved(prev, ids)), FRESH_MS);
              onNewMailRef.current?.(incoming);
            }
          } else {
            knownIdsRef.current = new Set(list.map((m) => m.id));
          }

          setMessages(list);
          setStatus("ready");
          setPollError(null);
        } catch (err) {
          if (stopped || isAbort(err)) return;
          const apiErr = toApiError(err);
          if (apiErr.code === "RATE_LIMITED") delay = RATE_LIMITED_POLL_MS;
          setPollError(apiErr);
          const rejected = apiErr.code === "INVALID_INPUT" || apiErr.code === "NOT_FOUND";
          setStatus((s) => (s === "ready" ? s : rejected ? "unavailable" : "error"));
        }
        setRefreshing(false);
        setLastChecked(Date.now());
      }
      timer = setTimeout(tick, delay);
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      controller?.abort();
      timer = setTimeout(tick, 0);
    }

    timer = setTimeout(tick, 0);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
      setRefreshing(false);
    };
  }, [email, pollNonce, online]);

  const refresh = useCallback(() => setPollNonce((n) => n + 1), []);

  const setRead = useCallback((id: string, read: boolean) => {
    setReadIds((prev) => {
      if (prev.has(id) === read) return prev;
      const next = read ? withAdded(prev, [id]) : withRemoved(prev, [id]);
      saveStringList(STORAGE_READ, [...next].slice(-MAX_READ_IDS));
      return next;
    });
  }, []);

  /** Throws ApiError on failure (and resyncs the list). */
  const remove = useCallback(
    async (id: string) => {
      try {
        await removeMessage(id);
      } catch (err) {
        refresh();
        throw toApiError(err);
      }
      // Play the collapse animation, then drop the row.
      setRemovingIds((prev) => withAdded(prev, [id]));
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setRemovingIds((prev) => withRemoved(prev, [id]));
      }, REMOVE_ANIMATION_MS);
    },
    [refresh],
  );

  return {
    online,
    messages,
    status,
    pollError,
    refreshing,
    lastChecked,
    readIds,
    freshIds,
    removingIds,
    refresh,
    setRead,
    remove,
  };
}
