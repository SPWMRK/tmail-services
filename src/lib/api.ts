// Browser-side calls to our own /api routes (which talk to TMail on the server).
import { copy } from "./copy";
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
    throw new ApiError(copy.errors.OFFLINE, "OFFLINE", 0);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.message ?? copy.errors.generic, err?.code ?? "UNKNOWN", res.status);
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

export async function removeMessage(id: string) {
  await call<{ ok: true }>(`/api/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** User-facing text for any error thrown by the calls above. */
export function errorText(err: unknown): string {
  if (err instanceof ApiError && err.code in copy.errors) return copy.errors[err.code as keyof typeof copy.errors];
  return copy.errors.generic;
}
