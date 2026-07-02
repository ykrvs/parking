import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getAuditLog, requireAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireAdmin(session.openid);
    const entries = await getAuditLog(200);
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load audit log";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
