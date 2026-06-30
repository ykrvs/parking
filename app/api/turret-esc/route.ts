import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import {
  getLatestTurretEscLog,
  getUserProfile,
  insertTurretEscLog,
} from "@/lib/supabase/server";

async function requireTechnician(openid: string) {
  const profile = await getUserProfile(openid);

  if (!profile?.is_technician) {
    return NextResponse.json(
      { error: "Only technicians can access the Turret ESC checklist" },
      { status: 403 },
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = await requireTechnician(session.openid);
  if (forbidden) return forbidden;

  const { searchParams } = request.nextUrl;
  const vehicleId = searchParams.get("vehicle_id");

  if (!vehicleId) {
    return NextResponse.json({ error: "Missing vehicle_id" }, { status: 400 });
  }

  try {
    const data = await getLatestTurretEscLog(vehicleId);
    return NextResponse.json({ latestEsc: data });
  } catch (err) {
    console.error("Failed to load turret checklist log:", err);
    return NextResponse.json({ error: "Failed to load turret checklist log" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = await requireTechnician(session.openid);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    if (!body.vehicle_id || !body.plate) {
      return NextResponse.json({ error: "vehicle_id and plate are required" }, { status: 400 });
    }

    const data = await insertTurretEscLog({
      vehicle_id: body.vehicle_id,
      plate: body.plate,
      user_name: session.name || "Unknown",
      ics: body.ics === true,
      gsu: body.gsu === true,
      wim: body.wim === true,
      trav_actuator: body.trav_actuator === true,
      elev_actuator: body.elev_actuator === true,
      gcu: body.gcu === true,
      mdcu: body.mdcu === true,
      psu: body.psu === true,
      gun_gyro: body.gun_gyro === true,
      conv_ass: body.conv_ass === true,
      boost_box_ass: body.boost_box_ass === true,
      slip_ring: body.slip_ring === true,
      turr_estop: body.turr_estop === true,
      upplink_echute: body.upplink_echute === true,
      upplink_splate: body.upplink_splate === true,
      lowlink_splate: body.lowlink_splate === true,
      lowlink_echute: body.lowlink_echute === true,
      uppflex_chute: body.uppflex_chute === true,
      lowflex_chute: body.lowflex_chute === true,
      lws_comp: body.lws_comp === true,
      scu: body.scu !== null && body.scu !== undefined ? parseInt(body.scu, 10) : null,
      dcu: body.dcu !== null && body.dcu !== undefined ? parseInt(body.dcu, 10) : null,
      fault_list: body.fault_list || null,
      notes: body.notes || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, log: data });
  } catch (err) {
    console.error("Failed to save turret checklist:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save checklist" }, { status: 500 });
  }
}
