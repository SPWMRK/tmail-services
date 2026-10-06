import type { NextRequest } from "next/server";

import { fetchMessages } from "@/lib/tmail/client";
import { errorResponse } from "@/lib/tmail/http";

/** GET /api/messages?email=name@domain → {"messages": [...]} */
export async function GET(request: NextRequest) {
  // Read request data outside try/catch: Next.js signals "skip prerendering" by throwing here.
  const email = request.nextUrl.searchParams.get("email") ?? "";
  try {
    const messages = await fetchMessages(email);
    return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err, { INVALID_INPUT: "ที่อยู่อีเมลไม่ถูกต้อง" });
  }
}
