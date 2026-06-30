import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = await cookies();
  jar.delete("session");
  return NextResponse.json({ success: true });
}
export async function GET() {
  const jar = await cookies();
  jar.delete("session");
  return NextResponse.json({ success: true });
}
