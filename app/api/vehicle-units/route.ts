import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getVehicleUnits, resolveFacilityCode } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(
      session.openid,
      requestedFacility,
    );
    const { vehicleUnits, error } = await getVehicleUnits(facilityCode);

    return NextResponse.json({
      vehicleUnits,
      facility: facilityCode,
      error,
    });
  } catch (err) {
    console.error("Failed to load vehicle units:", err);
    return NextResponse.json(
      { error: "Failed to load vehicle units" },
      { status: 500 },
    );
  }
}
