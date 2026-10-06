"use client";

import { ArrowRight, CircleAlert, History, Mail, ShieldCheck, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { errorText, getDomains, getMessages } from "@/lib/api";
import { copy } from "@/lib/copy";
import { cx } from "@/lib/cx";
import { isEmail, normalizeEmail } from "@/lib/route";
import { SERVICES } from "@/lib/services";
import { loadString, saveString } from "@/lib/storage";
import type { TMailMessage } from "@/lib/tmail/types";

import { button } from "./ui/button";
import { HeroIllustration, Spinner } from "./ui/graphics";
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

export function Landing({ onAccess }: { onAccess: (email: string, messages: TMailMessage[]) => void }) {
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
    if (!email) return fail(copy.landing.errors.empty);
    if (!isEmail(email)) return fail(copy.landing.errors.invalid);

    setError(null);
    setSubmitting(true);
    try {
      const domains = await (domainsRef.current ?? Promise.resolve(null));
      if (domains && !domains.includes(email.split("@")[1])) {
        setSubmitting(false);
        return fail(copy.landing.errors.unsupported);
      }
      const messages = await getMessages(email);
      saveString(LAST_EMAIL, email);
      onAccess(email, messages);
    } catch (err) {
      setSubmitting(false);
      fail(errorText(err));
    }
  }

  const showContinue = !!lastEmail && !submitting && normalizeEmail(value) !== lastEmail;

  return (
    <div className="relative mx-auto flex w-full max-w-xl animate-screen-in flex-col items-center px-4 pb-16 pt-4 text-center sm:pt-10">
      <HeroIllustration className="h-36 w-auto sm:h-44" />

      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
        <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
        {copy.landing.eyebrow}
      </p>
      <h1 className="mt-4 text-[30px] font-semibold leading-tight tracking-tight text-balance sm:text-[42px]">
        {copy.landing.title}
      </h1>
      <p className="mt-2 text-[15px] text-muted text-pretty sm:text-base">{copy.landing.subtitle}</p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          access(value);
        }}
        className="relative mt-8 w-full overflow-hidden rounded-[28px] border border-line bg-surface/85 p-4 text-left shadow-card backdrop-blur-xl sm:p-5"
      >
        {submitting && (
          <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden="true">
            <span className="block h-full w-1/3 animate-progress rounded-full bg-gradient-to-r from-accent to-sky" />
          </span>
        )}

        <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
          {copy.landing.label}
        </label>
        <div
          onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}
          className={cx(
            "glow-field flex items-center rounded-2xl border bg-surface-2 transition-[border-color,background-color,box-shadow] duration-200",
            "focus-within:border-transparent focus-within:bg-surface focus-within:shadow-[0_0_0_4px_var(--accent-soft)]",
            error ? "border-danger" : "border-line",
            shaking && "animate-shake",
          )}
        >
          <Mail className={cx("ml-4 size-5 shrink-0 transition-colors", error ? "text-danger" : "text-muted")} aria-hidden="true" />
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
            placeholder={copy.landing.placeholder}
            value={value}
            disabled={submitting}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={helpId}
            className="h-14 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted disabled:opacity-70 sm:text-[17px]"
          />
          {value && !submitting && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setError(null);
                inputRef.current?.focus();
              }}
              aria-label={copy.landing.clear}
              className="mr-2 flex size-9 shrink-0 animate-pop-in cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div id={helpId} className="mt-2 min-h-5 text-sm">
          {error ? (
            <p role="alert" className="flex items-start gap-1.5 text-danger">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : (
            <p className="text-muted">{copy.landing.hint}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={button({ variant: "primary", size: "lg" }, "group mt-4 h-14 w-full text-base disabled:opacity-90")}
        >
          {submitting ? (
            <>
              <Spinner className="size-5" />
              {copy.landing.submitting}
            </>
          ) : (
            <>
              {copy.landing.submit}
              <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>

        {showContinue && (
          <button
            type="button"
            onClick={() => {
              setValue(lastEmail);
              access(lastEmail);
            }}
            className="mt-3 flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <History className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {copy.landing.continueWith.split("{email}")[0]}
              <span className="font-mono text-ink">{lastEmail}</span>
            </span>
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {submitting ? copy.landing.submitting : ""}
        </span>
      </form>

      <section aria-labelledby={servicesId} className="mt-10 w-full">
        <h2 id={servicesId} className="text-xs font-semibold uppercase tracking-wider text-muted">
          {copy.landing.servicesTitle}
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {SERVICES.map((service) => (
            <li
              key={service.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface/70 px-2 py-4 backdrop-blur"
            >
              <ServiceLogo service={service} />
              <span className="text-sm font-medium">{service.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{copy.landing.servicesCaption}</p>
      </section>
    </div>
  );
}

