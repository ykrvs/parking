import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import { getVehicles, checkinVehicle, requireVerified } from "@/lib/supabase/server";

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
    (error.message.includes("must be") ||
      error.message.includes("is required") ||
      error.message.includes("Vehicle plate"))
  );
}

function parsePercentage(value: unknown, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed !== null && parsed > 100) {
    throw new Error(`${label} must be 100 or below`);
  }

  return parsed === null ? null : Math.trunc(parsed);
}

function parseRequiredNonNegativeNumber(value: unknown, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed === null) {
    throw new Error(`${label} is required`);
  }

  return parsed;
}

function parseRequiredPercentage(value: unknown, label: string) {
  const parsed = parsePercentage(value, label);
  if (parsed === null) {
    throw new Error(`${label} is required`);
  }

  return parsed;
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

  const limited = rateLimited(session.openid, "vehicles:post", 20, 60_000);
  if (limited) return limited;

  try {
    await requireVerified(session.openid);

    const body = await request.json();
    // Validate required fields
    if (!body.plate || !body.level || !body.lot) {
      return NextResponse.json({ error: "Plate, Level and Lot are required" }, { status: 400 });
    }

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
    // optional bracketed disambiguator, e.g. "675(1)") while the app is
    // scoped to a single unit. Set PLATE_MASK_ENABLED to false (and remove
    // this block) to allow longer plate numbers again when scaling up.
    const PLATE_MASK_ENABLED = true;
    const PLATE_MAX_DIGITS = 3;
    const plateDigitsOnly = plateNumber.split("(")[0];
    if (PLATE_MASK_ENABLED && plateDigitsOnly.length > PLATE_MAX_DIGITS) {
      return NextResponse.json(
        { error: `Vehicle plate must be at most ${PLATE_MAX_DIGITS} digits` },
        { status: 400 },
      );
    }

    // When plate masking is enabled, store the plate itself (no "MID"
    // prefix) so the raw data in Supabase matches what's shown in the UI.
    // Flip PLATE_MASK_ENABLED to false to go back to "MID"-prefixed IDs.
    const plate = PLATE_MASK_ENABLED ? plateNumber : `MID${plateNumber}`;

    // Warn instead of silently overwriting if this exact plate is already
    // checked in. Since plates are now short 3-digit numbers, two different
    // vehicles may legitimately share one — the person checking in can add
    // a bracketed number (e.g. 675(1)) to tell them apart.
    const existingVehicles = await getVehicles();
    if (
      existingVehicles.some(
        (v: { id?: string; plate?: string }) => v.id === plate || v.plate === plate,
      )
    ) {
      return NextResponse.json(
        {
          error: `Vehicle plate ${plate} already exists in the system. If this is a different vehicle, add a number in brackets to tell it apart, e.g. ${plateDigitsOnly}(1).`,
        },
        { status: 409 },
      );
    }

    const data = await checkinVehicle({
      id: plate,
      variant: body.variant?.trim() || "—",
      driver_id: session.openid,
      driver: body.driver?.trim() || "—",
      driver_phone: body.driver_phone?.trim() || "—",
      driver_unit: body.driver_unit?.trim() || "—",
      level: body.level,
      lot: body.lot.toUpperCase().trim(),
      odometer: parseRequiredNonNegativeNumber(body.odometer, "Odometer"),
      engine_hours: parseRequiredNonNegativeNumber(body.engine_hours, "Engine hours"),
      starter_v: parseRequiredNonNegativeNumber(body.starter_v, "Starter voltage"),
      starter_pct: parseRequiredPercentage(body.starter_pct, "Starter percentage"),
      aux_v: parseRequiredNonNegativeNumber(body.aux_v, "Auxiliary voltage"),
      aux_pct: parseRequiredPercentage(body.aux_pct, "Auxiliary percentage"),
      fuel_l: parseRequiredNonNegativeNumber(body.fuel_l, "Fuel litres"),
      fuel_pct: parseRequiredPercentage(body.fuel_pct, "Fuel percentage"),
      fire_ext_expiry: body.fire_ext_expiry || (() => {
        throw new Error("Fire extinguisher expiry date is required");
      })(),
      notes: body.notes || null,
      check_in: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Check-in failed:", err);
    const message = err instanceof Error ? err.message : "Check-in failed";
    const status = message.includes("hasn't been verified")
      ? 403
      : isValidationError(err)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
