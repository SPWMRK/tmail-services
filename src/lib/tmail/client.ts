import "server-only";

import { getTMailConfig } from "./config";
import { TMailError } from "./errors";
import { log } from "./logger";
import type { TMailMessage } from "./types";
import { isEmail, parseDomains, parseEmail, parseMessages } from "./validate";

type Method = "GET" | "DELETE";

const MESSAGE_ID_RE = /^[\w.-]{1,128}$/;

/**
 * Calls `{baseUrl}/api/{...segments}/{apiKey}`. Every TMail endpoint has this shape,
 * so this is the only place that builds URLs.
 *
 * Returns the raw body text; callers decide whether it is JSON or plain text.
 */
async function request(method: Method, segments: string[]): Promise<string> {
  const { baseUrl, apiKey, timeoutMs } = getTMailConfig();

  const path = `/api/${segments.map(encodeURIComponent).join("/")}`;
  const url = `${baseUrl}${path}/${encodeURIComponent(apiKey)}`;
  const label = `${method} ${path}/***`;
  const started = Date.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      // Ask Laravel for JSON so errors come back as {"message": ...} rather than an HTML page.
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    log.error(`${label} failed after ${Date.now() - started}ms`, err);
    throw timedOut
      ? new TMailError("TIMEOUT", `TMail did not respond within ${timeoutMs}ms`, { cause: err })
      : new TMailError("NETWORK", "Could not reach the TMail server", { cause: err });
  }

  let body: string;
  try {
    body = await res.text();
  } catch (err) {
    log.error(`${label} → ${res.status}, body unreadable`, err);
    throw new TMailError("NETWORK", "Connection dropped while reading the TMail response", { cause: err });
  }

  const elapsed = Date.now() - started;
  if (!res.ok) {
    const apiMessage = extractApiMessage(body);
    log.warn(`${label} → ${res.status} (${elapsed}ms)`, apiMessage || undefined);
    throw TMailError.fromStatus(res.status, apiMessage);
  }

  log.debug(`${label} → ${res.status} (${elapsed}ms, ${body.length} bytes)`);
  return body;
}

function parseJson(body: string, what: string): unknown {
  try {
    return JSON.parse(body);
  } catch (err) {
    log.error(`TMail ${what} response is not JSON`, body.slice(0, 200));
    throw new TMailError("INVALID_RESPONSE", `TMail ${what} response is not valid JSON`, { cause: err });
  }
}

/**
 * Laravel errors look like {"message": "..."} (often empty); TMail's own
 * validation errors are a bare JSON string, e.g. "Username length cannot be …".
 */
function extractApiMessage(body: string): string | undefined {
  try {
    const data: unknown = JSON.parse(body);
    if (typeof data === "string") return data.trim() || undefined;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message.trim() || undefined;
    }
  } catch {
    // Not JSON (e.g. nginx HTML error page) — nothing useful to extract.
  }
  return undefined;
}

/** Validates the response and logs the raw body when it doesn't match, so format changes are easy to spot. */
function validated<T>(body: string, parse: () => T): T {
  try {
    return parse();
  } catch (err) {
    if (err instanceof TMailError && err.code === "INVALID_RESPONSE") {
      log.error(`${err.message}; body starts with`, body.slice(0, 300));
    }
    throw err;
  }
}

// --- public API ------------------------------------------------------------

/** Domains that can receive mail. */
export async function listDomains(): Promise<string[]> {
  const body = await request("GET", ["domains"]);
  return validated(body, () => parseDomains(parseJson(body, "domains")));
}

/**
 * Registers/normalizes an address. A bare name ("john") gets the default domain.
 * TMail sanitizes the result (lowercases, strips symbols, swaps unknown domains),
 * so always use the returned address rather than the input.
 */
export async function createEmail(email: string): Promise<string> {
  let input = email.trim();
  if (!input) throw new TMailError("INVALID_INPUT", "Email is empty");
  if (!input.includes("@")) input = `${input}@${getTMailConfig().domain}`;
  if (input.length > 254) throw new TMailError("INVALID_INPUT", "Email is too long");
  // TMail strips everything but letters and digits from the name, so require at least one.
  if (!/[a-z0-9]/i.test(input.slice(0, input.lastIndexOf("@")))) {
    throw new TMailError("INVALID_INPUT", "Email name needs at least one letter or digit");
  }

  const body = await request("GET", ["email", input]);
  return validated(body, () => parseEmail(body));
}

/** All messages currently in the inbox, newest first. */
export async function fetchMessages(email: string): Promise<TMailMessage[]> {
  const address = email.trim().toLowerCase();
  if (!isEmail(address)) throw new TMailError("INVALID_INPUT", "Not a valid email address");

  const body = await request("GET", ["messages", address]);
  return validated(body, () => parseMessages(parseJson(body, "messages")));
}

/**
 * Deletes one message. Note: TMail answers HTTP 500 for an id that doesn't exist
 * (e.g. already deleted), which surfaces here as an UPSTREAM error.
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const id = messageId.trim();
  if (!MESSAGE_ID_RE.test(id)) throw new TMailError("INVALID_INPUT", "Invalid message id");

  await request("DELETE", ["message", id]);
}
