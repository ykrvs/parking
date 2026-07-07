import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  createSafetyMessage,
  deleteSafetyMessage,
  getActiveSafetyMessages,
  getSafetyMessages,
  logAuditEvent,
  requireAdmin,
  resolveFacilityCode,
  updateSafetyMessage,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const includeAll = request.nextUrl.searchParams.get("all") === "true";
    const requestedFacility = request.nextUrl.searchParams.get("facility");

    if (includeAll) {
      await requireAdmin(session.openid);
      const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
      const messages = await getSafetyMessages(facilityCode);
      return NextResponse.json({ messages, facility: facilityCode });
    }

    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
    const messages = await getActiveSafetyMessages(facilityCode);
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

  const limited = rateLimited(session.openid, "safety-messages:post", 20, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as {
      message?: string;
      startsAt?: string;
      endsAt?: string;
      isActive?: boolean;
      facility?: string;
    };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const facilityCode = await resolveFacilityCode(session.openid, body.facility);

    const created = await createSafetyMessage({
      message,
      starts_at: body.startsAt || null,
      ends_at: body.endsAt || null,
      is_active: body.isActive !== false,
      created_by: session.openid,
      facility_code: facilityCode,
    });

    await logAuditEvent({
      actorId: session.openid,
      action: "safety_message.create",
      targetId: created?.id ?? null,
      targetLabel: message,
      details: { facility: facilityCode },
    });

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create safety message";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "safety-messages:patch", 30, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as {
      id?: string;
      message?: string;
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    const updated = await updateSafetyMessage(body.id, {
      ...(body.message !== undefined ? { message: body.message.trim() } : {}),
      ...(body.startsAt !== undefined ? { starts_at: body.startsAt || null } : {}),
      ...(body.endsAt !== undefined ? { ends_at: body.endsAt || null } : {}),
      ...(body.isActive !== undefined ? { is_active: body.isActive } : {}),
    });

    await logAuditEvent({
      actorId: session.openid,
      action: "safety_message.update",
      targetId: body.id,
      targetLabel: updated?.message ?? body.id,
      details: {
        startsAt: body.startsAt ?? undefined,
        endsAt: body.endsAt ?? undefined,
      },
    });

    return NextResponse.json({ message: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update safety message";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "safety-messages:delete", 20, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    await deleteSafetyMessage(body.id);

    await logAuditEvent({
      actorId: session.openid,
      action: "safety_message.delete",
      targetId: body.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete safety message";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
