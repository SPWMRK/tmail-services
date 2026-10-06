import "server-only";

import { isTMailError, type TMailErrorCode } from "./errors";
import { log } from "./logger";

// What the browser sees for each failure. Upstream details stay in the server log.
const RESPONSES: Record<TMailErrorCode, { status: number; message: string }> = {
  INVALID_INPUT: { status: 400, message: "Please enter a valid email address." },
  NOT_FOUND: { status: 404, message: "This inbox is currently unavailable." },
  RATE_LIMITED: { status: 429, message: "Too many requests. Please wait a moment and try again." },
  TIMEOUT: { status: 504, message: "The mail server is taking too long. Please try again." },
  NETWORK: { status: 502, message: "Can't reach the mail server right now." },
  UPSTREAM: { status: 502, message: "The mail server is having trouble. Please try again." },
  INVALID_RESPONSE: { status: 502, message: "The mail server is having trouble. Please try again." },
  // Our own misconfiguration — don't tell the browser the key was rejected.
  UNAUTHORIZED: { status: 500, message: "Something went wrong on our side. Please try again later." },
  CONFIG: { status: 500, message: "Something went wrong on our side. Please try again later." },
};

export interface ApiErrorBody {
  error: { code: TMailErrorCode | "INTERNAL"; message: string };
}

export function errorResponse(err: unknown, overrides?: Partial<Record<TMailErrorCode, string>>): Response {
  if (isTMailError(err)) {
    const { status, message } = RESPONSES[err.code];
    if (err.code === "CONFIG" || err.code === "UNAUTHORIZED") log.error(err.message);
    const body: ApiErrorBody = { error: { code: err.code, message: overrides?.[err.code] ?? message } };
    return Response.json(body, { status });
  }

  log.error("Unexpected error", err);
  const body: ApiErrorBody = { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } };
  return Response.json(body, { status: 500 });
}
