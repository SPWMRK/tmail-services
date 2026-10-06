import { connection } from "next/server";

import { getTMailConfig } from "@/lib/tmail/config";
import { errorResponse } from "@/lib/tmail/http";
import { allowedDomains } from "@/lib/tmail/inbox";

export async function GET() {
  await connection(); // always ask TMail at request time, never at build time
  try {
    const domains = await allowedDomains();
    const preferred = getTMailConfig().domain;
    const defaultDomain = domains.includes(preferred) ? preferred : domains[0];
    return Response.json({ domains, defaultDomain });
  } catch (err) {
    return errorResponse(err);
  }
}
