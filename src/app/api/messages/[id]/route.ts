import { deleteMessage } from "@/lib/tmail/client";
import { errorResponse } from "@/lib/tmail/http";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/messages/[id]">) {
  const { id } = await ctx.params;
  try {
    await deleteMessage(id);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err, {
      INVALID_INPUT: "รหัสข้อความไม่ถูกต้อง",
      // TMail answers 500 when the message is already gone.
      UPSTREAM: "ลบไม่สำเร็จ ข้อความนี้อาจถูกลบไปแล้ว",
    });
  }
}
