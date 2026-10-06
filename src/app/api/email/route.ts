import { createEmail } from "@/lib/tmail/client";
import { TMailError } from "@/lib/tmail/errors";
import { errorResponse } from "@/lib/tmail/http";

/** Body: {"email": "name@domain" | "name"} → {"email": "<sanitized address>"} */
export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      throw new TMailError("INVALID_INPUT", "Body must be JSON");
    }
    const email =
      payload && typeof payload === "object" && "email" in payload && typeof payload.email === "string"
        ? payload.email
        : "";

    return Response.json({ email: await createEmail(email) });
  } catch (err) {
    return errorResponse(err, { INVALID_INPUT: "กรุณากรอกชื่ออีเมลให้ถูกต้อง" });
  }
}
