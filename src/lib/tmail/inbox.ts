import "server-only";

import { detectService } from "@/lib/services";

import { deleteMessage, fetchMessages, listDomains } from "./client";
import { TMailError } from "./errors";
import { log } from "./logger";
import type { TMailMessage } from "./types";
import { isEmail } from "./validate";

// Rules enforced on the server for every inbox request:
//  1. the address must be on a domain TMail actually hosts;
//  2. only mail from supported services (src/lib/services.ts) ever leaves the server;
//  3. a message can only be deleted through the inbox it belongs to.

const DOMAINS_TTL_MS = 10 * 60_000;

let domainsCache: { at: number; value: Promise<string[]> } | null = null;

/** TMail's domains, cached per server instance so we don't ask on every request. */
export function allowedDomains(): Promise<string[]> {
  const now = Date.now();
  if (!domainsCache || now - domainsCache.at > DOMAINS_TTL_MS) {
    const value = listDomains();
    domainsCache = { at: now, value };
    value.catch(() => {
      if (domainsCache?.value === value) domainsCache = null; // don't cache failures
    });
  }
  return domainsCache.value;
}

async function assertInbox(email: string): Promise<string> {
  const address = email.trim().toLowerCase();
  if (!isEmail(address)) throw new TMailError("INVALID_INPUT", "Not a valid email address");
  const domain = address.split("@")[1];
  if (!(await allowedDomains()).includes(domain)) {
    throw new TMailError("NOT_FOUND", `Domain ${domain} is not hosted by TMail`);
  }
  return address;
}

/** Messages in `email` from supported services only. */
export async function supportedMessages(email: string): Promise<TMailMessage[]> {
  const address = await assertInbox(email);
  const all = await fetchMessages(address);
  const supported = all.filter((m) => detectService(m.senderEmail) !== null);
  if (supported.length !== all.length) {
    log.debug(`Hid ${all.length - supported.length} message(s) from unsupported senders`);
  }
  return supported;
}

/** Deletes a message, but only if it is a supported message in `email`'s inbox. */
export async function deleteFromInbox(email: string, messageId: string): Promise<void> {
  const messages = await supportedMessages(email);
  if (!messages.some((m) => m.id === messageId)) {
    throw new TMailError("NOT_FOUND", "Message is not in this inbox");
  }
  await deleteMessage(messageId);
}
