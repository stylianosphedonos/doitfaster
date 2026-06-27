import { NextResponse } from "next/server";
import { requireUserManagement } from "@/lib/api-auth";
import type { UserRole } from "@/lib/auth-types";
import { hashPassword } from "@/lib/password";
import {
  deleteUser,
  getUserById,
  updateUser,
  usernameExists,
} from "@/lib/users-db";

type RouteContext = { params: Promise<{ id: string }> };

interface UserUpdateBody {
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  password?: string;
  disabled?: boolean;
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as UserUpdateBody;

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: Parameters<typeof updateUser>[1] = {};

  if (body.username !== undefined) {
    const username = body.username.trim();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (await usernameExists(username, id)) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
    updates.username = username;
  }

  if (body.email !== undefined) {
    const email = body.email.trim();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    updates.email = email;
  }

  if (body.phone !== undefined) {
    updates.phone = body.phone.trim() || undefined;
  }

  if (body.address !== undefined) {
    updates.address = body.address.trim() || undefined;
  }

  if (body.role !== undefined) {
    if (!["admin", "superuser", "user"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (id === auth.id && body.role !== auth.role) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }
    updates.role = body.role;
  }

  if (body.password !== undefined && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    updates.passwordHash = await hashPassword(body.password);
  }

  if (body.disabled !== undefined) {
    if (id === auth.id && body.disabled) {
      return NextResponse.json(
        { error: "Cannot disable your own account" },
        { status: 400 }
      );
    }
    updates.disabled = body.disabled;
  }

  const user = await updateUser(id, updates);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  if (id === auth.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await deleteUser(id);
  return NextResponse.json({ success: true });
}
