import { NextResponse } from "next/server";
import { createSessionToken, getSession, setSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getUserByUsername } from "@/lib/users-db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: session });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!body.username?.trim() || !body.password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await getUserByUsername(body.username.trim());
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.disabled) {
    return NextResponse.json(
      { error: "This account has been disabled" },
      { status: 403 }
    );
  }

  const sessionUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  return NextResponse.json({ user: sessionUser });
}
