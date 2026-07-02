import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import {
  getUsers,
  requireAdmin,
  setUserAdmin,
  setUserVerified,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireAdmin(session.openid);
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      targetId?: string;
      isAdmin?: boolean;
      isVerified?: boolean;
    };

    if (!body.targetId) {
      return NextResponse.json({ error: "Target user is required" }, { status: 400 });
    }

    let user;
    if (body.isVerified !== undefined) {
      user = await setUserVerified(session.openid, body.targetId, body.isVerified === true);
    }
    if (body.isAdmin !== undefined) {
      user = await setUserAdmin(session.openid, body.targetId, body.isAdmin === true);
    }

    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    const status = message.includes("Only admins") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
