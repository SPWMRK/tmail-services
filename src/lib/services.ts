// Services whose emails this inbox is meant to receive, recognized by sender.

export interface Service {
  id: "iqiyi" | "wetv" | "disney";
  name: string;
  /** Exact sender addresses (lowercase). */
  senders: string[];
  /** Fallback: any sender on these domains (or their subdomains). */
  domains: string[];
}

export const SERVICES: Service[] = [
  { id: "iqiyi", name: "iQIYI", senders: ["no_reply_intl@iq.com"], domains: ["iq.com", "iqiyi.com"] },
  { id: "wetv", name: "WeTV", senders: ["service@mail.wetv.vip"], domains: ["wetv.vip"] },
  {
    id: "disney",
    name: "Disney+",
    senders: ["disneyplus@trx.mail2.disneyplus.com"],
    domains: ["disneyplus.com"],
  },
];

export function detectService(senderEmail: string): Service | null {
  const sender = senderEmail.trim().toLowerCase();
  if (!sender) return null;
  const exact = SERVICES.find((s) => s.senders.includes(sender));
  if (exact) return exact;
  const domain = sender.split("@")[1] ?? "";
  return SERVICES.find((s) => s.domains.some((d) => domain === d || domain.endsWith(`.${d}`))) ?? null;
}
