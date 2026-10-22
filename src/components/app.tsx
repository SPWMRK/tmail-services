"use client";

import { useEffect, useState } from "react";

import { useCopy, useLang } from "@/lib/lang";
import { goToInbox, useRouteEmail } from "@/lib/route";
import type { TMailMessage } from "@/lib/tmail/types";

import { InboxScreen } from "./inbox-screen";
import { Landing } from "./landing";

/** Landing (enter an email) ⇄ Inbox, driven by ?email= in the URL. */
export function App() {
  const email = useRouteEmail();
  const lang = useLang();
  const t = useCopy();
  // Messages fetched while accessing, so the inbox opens already filled.
  const [handoff, setHandoff] = useState<{ email: string; messages: TMailMessage[] } | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!email) document.title = t.meta.title;
  }, [email, t]);

  if (email) {
    return <InboxScreen key={email} email={email} initialMessages={handoff?.email === email ? handoff.messages : undefined} />;
  }
  return (
    <Landing
      onAccess={(address, messages) => {
        setHandoff({ email: address, messages });
        goToInbox(address);
      }}
    />
  );
}
