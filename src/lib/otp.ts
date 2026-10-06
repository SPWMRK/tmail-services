// Finds a one-time / verification code in an email (browser only — uses DOMParser).

const KEYWORD_RE =
  /verif|one[-\s]?time|\botp\b|passcode|pass code|security code|log[-\s]?in code|sign[-\s]?in code|confirm|activat|access code|authenticat|\bcode\b|รหัส|验证码|驗證碼|認証コード/i;
// 6 digits written as "123 456" / "123-456", or 4–8 digits in a row — but not part of a
// longer number, a decimal/thousands figure ("1,234.56"), a date ("12/2025") or a percentage.
// A sentence-ending period ("code is 472915.") or a colon before it ("code:123456") is fine.
const CODE_SOURCE = String.raw`(?<![\d/]|\d[.,])(\d{3}[ -]\d{3}|\d{4,8})(?!\d|[.,]\d|[/%])`;
const ONLY_CODE_RE = new RegExp(`^${CODE_SOURCE}$`);
const WINDOW_AFTER = 160;
const WINDOW_BEFORE = 60;

const cache = new Map<string, string | null>();

function clean(code: string): string {
  return code.replace(/[\s-]/g, "");
}

/** Looks like a calendar year — almost never an OTP. */
function isYear(code: string): boolean {
  return /^(19|20)\d{2}$/.test(code);
}

function firstCode(text: string): string | null {
  for (const match of text.matchAll(new RegExp(CODE_SOURCE, "g"))) {
    const code = clean(match[1]);
    if (!isYear(code)) return code;
  }
  return null;
}

function toDocument(content: string): Document | null {
  if (typeof DOMParser === "undefined" || !/<[a-z][\s\S]*>/i.test(content)) return null;
  const doc = new DOMParser().parseFromString(content, "text/html");
  doc.querySelectorAll("style, script, head, title, noscript").forEach((n) => n.remove());
  return doc;
}

/** Codes sitting alone in their own element (how most OTP emails present them), in document order. */
function codesInOwnElements(doc: Document): string[] {
  const found: string[] = [];
  for (const el of doc.body.querySelectorAll("*")) {
    const text = el.textContent?.trim() ?? "";
    if (text.length > 9) continue;
    const m = ONLY_CODE_RE.exec(text);
    if (m && !isYear(clean(m[1])) && !found.includes(clean(m[1]))) found.push(clean(m[1]));
  }
  return found;
}

/** A code shortly after (or just before) a keyword such as "verification code". */
function codeNearKeyword(text: string): string | null {
  const re = new RegExp(KEYWORD_RE.source, "gi");
  for (const match of text.matchAll(re)) {
    const at = match.index ?? 0;
    const after = firstCode(text.slice(at, at + match[0].length + WINDOW_AFTER));
    if (after) return after;
    const before = firstCode(text.slice(Math.max(0, at - WINDOW_BEFORE), at));
    if (before) return before;
  }
  return null;
}

export function detectCode(id: string, subject: string, content: string): string | null {
  const key = `${id}:${content.length}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const doc = toDocument(content);
  const bodyText = (doc ? (doc.body?.textContent ?? "") : content).replace(/\s+/g, " ");

  let code: string | null = null;
  // Only look for a code when the email talks about one — avoids picking up order numbers etc.
  if (KEYWORD_RE.test(subject) || KEYWORD_RE.test(bodyText)) {
    // Priority: code in the subject › code next to a keyword › code standing alone in the layout.
    // (A lone number far from any keyword is often a postcode or order number in the footer.)
    code =
      (KEYWORD_RE.test(subject) ? codeNearKeyword(subject) : null) ??
      codeNearKeyword(bodyText) ??
      (doc ? (codesInOwnElements(doc)[0] ?? null) : null);
  }

  cache.set(key, code);
  return code;
}

/** "482913" → "482 913" for easier reading; other lengths stay as-is. */
export function formatCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
