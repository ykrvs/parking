import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import { getVehicles, checkinVehicle, requireVerified, resolveFacilityCode } from "@/lib/supabase/server";
import {
  buildVehicleCheckInPayload,
  isVehicleValidationError,
} from "@/lib/vehicles/rules";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
    const list = await getVehicles(facilityCode);
    return NextResponse.json({ vehicles: list, facility: facilityCode });
  } catch (err) {
    console.error("Failed to load vehicles:", err);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "vehicles:post", 20, 60_000);
  if (limited) return limited;

  try {
    await requireVerified(session.openid);

    const body = await request.json();
    // Validate required fields
    if (!body.plate || !body.level || !body.lot) {
      return NextResponse.json({ error: "Plate, Level and Lot are required" }, { status: 400 });
    }

    const facilityCode = await resolveFacilityCode(session.openid, body.facility);

    const plateNumber = String(body.plate).trim();
    if (!/^\d{1,3}(\(\d{1,2}\))?$/.test(plateNumber)) {
      return NextResponse.json(
        {
          error:
            "Vehicle plate must be up to 3 digits, optionally followed by a bracketed number, e.g. 675(1)",
        },
        { status: 400 },
      );
    }

    // Vehicle Plate masking: entries are capped at 3 digits (plus an
    // optional bracketed disambiguator, e.g. "675(1)") while each depot's
    // plates are scoped to a single unit. Set PLATE_MASK_ENABLED to false
    // (and remove this block) to allow longer plate numbers again.
    const PLATE_MASK_ENABLED = true;
    const PLATE_MAX_DIGITS = 3;
    const plateDigitsOnly = plateNumber.split("(")[0];
    if (PLATE_MASK_ENABLED && plateDigitsOnly.length > PLATE_MAX_DIGITS) {
      return NextResponse.json(
        { error: `Vehicle plate must be at most ${PLATE_MAX_DIGITS} digits` },
        { status: 400 },
      );
    }

    // Every vehicle's stored id is prefixed with its depot's facility code
    // (e.g. "11FMD-087") so the same 3-digit plate can be reused across
    // depots without colliding — the UI only ever shows the part after the
    // prefix. Flip PLATE_MASK_ENABLED to false to go back to plain "MID"
    // prefixed IDs with no depot scoping.
    const plate = PLATE_MASK_ENABLED
      ? `${facilityCode}-${plateNumber}`
      : `MID${plateNumber}`;

    // Warn instead of silently overwriting if this exact plate is already
    // checked in at this depot. Since plates are now short 3-digit numbers,
    // two different vehicles may legitimately share one — the person
    // checking in can add a bracketed number (e.g. 675(1)) to tell them
    // apart.
    const existingVehicles = await getVehicles(facilityCode);
    if (
      existingVehicles.some(
        (v) => String(v.id ?? "") === plate || String(v.plate ?? "") === plate,
      )
    ) {
      return NextResponse.json(
        {
          error: `Vehicle plate ${plateNumber} already exists in the system. If this is a different vehicle, add a number in brackets to tell it apart, e.g. ${plateDigitsOnly}(1).`,
        },
        { status: 409 },
      );
    }

    const data = await checkinVehicle(
      buildVehicleCheckInPayload({
        id: plate,
        facilityCode,
        actorId: session.openid,
        body,
        checkIn: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Check-in failed:", err);
    const message = err instanceof Error ? err.message : "Check-in failed";
    const status = message.includes("hasn't been verified")
      ? 403
      : isVehicleValidationError(err)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
