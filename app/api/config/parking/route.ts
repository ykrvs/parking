import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getParkingConfig, resolveFacilityCode } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
    const config = await getParkingConfig(facilityCode);
    return NextResponse.json({ config, facility: facilityCode });
  } catch (err) {
    console.error("Failed to load parking config:", err);
    return NextResponse.json(
      { error: "Failed to load parking config" },
      { status: 500 },
    );
  }
}
