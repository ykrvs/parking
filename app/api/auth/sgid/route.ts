import SgidClient, { generatePkcePair } from "@opengovsg/sgid-client";
import { NextResponse } from "next/server";

import { getBaseUrl } from "@/lib/get-base-url";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be configured.`);
  }

  return value;
}

function normalizePrivateKey(privateKey: string) {
  return privateKey
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
    .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----")
    .replace(/\n+/g, "\n")
    .trim();
}

export function createSgidClient() {
  return new SgidClient({
    clientId: requiredEnv("SGID_CLIENT_ID"),
    clientSecret: requiredEnv("SGID_CLIENT_SECRET"),
    privateKey: normalizePrivateKey(requiredEnv("SGID_PRIVATE_KEY")),
    redirectUri: `${getBaseUrl()}/api/auth/sgid/callback`,
  });
}

export async function GET() {
  const sgid = createSgidClient();
  const { codeChallenge, codeVerifier } = generatePkcePair();

  const { url, nonce } = sgid.authorizationUrl({
    scope: ["openid", "myinfo.name"],
    codeChallenge,
  });

  const response = NextResponse.redirect(url);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };

  response.cookies.set("sgid_code_verifier", codeVerifier, cookieOptions);

  if (nonce) {
    response.cookies.set("sgid_nonce", nonce, cookieOptions);
  }

  return response;
}
