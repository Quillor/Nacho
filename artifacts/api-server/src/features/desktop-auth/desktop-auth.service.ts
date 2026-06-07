// Desktop browser-handoff auth.
//
// The desktop app can't run production Clerk from its localhost origin, so it
// signs in through the real browser on this (production) origin where Clerk
// works, and the browser hands a credential back via the `nacho://` deep link.
//
// Flow:
//   1. /desktop/login (browser, Clerk session) → POST /api/desktop/authorize
//      mints a short one-time CODE bound to {userId, PKCE code_challenge}.
//   2. Desktop receives the code via nacho:// → POST /api/desktop/token with the
//      code + PKCE code_verifier → we issue an access + refresh token.
//   3. Desktop calls /api with `Authorization: Bearer <access>`; authUserId()
//      verifies it. Refresh via POST /api/desktop/token/refresh.
//
// Tokens are stateless HMAC-signed (no DB). The one-time code is held briefly in
// memory (consumed within seconds). PKCE (S256) makes an intercepted code
// useless without the verifier that never leaves the app.
import crypto from "node:crypto";

const SECRET =
  process.env.DESKTOP_AUTH_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  "insecure-dev-secret-change-me";

const ACCESS_TTL_SEC = 60 * 60; // 1 hour
const REFRESH_TTL_SEC = 60 * 60 * 24 * 60; // 60 days
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

type TokenType = "access" | "refresh";
interface TokenPayload {
  sub: string;
  typ: TokenType;
  iat: number;
  exp: number;
}

function issue(userId: string, typ: TokenType, ttlSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: userId,
    typ,
    iat: now,
    exp: now + ttlSec,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function verify(token: string, typ: TokenType): string | null {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64").toString("utf8"),
    ) as TokenPayload;
    if (payload.typ !== typ) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function issueTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  return {
    accessToken: issue(userId, "access", ACCESS_TTL_SEC),
    refreshToken: issue(userId, "refresh", REFRESH_TTL_SEC),
    expiresIn: ACCESS_TTL_SEC,
  };
}

export function accessTokenFromRefresh(
  refreshToken: string,
): { accessToken: string; expiresIn: number } | null {
  const userId = verify(refreshToken, "refresh");
  if (!userId) return null;
  return { accessToken: issue(userId, "access", ACCESS_TTL_SEC), expiresIn: ACCESS_TTL_SEC };
}

/** Verify a desktop ACCESS token (used by authUserId). Returns the Clerk user id. */
export function userIdFromAccessToken(token: string): string | null {
  return verify(token, "access");
}

// ---- One-time authorization codes (PKCE) -------------------------------------

interface CodeEntry {
  userId: string;
  codeChallenge: string;
  exp: number;
}
const codes = new Map<string, CodeEntry>();

function sweep() {
  const now = Date.now();
  for (const [code, entry] of codes) {
    if (entry.exp < now) codes.delete(code);
  }
}

export function createAuthCode(userId: string, codeChallenge: string): string {
  sweep();
  const code = b64url(crypto.randomBytes(32));
  codes.set(code, { userId, codeChallenge, exp: Date.now() + CODE_TTL_MS });
  return code;
}

/** Consume a code, verifying the PKCE (S256) verifier. Returns the user id. */
export function consumeAuthCode(
  code: string,
  codeVerifier: string,
): string | null {
  sweep();
  const entry = codes.get(code);
  if (!entry) return null;
  codes.delete(code);
  if (entry.exp < Date.now()) return null;
  const challenge = b64url(
    crypto.createHash("sha256").update(codeVerifier).digest(),
  );
  if (
    challenge.length !== entry.codeChallenge.length ||
    !crypto.timingSafeEqual(
      Buffer.from(challenge),
      Buffer.from(entry.codeChallenge),
    )
  ) {
    return null;
  }
  return entry.userId;
}
