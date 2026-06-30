import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { updateVehicle, deleteVehicle, insertHistory } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 500 });
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

    await deleteVehicle(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Drive out failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Drive out failed" }, { status: 500 });
  }
}
