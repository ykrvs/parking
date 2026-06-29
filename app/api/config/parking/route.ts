import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getParkingConfig } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getParkingConfig();
    return NextResponse.json({ config });
  } catch (err) {
    console.error("Failed to load parking config:", err);
    return NextResponse.json(
      { error: "Failed to load parking config" },
      { status: 500 },
    );
  }
}
