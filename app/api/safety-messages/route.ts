import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import {
  createSafetyMessage,
  getActiveSafetyMessages,
  getSafetyMessages,
  requireAdmin,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const includeAll = request.nextUrl.searchParams.get("all") === "true";

    if (includeAll) {
      await requireAdmin(session.openid);
      const messages = await getSafetyMessages();
      return NextResponse.json({ messages });
    }

    const messages = await getActiveSafetyMessages();
    return NextResponse.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load safety messages";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as {
      message?: string;
      startsAt?: string;
      endsAt?: string;
      isActive?: boolean;
    };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const created = await createSafetyMessage({
      message,
      starts_at: body.startsAt || null,
      ends_at: body.endsAt || null,
      is_active: body.isActive !== false,
      created_by: session.openid,
    });

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create safety message";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
