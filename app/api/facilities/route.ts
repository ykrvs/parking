import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getFacilities } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { facilities, error } = await getFacilities();
    return NextResponse.json({ facilities, error });
  } catch (err) {
    console.error("Failed to load facilities:", err);
    return NextResponse.json({ error: "Failed to load facilities" }, { status: 500 });
  }
}
