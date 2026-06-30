import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { updateVehicle, moveOutVehicle, insertHistory } from "@/lib/supabase/server";

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

  if ("fire_ext_expiry" in row && !row.fire_ext_expiry) {
    throw new Error("Fire extinguisher expiry date is required");
  }
}

function isValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("must be") || error.message.includes("is required"))
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { historyRow, ...updateData } = body;
    validateVehicleNumbers(updateData);
    validateVehicleNumbers(historyRow);

    if (historyRow) {
      await insertHistory({
        ...historyRow,
        created_at: new Date().toISOString(),
      });
    }

    const data = await updateVehicle(id, updateData);
    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Update vehicle failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: isValidationError(err) ? 400 : 500 },
    );
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

  const { id } = await params;

  try {
    const body = await request.json();
    const { historyRow } = body;

    if (historyRow) {
      await insertHistory({
        ...historyRow,
        check_out: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    const vehicle = await moveOutVehicle(id);
    return NextResponse.json({ success: true, vehicle });
  } catch (err) {
    console.error("Drive out failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Drive out failed" }, { status: 500 });
  }
}
