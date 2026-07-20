import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  updateVehicle,
  moveOutVehicle,
  insertHistory,
  requireVerified,
  assertVehicleFacilityAccess,
  resolveVehicleFacilityCode,
} from "@/lib/supabase/server";
import {
  isVehicleValidationError,
  pickVehicleUpdateData,
  validateVehicleNumbers,
} from "@/lib/vehicles/rules";

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
        : isVehicleValidationError(err)
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
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
