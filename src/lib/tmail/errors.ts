export type TMailErrorCode =
  | "CONFIG" // missing or invalid env configuration
  | "INVALID_INPUT" // caller passed a bad email / id
  | "NETWORK" // could not reach the TMail server
  | "TIMEOUT" // TMail server did not answer in time
  | "UNAUTHORIZED" // API key rejected (401/403)
  | "NOT_FOUND" // 404
  | "RATE_LIMITED" // 429
  | "UPSTREAM" // TMail server error (5xx) or other non-2xx
  | "INVALID_RESPONSE"; // 2xx but the body is not what we expect

export class TMailError extends Error {
  readonly code: TMailErrorCode;
  /** HTTP status returned by the TMail server, when there was one. */
  readonly status?: number;

  constructor(code: TMailErrorCode, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "TMailError";
    this.code = code;
    this.status = options?.status;
  }

  static fromStatus(status: number, apiMessage?: string): TMailError {
    const detail = apiMessage ? `: ${apiMessage}` : "";
    if (status === 401 || status === 403) {
      return new TMailError("UNAUTHORIZED", `TMail rejected the API key (HTTP ${status})${detail}`, { status });
    }
    // TMail answers 406 for a rejected address, e.g. a username outside 4–15 characters.
    if (status === 400 || status === 406 || status === 422) {
      return new TMailError("INVALID_INPUT", `TMail rejected the input${detail}`, { status });
    }
    if (status === 404) return new TMailError("NOT_FOUND", `TMail resource not found${detail}`, { status });
    if (status === 429) return new TMailError("RATE_LIMITED", `TMail rate limit reached${detail}`, { status });
    return new TMailError("UPSTREAM", `TMail returned HTTP ${status}${detail}`, { status });
  }
}

export function isTMailError(err: unknown): err is TMailError {
  return err instanceof TMailError;
}
