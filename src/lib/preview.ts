// One-line plain-text preview of an email body for the inbox list (browser only).

const cache = new Map<string, string>();
const MAX_LENGTH = 180;

export function previewText(id: string, content: string): string {
  const key = `${id}:${content.length}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let text = content;
  if (/<[a-z][\s\S]*>/i.test(content) && typeof DOMParser !== "undefined") {
    // DOMParser builds an inert document: no scripts run, no images load.
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("style, script, head, title, noscript").forEach((n) => n.remove());
    // textContent glues blocks together ("Hi there,Use the code"); add a space after each block.
    doc.querySelectorAll("p, div, br, li, tr, td, h1, h2, h3, h4, h5, h6, table, blockquote").forEach((n) => n.after(" "));
    text = doc.body?.textContent ?? "";
  }
  text = text
    .replace(/[­͏​-‍⁠﻿]/g, "") // invisible preheader padding (soft hyphens, zero-width chars)
    .replace(/[\s ]+/g, " ")
    .trim()
    .slice(0, MAX_LENGTH);

  cache.set(key, text);
  return text;
}
