import { NextResponse } from "next/server";

const disabledResponse = () =>
  NextResponse.json(
    { error: "Turret ESC checklist is not enabled." },
    { status: 404 },
  );

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}
