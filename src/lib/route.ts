"use client";

// The open inbox lives in the URL (?email=…) so refresh, bookmarks and the
// Back button all work. Components read it through useRouteEmail().
import { useSyncExternalStore } from "react";

const EVENT = "tmail:navigate";
const EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]{2,}$/;

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function readEmail(): string | null {
  const value = new URLSearchParams(window.location.search).get("email");
  if (!value) return null;
  const email = normalizeEmail(value);
  return isEmail(email) ? email : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Email of the open inbox, or null on the landing screen (and during SSR). */
export function useRouteEmail(): string | null {
  return useSyncExternalStore(subscribe, readEmail, () => null);
}

/** Keeps ?lang= when switching screens. */
function urlFor(email: string | null): string {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  const lang = new URLSearchParams(window.location.search).get("lang");
  if (lang) params.set("lang", lang);
  const query = params.toString();
  return query ? `?${query}` : window.location.pathname;
}

export function goToInbox(email: string) {
  window.history.pushState({}, "", urlFor(email));
  window.dispatchEvent(new Event(EVENT));
}

export function goToLanding() {
  window.history.pushState({}, "", urlFor(null));
  window.dispatchEvent(new Event(EVENT));
}
