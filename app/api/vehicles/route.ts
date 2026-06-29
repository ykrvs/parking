import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getVehicles, checkinVehicle } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const list = await getVehicles();
    return NextResponse.json({ vehicles: list });
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

  try {
    const body = await request.json();
    // Validate required fields
    if (!body.plate || !body.level || !body.lot) {
      return NextResponse.json({ error: "Plate, Level and Lot are required" }, { status: 400 });
    }

    const data = await checkinVehicle({
      plate: body.plate.toUpperCase().trim(),
      variant: body.variant?.trim() || "—",
      driver: body.driver?.trim() || "—",
      driver_phone: body.driver_phone?.trim() || "—",
      driver_unit: body.driver_unit?.trim() || "—",
      level: body.level,
      lot: body.lot.toUpperCase().trim(),
      odometer: body.odometer !== null && body.odometer !== undefined ? parseFloat(body.odometer) : null,
      engine_hours: body.engine_hours !== null && body.engine_hours !== undefined ? parseFloat(body.engine_hours) : null,
      starter_v: body.starter_v !== null && body.starter_v !== undefined ? parseFloat(body.starter_v) : null,
      starter_pct: body.starter_pct !== null && body.starter_pct !== undefined ? parseInt(body.starter_pct, 10) : null,
      aux_v: body.aux_v !== null && body.aux_v !== undefined ? parseFloat(body.aux_v) : null,
      aux_pct: body.aux_pct !== null && body.aux_pct !== undefined ? parseInt(body.aux_pct, 10) : null,
      fuel_l: body.fuel_l !== null && body.fuel_l !== undefined ? parseFloat(body.fuel_l) : null,
      fuel_pct: body.fuel_pct !== null && body.fuel_pct !== undefined ? parseInt(body.fuel_pct, 10) : null,
      fire_ext_expiry: body.fire_ext_expiry || null,
      notes: body.notes || null,
      check_in: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Check-in failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Check-in failed" }, { status: 500 });
  }
}
