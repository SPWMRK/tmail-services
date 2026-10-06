import "server-only";

import { getTMailConfig } from "./config";

const PREFIX = "[tmail]";
const MASK = "***";

/** Removes the API key from anything we are about to log. */
function redact(text: string): string {
  let key: string | undefined;
  try {
    key = getTMailConfig().apiKey;
  } catch {
    return text; // config itself is broken, so there is no key to leak
  }
  return text.split(key).join(MASK).split(encodeURIComponent(key)).join(MASK);
}

function describe(detail: unknown): string {
  if (detail === undefined) return "";
  if (detail instanceof Error) {
    const cause = detail.cause instanceof Error ? ` (cause: ${detail.cause.message})` : "";
    return ` — ${detail.name}: ${detail.message}${cause}`;
  }
  return ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
}

function isDebug(): boolean {
  try {
    return getTMailConfig().debug;
  } catch {
    return false;
  }
}

export const log = {
  debug(message: string, detail?: unknown) {
    if (isDebug()) console.debug(redact(`${PREFIX} ${message}${describe(detail)}`));
  },
  warn(message: string, detail?: unknown) {
    console.warn(redact(`${PREFIX} ${message}${describe(detail)}`));
  },
  error(message: string, detail?: unknown) {
    console.error(redact(`${PREFIX} ${message}${describe(detail)}`));
  },
};
