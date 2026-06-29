import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { signSession } from "@/lib/auth/session";
import { getBaseUrl } from "@/lib/get-base-url";
import { upsertSgidUser } from "@/lib/supabase/server";
import { createSgidClient } from "../route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const base = getBaseUrl() || "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/callback?error=no_code", base));
  }

  const jar = await cookies();
  const codeVerifier = jar.get("sgid_code_verifier")?.value;
  const nonce = jar.get("sgid_nonce")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/auth/callback?error=invalid_session", base),
    );
  }

  try {
    const sgid = createSgidClient();
    const { accessToken, sub } = await sgid.callback({
      code,
      codeVerifier,
      nonce,
    });
    const { data } = await sgid.userinfo({ accessToken, sub });
    const rawName = data["myinfo.name"];
    const name = typeof rawName === "string" ? rawName : "";

    if (name) {
      try {
        await upsertSgidUser({
          openid: sub,
          name,
        });
      } catch (err) {
        console.error("[Supabase] sgID user upsert failed:", err);
        return NextResponse.redirect(
          new URL("/auth/callback?error=user_save_failed", base),
        );
      }
    }

    const response = name
      ? NextResponse.redirect(
          new URL(
            `/auth/callback?name=${encodeURIComponent(name)}&openid=${encodeURIComponent(sub)}`,
            base,
          ),
        )
      : NextResponse.redirect(new URL("/auth/callback?error=no_name", base));

    if (name) {
      const sessionToken = signSession({ openid: sub, name });
      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    response.cookies.delete("sgid_code_verifier");
    response.cookies.delete("sgid_nonce");

    return response;
  } catch (err) {
    console.error("[sgID] callback error:", err);
    return NextResponse.redirect(new URL("/auth/callback?error=failed", base));
  }
}
