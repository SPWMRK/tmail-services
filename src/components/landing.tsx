"use client";

import { ArrowRight, CircleAlert, History, Mail, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { errorText, getDomains, getMessages } from "@/lib/api";
import { fmt } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { useCopy } from "@/lib/lang";
import { isEmail, normalizeEmail } from "@/lib/route";
import { SERVICES } from "@/lib/services";
import { loadString, saveString } from "@/lib/storage";
import type { TMailMessage } from "@/lib/tmail/types";

import { button } from "./ui/button";
import { Spinner } from "./ui/graphics";
import { ServiceLogo } from "./ui/service-logo";

const LAST_EMAIL = "tmail:last-email";

function useLastEmail(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      return () => window.removeEventListener("storage", onChange);
    },
    () => loadString(LAST_EMAIL),
    () => null,
  );
}

/**
 * Home: headline and supported services on the left, the email form on the right.
 * Phones stack it as headline, form, services. On success the form hands the fetched
 * messages to the inbox so the inbox opens filled.
 */
export function Landing({ onAccess }: { onAccess: (email: string, messages: TMailMessage[]) => void }) {
  const t = useCopy();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const domainsRef = useRef<Promise<string[] | null> | null>(null);
  const lastEmail = useLastEmail();
  const inputId = useId();
  const helpId = useId();
  const servicesId = useId();

  // Fetch the accepted domains up front so submitting feels instant.
  useEffect(() => {
    domainsRef.current = getDomains()
      .then((info) => info.domains)
      .catch(() => null); // unknown → skip the domain check rather than block access
  }, []);

  function fail(message: string) {
    setError(message);
    setShaking(true);
    inputRef.current?.focus();
  }

  async function access(raw: string) {
    const email = normalizeEmail(raw);
    if (!email) return fail(t.landing.errors.empty);
    if (!isEmail(email)) return fail(t.landing.errors.invalid);

    setError(null);
    setSubmitting(true);
    try {
      const domains = await (domainsRef.current ?? Promise.resolve(null));
      if (domains && !domains.includes(email.split("@")[1])) {
        setSubmitting(false);
        return fail(t.landing.errors.unsupported);
      }
      const messages = await getMessages(email);
      saveString(LAST_EMAIL, email);
      onAccess(email, messages);
    } catch (err) {
      setSubmitting(false);
      fail(errorText(err, t));
    }
  }

  const showRecent = !!lastEmail && normalizeEmail(value) !== lastEmail;

  return (
    <div
      className={cx(
        "mx-auto grid w-full max-w-6xl animate-screen-in gap-8 px-4 pb-16 pt-10 sm:px-6",
        "lg:my-auto lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-16 lg:gap-y-10 lg:py-16",
      )}
    >
      <div className="lg:self-end">
        <p className="eyebrow text-accent">{t.landing.eyebrow}</p>
        <h1 className="mt-3 max-w-xl text-[34px] font-semibold leading-[1.15] tracking-tight text-balance sm:text-5xl lg:text-[56px]">
          {t.landing.title}
        </h1>
        <p className="mt-4 max-w-md text-base text-muted text-pretty sm:text-lg">{t.landing.subtitle}</p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          access(value);
        }}
        className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
      >
        <label htmlFor={inputId} className="mb-2 block text-[15px] font-medium">
          {t.landing.label}
        </label>
        <div
          onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}
          className={cx(
            "flex items-center rounded-xl border bg-surface transition-[border-color,box-shadow] duration-150",
            "focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft",
            error ? "border-danger" : "border-line-strong",
            shaking && "animate-shake",
          )}
        >
          <Mail className={cx("ml-4 size-5 shrink-0", error ? "text-danger" : "text-muted")} aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder={t.landing.placeholder}
            value={value}
            disabled={submitting}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={helpId}
            className="h-[52px] min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted disabled:opacity-70 sm:text-[17px]"
          />
          {value && !submitting && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setError(null);
                inputRef.current?.focus();
              }}
              aria-label={t.landing.clear}
              className="mr-1.5 flex size-10 shrink-0 animate-pop-in cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div id={helpId} className="mt-2 min-h-6 text-sm">
          {error ? (
            <p role="alert" className="flex items-start gap-1.5 text-danger">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : (
            <p className="text-muted">{t.landing.hint}</p>
          )}
        </div>

        <button type="submit" disabled={submitting} className={button({ variant: "primary", size: "lg" }, "group mt-4 h-[52px] w-full disabled:opacity-90")}>
          {submitting ? (
            <>
              <Spinner className="size-5" />
              {t.landing.submitting}
            </>
          ) : (
            <>
              {t.landing.submit}
              <ArrowRight className="size-[18px] transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>

        {showRecent && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="eyebrow">{t.landing.recent}</p>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setValue(lastEmail);
                access(lastEmail);
              }}
              aria-label={fmt(t.landing.continueWith, { email: lastEmail })}
              className={cx(
                "group mt-2 flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left",
                "transition-colors hover:border-accent-line hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <History className="size-[18px] shrink-0 text-muted group-hover:text-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-mono text-[15px]">{lastEmail}</span>
              <ArrowRight className="size-4 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
            </button>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {submitting ? t.landing.submitting : ""}
        </span>
      </form>

      <section aria-labelledby={servicesId} className="lg:self-start">
        <h2 id={servicesId} className="eyebrow">
          {t.landing.servicesTitle}
        </h2>
        {/* Phones: equal tiles in a 3-column grid (logo over name). Wider screens: chips that wrap. */}
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {SERVICES.map((service) => (
            <li
              key={service.id}
              className={cx(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3",
                "sm:flex-row sm:gap-2.5 sm:py-1.5 sm:pl-1.5 sm:pr-3.5",
              )}
            >
              <ServiceLogo service={service} size="sm" />
              <span className="max-w-full truncate text-[13px] font-medium sm:text-[15px]">{service.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-md text-sm text-muted">{t.landing.servicesCaption}</p>
      </section>
    </div>
  );
}
