// Browser-side calls to our own /api routes (which talk to TMail on the server).
import type { Copy } from "./copy";
import type { TMailMessage } from "./tmail/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Network request failed", "OFFLINE", 0);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.message ?? `HTTP ${res.status}`, err?.code ?? "UNKNOWN", res.status);
  }
  return data as T;
}

export function getDomains() {
  return call<{ domains: string[]; defaultDomain: string }>("/api/domains");
}

export async function getMessages(email: string, signal?: AbortSignal) {
  const { messages } = await call<{ messages: TMailMessage[] }>(
    `/api/messages?email=${encodeURIComponent(email)}`,
    { signal },
  );
  return messages;
}

/** User-facing text for any error thrown by the calls above, in the current language. */
export function errorText(err: unknown, t: Copy): string {
  if (err instanceof ApiError && err.code in t.errors) return t.errors[err.code as keyof Copy["errors"]];
  return t.errors.generic;
}
