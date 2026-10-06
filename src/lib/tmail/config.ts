import "server-only";

import { TMailError } from "./errors";

export interface TMailConfig {
  /** e.g. https://tmp.accinw.com — no trailing slash */
  baseUrl: string;
  /** Default domain for names typed without "@domain" */
  domain: string;
  apiKey: string;
  timeoutMs: number;
  /** Log successful requests too, not only failures */
  debug: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;

let cached: TMailConfig | undefined;

/**
 * Reads TMail settings from environment variables (see .env.example).
 * This is the only place that knows where the config comes from.
 */
export function getTMailConfig(): TMailConfig {
  if (cached) return cached;

  const baseUrl = required("TMAIL_BASE_URL").replace(/\/+$/, "");
  if (!/^https?:\/\/[^/]+/i.test(baseUrl)) {
    throw new TMailError("CONFIG", "TMAIL_BASE_URL must be an http(s) URL, e.g. https://tmp.accinw.com");
  }

  const domain = required("TMAIL_DOMAIN").toLowerCase();
  const apiKey = required("TMAIL_API_KEY");

  const timeoutRaw = process.env.TMAIL_TIMEOUT_MS?.trim();
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TMailError("CONFIG", "TMAIL_TIMEOUT_MS must be a positive number of milliseconds");
  }

  const debugRaw = process.env.TMAIL_DEBUG?.trim().toLowerCase();
  const debug = debugRaw ? debugRaw === "true" || debugRaw === "1" : process.env.NODE_ENV !== "production";

  cached = { baseUrl, domain, apiKey, timeoutMs, debug };
  return cached;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new TMailError("CONFIG", `Missing environment variable ${name} (see .env.example)`);
  }
  return value;
}
