import { NextResponse } from "next/server";
import { requireUserManagement } from "@/lib/api-auth";
import type { UserRole } from "@/lib/auth-types";
import { deleteUser, getUserById, updateUser } from "@/lib/users-db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as { role?: UserRole };

  if (!body.role || !["admin", "superuser", "user"].includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (id === auth.id && body.role !== auth.role) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const user = await updateUser(id, { role: body.role });
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
