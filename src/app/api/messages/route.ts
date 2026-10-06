import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/tmail/http";
import { supportedMessages } from "@/lib/tmail/inbox";

// Up to two TMail calls (domains (cached) + messages), each allowed TMAIL_TIMEOUT_MS.
export const maxDuration = 20;

/** GET /api/messages?email=name@domain → {"messages": [...]} (supported services only) */
export async function GET(request: NextRequest) {
  // Read request data outside try/catch: Next.js signals "skip prerendering" by throwing here.
  const email = request.nextUrl.searchParams.get("email") ?? "";
  try {
    const messages = await supportedMessages(email);
    return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
