import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser, UserRole } from "./auth-types";

const COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = payload.sub;
    const username = payload.username;
    const email = payload.email;
    const role = payload.role;

    if (
      typeof id !== "string" ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      (role !== "admin" && role !== "superuser" && role !== "user")
    ) {
      return null;
    }

    return { id, username, email, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, SESSION_MAX_AGE };
