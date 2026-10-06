import "server-only";

import { isTMailError, type TMailErrorCode } from "./errors";
import { log } from "./logger";

// What the browser sees for each failure. Upstream details stay in the server log.
const RESPONSES: Record<TMailErrorCode, { status: number; message: string }> = {
  INVALID_INPUT: { status: 400, message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
  NOT_FOUND: { status: 404, message: "ไม่พบข้อมูลที่ต้องการ" },
  RATE_LIMITED: { status: 429, message: "มีการเรียกใช้งานถี่เกินไป กรุณารอสักครู่" },
  TIMEOUT: { status: 504, message: "เซิร์ฟเวอร์อีเมลตอบช้าเกินไป กรุณาลองใหม่" },
  NETWORK: { status: 502, message: "ติดต่อเซิร์ฟเวอร์อีเมลไม่ได้ กรุณาลองใหม่" },
  UPSTREAM: { status: 502, message: "เซิร์ฟเวอร์อีเมลขัดข้อง กรุณาลองใหม่" },
  INVALID_RESPONSE: { status: 502, message: "เซิร์ฟเวอร์อีเมลตอบกลับข้อมูลที่ไม่ถูกต้อง" },
  // Our own misconfiguration — don't tell the browser the key was rejected.
  UNAUTHORIZED: { status: 500, message: "ระบบตั้งค่าไม่ถูกต้อง กรุณาแจ้งผู้ดูแล" },
  CONFIG: { status: 500, message: "ระบบตั้งค่าไม่ถูกต้อง กรุณาแจ้งผู้ดูแล" },
};

export interface ApiErrorBody {
  error: { code: TMailErrorCode | "INTERNAL"; message: string };
}

export function errorResponse(err: unknown, overrides?: Partial<Record<TMailErrorCode, string>>): Response {
  if (isTMailError(err)) {
    const { status, message } = RESPONSES[err.code];
    if (err.code === "CONFIG" || err.code === "UNAUTHORIZED") log.error(err.message);
    const body: ApiErrorBody = { error: { code: err.code, message: overrides?.[err.code] ?? message } };
    return Response.json(body, { status });
  }

  log.error("Unexpected error", err);
  const body: ApiErrorBody = { error: { code: "INTERNAL", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" } };
  return Response.json(body, { status: 500 });
}
