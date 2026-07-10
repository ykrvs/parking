import crypto from "crypto";

export type SessionPayload = {
  openid: string;
  name: string;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SGID_CLIENT_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SESSION_SECRET or SGID_CLIENT_SECRET must be configured for session signing.",
    );
  }

  return secret;
}

export function signSession(payload: SessionPayload): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = JSON.stringify({ ...payload, exp });
  const dataB64 = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(dataB64)
    .digest("base64url");
  return `${dataB64}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataB64, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(dataB64)
      .digest("base64url");

    const signatureBuffer = Buffer.from(signature, "base64url");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      return null;
    }

    const dataStr = Buffer.from(dataB64, "base64url").toString("utf8");
    const data = JSON.parse(dataStr) as SessionPayload & { exp: number };

    if (Date.now() > data.exp) return null;

    return { openid: data.openid, name: data.name };
  } catch {
    return null;
  }
}
