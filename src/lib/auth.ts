import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "parivahan_super_secret_jwt_key_change_in_production"
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("admin_token")?.value ?? null;
  if (!token) throw new Error("Unauthorized: no token");
  return verifyToken(token);
}

// Portal-user auth — reads the `user_token` cookie (set by /api/auth/user-login)
// or a Bearer header. Throws unless a valid token with role "user" is present.
export async function requireUserAuth(req: NextRequest): Promise<JWTPayload> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("user_token")?.value ?? null;
  if (!token) throw new Error("Unauthorized: no token");
  const payload = await verifyToken(token);
  if (payload.role !== "user") throw new Error("Unauthorized: not a portal user");
  return payload;
}

// /doni control-panel auth — fully separate from admin_token / user_token.
// Reads the `doni_token` cookie set by /api/doni/login.
export async function requireDoniAuth(req: NextRequest): Promise<JWTPayload> {
  const token = req.cookies.get("doni_token")?.value ?? null;
  if (!token) throw new Error("Unauthorized: no token");
  const payload = await verifyToken(token);
  if (payload.role !== "doni") throw new Error("Unauthorized: not a doni-panel session");
  return payload;
}
