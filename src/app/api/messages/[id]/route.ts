import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/tmail/http";
import { deleteFromInbox } from "@/lib/tmail/inbox";

// Up to two TMail calls (messages lookup + delete), each allowed TMAIL_TIMEOUT_MS.
export const maxDuration = 30;

/** DELETE /api/messages/:id?email=name@domain — only deletes a message that belongs to that inbox. */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/messages/[id]">) {
  const { id } = await ctx.params;
  const email = request.nextUrl.searchParams.get("email") ?? "";
  try {
    await deleteFromInbox(email, id);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err, {
      NOT_FOUND: "This email isn't in this inbox.",
      // TMail answers 500 when the message is already gone.
      UPSTREAM: "Couldn't delete this email. It may already be gone.",
    });
  }
}
