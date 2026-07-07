import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getHistory, resolveFacilityCode } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const vehicleId = searchParams.get("vehicle_id") || undefined;
  const onlyCheckouts = searchParams.get("check_out") === "notnull";
  const requestedFacility = searchParams.get("facility");

  try {
    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
    const data = await getHistory(facilityCode, vehicleId, onlyCheckouts);
    return NextResponse.json({ history: data, facility: facilityCode });
  } catch (err) {
    console.error("Failed to load history:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
