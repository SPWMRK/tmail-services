import { connection } from "next/server";

import { listDomains } from "@/lib/tmail/client";
import { getTMailConfig } from "@/lib/tmail/config";
import { errorResponse } from "@/lib/tmail/http";

export async function GET() {
  await connection(); // always ask TMail at request time, never at build time
  try {
    const domains = await listDomains();
    const preferred = getTMailConfig().domain;
    const defaultDomain = domains.includes(preferred) ? preferred : domains[0];
    return Response.json({ domains, defaultDomain });
  } catch (err) {
    return errorResponse(err);
  }
}
