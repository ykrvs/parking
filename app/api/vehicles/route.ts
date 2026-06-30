import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { getVehicles, checkinVehicle } from "@/lib/supabase/server";

function parseNonNegativeNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }

  return parsed;
}

function isValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("must be") || error.message.includes("Licence plate"))
  );
}

function parsePercentage(value: unknown, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed !== null && parsed > 100) {
    throw new Error(`${label} must be 100 or below`);
  }

  return parsed === null ? null : Math.trunc(parsed);
}

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

    const plateNumber = String(body.plate).trim();
    if (!/^\d+$/.test(plateNumber)) {
      return NextResponse.json({ error: "Licence plate must contain numbers only" }, { status: 400 });
    }

    const data = await checkinVehicle({
      plate: `MID${plateNumber}`,
      variant: body.variant?.trim() || "—",
      driver_id: session.openid,
      driver: body.driver?.trim() || "—",
      driver_phone: body.driver_phone?.trim() || "—",
      driver_unit: body.driver_unit?.trim() || "—",
      level: body.level,
      lot: body.lot.toUpperCase().trim(),
      odometer: parseNonNegativeNumber(body.odometer, "Odometer"),
      engine_hours: parseNonNegativeNumber(body.engine_hours, "Engine hours"),
      starter_v: parseNonNegativeNumber(body.starter_v, "Starter voltage"),
      starter_pct: parsePercentage(body.starter_pct, "Starter percentage"),
      aux_v: parseNonNegativeNumber(body.aux_v, "Auxiliary voltage"),
      aux_pct: parsePercentage(body.aux_pct, "Auxiliary percentage"),
      fuel_l: parseNonNegativeNumber(body.fuel_l, "Fuel litres"),
      fuel_pct: parsePercentage(body.fuel_pct, "Fuel percentage"),
      fire_ext_expiry: body.fire_ext_expiry || null,
      notes: body.notes || null,
      check_in: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Check-in failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check-in failed" },
      { status: isValidationError(err) ? 400 : 500 },
    );
  }
}
