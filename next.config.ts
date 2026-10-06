import type { NextConfig } from "next";

const securityHeaders = [
  // The open inbox lives in the URL (?email=…); never send it to other sites via Referer.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Script/style/img are left open on purpose: email bodies render in a srcdoc iframe that inherits this policy.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Keep links to a specific inbox out of search engines.
      { source: "/", has: [{ type: "query", key: "email" }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
