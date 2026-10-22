"use client";

// The page language. Order: ?lang= in the URL (so the seller can send a link in either
// language), then the customer's last choice, then Thai. The browser language is ignored
// on purpose: the server renders Thai, and switching after hydration flashes the page and
// pushes back Largest Contentful Paint.
import { useSyncExternalStore } from "react";

import { COPY, type Copy, type Lang } from "./copy";
import { loadString, saveString } from "./storage";

const EVENT = "tmail:lang";
const STORAGE_LANG = "tmail:lang";
export const DEFAULT_LANG: Lang = "th";

function isLang(value: string | null | undefined): value is Lang {
  return value === "th" || value === "en";
}

function readLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  const saved = loadString(STORAGE_LANG);
  return isLang(saved) ? saved : DEFAULT_LANG;
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => DEFAULT_LANG);
}

/** Strings for the current language. */
export function useCopy(): Copy {
  return COPY[useLang()];
}

/** Remembers the choice and writes it into the URL, so a copied link opens in the same language. */
export function setLang(lang: Lang) {
  saveString(STORAGE_LANG, lang);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(EVENT));
}
