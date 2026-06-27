import { NextResponse } from "next/server";
import { requireUserManagement } from "@/lib/api-auth";
import type { UserRole } from "@/lib/auth-types";
import { hashPassword } from "@/lib/password";
import {
  createUser,
  getAllUsers,
  usernameExists,
} from "@/lib/users-db";

export async function GET() {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const users = await getAllUsers();
  const safe = users.map(({ passwordHash: _, ...user }) => user);
  return NextResponse.json(safe);
}

export async function POST(request: Request) {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: UserRole;
  };

  if (!body.username?.trim() || !body.password || !body.email?.trim()) {
    return NextResponse.json(
      { error: "Username, password, and email are required" },
      { status: 400 }
    );
  }

  if (body.password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const role = body.role ?? "user";
  if (!["admin", "superuser", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (await usernameExists(body.username.trim())) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  const user = await createUser({
    username: body.username.trim(),
    email: body.email.trim(),
    passwordHash,
    phone: body.phone?.trim() || undefined,
    address: body.address?.trim() || undefined,
    role,
    disabled: false,
  });

  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe, { status: 201 });
}
