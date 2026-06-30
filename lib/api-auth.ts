import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { verifySession, type SessionPayload } from "@/lib/auth/session";

export async function getRequestSession(request: NextRequest) {
  const apiSecret = process.env.API_SECRET;
  const providedSecret =
    request.headers.get("x-api-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (apiSecret && providedSecret === apiSecret) {
    return {
      openid: "api-secret",
      name: "API Secret",
    } satisfies SessionPayload;
  }

  const jar = await cookies();
  const sessionToken = jar.get("session")?.value;

  return sessionToken ? verifySession(sessionToken) : null;
}
