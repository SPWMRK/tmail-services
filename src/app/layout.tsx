import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans_Thai, Plus_Jakarta_Sans } from "next/font/google";

import { COPY, fmt, joinList } from "@/lib/copy";
import { SERVICES } from "@/lib/services";
import "./globals.css";

// Latin text uses Plus Jakarta Sans; Thai glyphs (the Thai UI and Thai email subjects) fall through to IBM Plex Sans Thai.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Thai, because link previews (e.g. in LINE) show this text and most customers read Thai.
// The page switches language on the client; see src/lib/lang.ts.
const meta = COPY.th.meta;

export const metadata: Metadata = {
  title: meta.title,
  description: fmt(meta.description, { services: joinList(SERVICES.map((s) => s.name), COPY.th.and) }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090b11" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${jakarta.variable} ${plexThai.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
