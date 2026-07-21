import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  getFacilities,
  getUserRemovalNotice,
  getUserProfile,
  isRegistrationComplete,
  updateUserRegistration,
} from "@/lib/supabase/server";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(session.openid);
    const removalNotice = profile
      ? null
      : await getUserRemovalNotice(session.openid);

    return NextResponse.json({
      profile,
      removalNotice,
      registrationComplete: isRegistrationComplete(profile),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load user profile.";
    console.error("[users/me] GET failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimited(session.openid, "users-me:patch", 10, 60_000);
    if (limited) return limited;

    const body = (await request.json()) as {
      rank?: string;
      ordDate?: string;
      isTechnician?: boolean;
      phone?: string;
      unit?: string;
      name?: string;
      facility?: string;
    };
    const rank = body.rank?.trim() || "";
    const ordDate = body.ordDate?.trim() || "";
    const facility = body.facility?.trim() || "";

    if (!rank) {
      return badRequest("Rank is required.");
    }

    if (!ordDate) {
      return badRequest("ORD date is required.");
    }

    if (!facility) {
      return badRequest("Depot is required.");
    }

    const { facilities, error: facilitiesError } = await getFacilities();
    if (facilitiesError) {
      return NextResponse.json(
        { error: `Could not load depot list: ${facilitiesError}` },
        { status: 500 },
      );
    }
    if (!facilities.some((f) => f.code === facility)) {
      return badRequest("Depot is not recognized.");
    }

    const profile = await updateUserRegistration(session.openid, {
      rank,
      ordDate,
      isTechnician: body.isTechnician === true,
      phone: body.phone?.trim() || null,
      unit: body.unit?.trim() || null,
      name: body.name?.trim() || session.name,
      facilityCode: facility,
    });

    return NextResponse.json({
      profile,
      registrationComplete: isRegistrationComplete(profile),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save user profile.";
    console.error("[users/me] PATCH failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
