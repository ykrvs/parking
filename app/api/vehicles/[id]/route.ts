import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  updateVehicle,
  moveOutVehicle,
  insertHistory,
  requireVerified,
  assertVehicleFacilityAccess,
  assertVehicleDriveOutOwner,
  resolveVehicleFacilityCode,
} from "@/lib/supabase/server";

const NUMERIC_FIELDS = [
  ["odometer", "Odometer"],
  ["engine_hours", "Engine hours"],
  ["starter_v", "Starter voltage"],
  ["aux_v", "Auxiliary voltage"],
  ["fuel_l", "Fuel litres"],
] as const;

const PERCENTAGE_FIELDS = [
  ["starter_pct", "Starter percentage"],
  ["aux_pct", "Auxiliary percentage"],
  ["fuel_pct", "Fuel percentage"],
] as const;

const VEHICLE_UPDATE_FIELDS = [
  "variant",
  "vehicle_unit",
  "driver",
  "driver_phone",
  "driver_unit",
  "lot",
  "odometer",
  "engine_hours",
  "starter_v",
  "starter_pct",
  "aux_v",
  "aux_pct",
  "fuel_l",
  "fuel_pct",
  "fire_ext_expiry",
  "notes",
] as const;

function parseNonNegativeNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }

  return parsed;
}

function parsePercentage(value: unknown, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed !== null && parsed > 100) {
    throw new Error(`${label} must be 100 or below`);
  }

  return parsed === null ? null : Math.trunc(parsed);
}

function validateVehicleNumbers(row: Record<string, unknown> | undefined) {
  if (!row) return;

  NUMERIC_FIELDS.forEach(([field, label]) => {
    if (field in row) {
      const parsed = parseNonNegativeNumber(row[field], label);
      if (parsed === null) throw new Error(`${label} is required`);
      row[field] = parsed;
    }
  });
  PERCENTAGE_FIELDS.forEach(([field, label]) => {
    if (field in row) {
      const parsed = parsePercentage(row[field], label);
      if (parsed === null) throw new Error(`${label} is required`);
      row[field] = parsed;
    }
  });

}

function isValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("must be") || error.message.includes("is required"))
  );
}

function pickVehicleUpdateData(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {};

  VEHICLE_UPDATE_FIELDS.forEach((field) => {
    if (field in body) {
      updateData[field] = body[field];
    }
  });

  if (typeof updateData.lot === "string") {
    updateData.lot = updateData.lot.toUpperCase().trim();
  }

  validateVehicleNumbers(updateData);
  return updateData;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patchLimited = rateLimited(session.openid, "vehicles:patch", 30, 60_000);
  if (patchLimited) return patchLimited;

  const { id } = await params;

  try {
    await requireVerified(session.openid);
    await assertVehicleFacilityAccess(session.openid, id);

    const body = await request.json();
    const { historyRow } = body;
    const updateData = pickVehicleUpdateData(body);
    validateVehicleNumbers(historyRow);

    if (historyRow) {
      await insertHistory({
        ...historyRow,
        facility_code: await resolveVehicleFacilityCode(id),
        created_at: new Date().toISOString(),
      });
    }

    const data = await updateVehicle(id, updateData);
    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Update vehicle failed:", err);
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message.includes("hasn't been verified")
      ? 403
      : message.includes("different depot")
        ? 403
        : isValidationError(err)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleteLimited = rateLimited(session.openid, "vehicles:delete", 30, 60_000);
  if (deleteLimited) return deleteLimited;

  const { id } = await params;

  try {
    await requireVerified(session.openid);
    await assertVehicleFacilityAccess(session.openid, id);
    await assertVehicleDriveOutOwner(session.openid, id);

    const body = await request.json();
    const { historyRow } = body;

    if (historyRow) {
      await insertHistory({
        ...historyRow,
        facility_code: await resolveVehicleFacilityCode(id),
        check_out: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    const vehicle = await moveOutVehicle(id);
    return NextResponse.json({ success: true, vehicle });
  } catch (err) {
    console.error("Drive out failed:", err);
    const message = err instanceof Error ? err.message : "Drive out failed";
    const status = message.includes("hasn't been verified")
      ? 403
      : message.includes("different depot")
        ? 403
        : message.includes("driver who logged this vehicle in")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
