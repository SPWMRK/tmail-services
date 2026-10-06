"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cx } from "@/lib/cx";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Standalone document for the sandboxed iframe. Scripts are blocked twice
 * (sandbox without allow-scripts + CSP), forms are blocked, links open in a new tab.
 */
function buildDocument(content: string, emptyText: string): string {
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  const body = looksHtml
    ? content
    : `<pre style="white-space:pre-wrap;font:inherit;margin:0">${escapeHtml(content || emptyText)}</pre>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<base target="_blank">
<style>
  html{background:#fff;color:#1f2937}
  body{margin:0;padding:20px;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans Thai",sans-serif;overflow-wrap:anywhere}
  img,video{max-width:100%;height:auto}
  table{max-width:100%}
  pre{white-space:pre-wrap}
  a{color:#4f46e5}
</style></head><body>${body}</body></html>`;
}

/** Renders an email body safely and grows to fit its content (no inner scrollbar). */
export function EmailFrame({ html, title, emptyText }: { html: string; title: string; emptyText: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const [loaded, setLoaded] = useState(false);
  const srcDoc = useMemo(() => buildDocument(html, emptyText), [html, emptyText]);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const measure = () => setHeight(Math.max(160, Math.ceil(doc.documentElement.offsetHeight)));
      measure();
      setLoaded(true);
      observer?.disconnect();
      observer = new ResizeObserver(measure); // images loading, fonts swapping
      observer.observe(doc.body);
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [srcDoc]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
      {!loaded && (
        <div className="absolute inset-0 space-y-3 bg-white p-5" aria-hidden="true">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-32 w-full" />
        </div>
      )}
      <iframe
        ref={ref}
        title={title}
        srcDoc={srcDoc}
        // Same-origin is needed to measure the height; without allow-scripts nothing inside can run.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={{ height }}
        className={cx("block w-full transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
