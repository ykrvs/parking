import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getHistory } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const vehicleId = searchParams.get("vehicle_id") || undefined;
  const onlyCheckouts = searchParams.get("check_out") === "notnull";

  try {
    const data = await getHistory(vehicleId, onlyCheckouts);
    return NextResponse.json({ history: data });
  } catch (err) {
    console.error("Failed to load history:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
