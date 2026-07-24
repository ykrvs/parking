import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  createAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  getAnnouncements,
  getUserProfile,
  logAuditEvent,
  requireAdmin,
  resolveFacilityCode,
  updateAnnouncement,
} from "@/lib/supabase/server";

const VALID_TARGET_ROLES = ["all", "admins", "drivers", "technicians"] as const;
type TargetRole = (typeof VALID_TARGET_ROLES)[number];

function normalizeDateBoundary(value: string | null | undefined, endOfDay = false) {
  if (!value) return null;
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeTargetRole(value: unknown): TargetRole {
  return VALID_TARGET_ROLES.includes(value as TargetRole)
    ? (value as TargetRole)
    : "all";
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const includeAll = request.nextUrl.searchParams.get("all") === "true";
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);

    if (includeAll) {
      await requireAdmin(session.openid);
      const announcements = await getAnnouncements(facilityCode);
      return NextResponse.json({ announcements, facility: facilityCode });
    }

    const profile = await getUserProfile(session.openid);
    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const announcements = await getActiveAnnouncements(facilityCode, profile);
    return NextResponse.json({ announcements, facility: facilityCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load announcements";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "announcements:post", 20, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as {
      title?: string | null;
      message?: string;
      linkUrl?: string | null;
      buttonLabel?: string | null;
      targetRole?: string;
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
      facility?: string | null;
    };
    const message = body.message?.trim();
    const linkUrl = normalizeUrl(body.linkUrl);

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (body.linkUrl?.trim() && !linkUrl) {
      return NextResponse.json(
        { error: "Link must be a valid http or https URL" },
        { status: 400 },
      );
    }

    const facilityCode = await resolveFacilityCode(session.openid, body.facility);
    const created = await createAnnouncement({
      title: body.title?.trim() || null,
      message,
      link_url: linkUrl,
      button_label: body.buttonLabel?.trim() || null,
      target_role: normalizeTargetRole(body.targetRole),
      starts_at: normalizeDateBoundary(body.startsAt),
      ends_at: normalizeDateBoundary(body.endsAt, true),
      is_active: body.isActive !== false,
      created_by: session.openid,
      facility_code: facilityCode,
    });

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      action: "announcement.create",
      targetId: created?.id ?? null,
      targetLabel: created?.title || message,
      details: { facility: facilityCode },
    });

    return NextResponse.json(
      {
        announcement: created,
        auditLogged: auditResult.success,
        auditError: auditResult.error,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create announcement";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "announcements:patch", 30, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as {
      id?: string;
      title?: string | null;
      message?: string;
      linkUrl?: string | null;
      buttonLabel?: string | null;
      targetRole?: string;
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
    };
    if (!body.id) {
      return NextResponse.json({ error: "Announcement id is required" }, { status: 400 });
    }

    const linkUrl =
      body.linkUrl !== undefined ? normalizeUrl(body.linkUrl) : undefined;
    if (body.linkUrl?.trim() && !linkUrl) {
      return NextResponse.json(
        { error: "Link must be a valid http or https URL" },
        { status: 400 },
      );
    }

    const updated = await updateAnnouncement(body.id, {
      ...(body.title !== undefined ? { title: body.title?.trim() || null } : {}),
      ...(body.message !== undefined ? { message: body.message.trim() } : {}),
      ...(body.linkUrl !== undefined ? { link_url: linkUrl ?? null } : {}),
      ...(body.buttonLabel !== undefined
        ? { button_label: body.buttonLabel?.trim() || null }
        : {}),
      ...(body.targetRole !== undefined
        ? { target_role: normalizeTargetRole(body.targetRole) }
        : {}),
      ...(body.startsAt !== undefined
        ? { starts_at: normalizeDateBoundary(body.startsAt) }
        : {}),
      ...(body.endsAt !== undefined
        ? { ends_at: normalizeDateBoundary(body.endsAt, true) }
        : {}),
      ...(body.isActive !== undefined ? { is_active: body.isActive } : {}),
    });

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      action: "announcement.update",
      targetId: body.id,
      targetLabel: updated?.title || updated?.message || body.id,
    });

    return NextResponse.json({
      announcement: updated,
      auditLogged: auditResult.success,
      auditError: auditResult.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update announcement";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "announcements:delete", 20, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin(session.openid);

    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Announcement id is required" }, { status: 400 });
    }

    await deleteAnnouncement(body.id);

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      action: "announcement.delete",
      targetId: body.id,
    });

    return NextResponse.json({
      success: true,
      auditLogged: auditResult.success,
      auditError: auditResult.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete announcement";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
