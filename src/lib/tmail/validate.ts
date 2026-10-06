import { TMailError } from "./errors";
import type { TMailAttachment, TMailMessage } from "./types";

const EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

function invalid(what: string, detail?: string): TMailError {
  return new TMailError("INVALID_RESPONSE", `Unexpected ${what} from TMail${detail ? `: ${detail}` : ""}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** First field that holds a non-empty string or a number, as a string. */
function pickString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

// --- domains ---------------------------------------------------------------

export function parseDomains(body: unknown): string[] {
  if (!Array.isArray(body)) throw invalid("domain list", "expected an array");
  const domains = body
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => DOMAIN_RE.test(d));
  if (domains.length === 0) throw invalid("domain list", "no usable domains");
  return [...new Set(domains)];
}

// --- email -----------------------------------------------------------------

/** The email endpoint answers with the sanitized address as plain text. */
export function parseEmail(body: unknown): string {
  // Tolerate a JSON-encoded string ("x@y.com") in case the server ever switches.
  const text = typeof body === "string" ? body.trim().replace(/^"(.*)"$/, "$1") : "";
  const email = text.toLowerCase();
  if (!isEmail(email)) throw invalid("email", "not an email address");
  return email;
}

// --- messages --------------------------------------------------------------

function parseTimestamp(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw < 1e12 ? raw * 1000 : raw; // seconds → ms
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return parseTimestamp(n);
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? null : ms;
  }
  // TMail sends a serialized Carbon date:
  // {"date": "2026-10-06 20:44:28.000000", "timezone_type": 1, "timezone": "+08:00"}
  if (isRecord(raw) && typeof raw.date === "string") {
    const tz = typeof raw.timezone === "string" ? raw.timezone.trim() : "";
    const offset = /^[+-]\d{2}:\d{2}$/.test(tz) ? tz : /^(UTC|Z|GMT)$/i.test(tz) ? "Z" : null;
    if (!offset) return null; // named zone like "Asia/Bangkok" — let the caller fall back to the display date
    const iso = raw.date.trim().replace(" ", "T").replace(/(\.\d{3})\d*$/, "$1") + offset;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

function parseAttachments(raw: unknown): TMailAttachment[] {
  if (!Array.isArray(raw)) return [];
  const result: TMailAttachment[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const url = pickString(item, "url", "link", "path");
    if (!/^https?:\/\//i.test(url)) continue; // only links we can safely open
    const name = pickString(item, "file", "name", "filename") || url.split("/").pop() || "attachment";
    result.push({ name, url });
  }
  return result;
}

function parseMessage(raw: unknown, index: number): TMailMessage {
  if (!isRecord(raw)) throw invalid("message", `item ${index} is not an object`);

  const id = pickString(raw, "id", "message_id", "uid");
  if (!id) throw invalid("message", `item ${index} has no id`);

  const senderEmail = pickString(raw, "sender_email", "from_email", "from");
  const date = pickString(raw, "date", "datediff");

  return {
    id,
    subject: pickString(raw, "subject"),
    senderName: pickString(raw, "sender_name", "from_name") || senderEmail,
    senderEmail,
    date,
    receivedAt: parseTimestamp(raw.timestamp ?? raw.created_at ?? raw.date),
    content: pickString(raw, "content", "html", "body", "text"),
    attachments: parseAttachments(raw.attachments),
  };
}

export function parseMessages(body: unknown): TMailMessage[] {
  // Empty inbox is "[]"; also accept {"messages": [...]} / {"data": [...]}.
  const list = Array.isArray(body)
    ? body
    : isRecord(body) && Array.isArray(body.messages)
      ? body.messages
      : isRecord(body) && Array.isArray(body.data)
        ? body.data
        : null;
  if (!list) throw invalid("message list", "expected an array");

  const messages = list.map(parseMessage);
  // Newest first when we know the time; keep server order otherwise.
  return messages
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (b.m.receivedAt ?? 0) - (a.m.receivedAt ?? 0) || a.i - b.i)
    .map(({ m }) => m);
}
