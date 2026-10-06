"use client";

import { useEffect, useState } from "react";

import { copy } from "@/lib/copy";
import { goToInbox, useRouteEmail } from "@/lib/route";
import type { TMailMessage } from "@/lib/tmail/types";

import { InboxScreen } from "./inbox-screen";
import { Landing } from "./landing";

/** Landing (enter an email) ⇄ Inbox, driven by ?email= in the URL. */
export function App() {
  const email = useRouteEmail();
  // Messages fetched while accessing, so the inbox opens already filled.
  const [handoff, setHandoff] = useState<{ email: string; messages: TMailMessage[] } | null>(null);

  useEffect(() => {
    if (!email) document.title = copy.meta.title;
  }, [email]);

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
