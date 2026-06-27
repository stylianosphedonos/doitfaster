import { NextResponse } from "next/server";
import {
  assignableRoles,
  requireRequestReview,
} from "@/lib/api-auth";
import type { UserRole } from "@/lib/auth-types";
import { approveAccessRequest } from "@/lib/users-db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRequestReview();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as { role?: UserRole };

  if (!body.role) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }

  const allowed = assignableRoles(auth.role);
  if (!allowed.includes(body.role)) {
    return NextResponse.json({ error: "Cannot assign this role" }, { status: 403 });
  }

  const result = await approveAccessRequest(id, auth.id, body.role);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { passwordHash: _, ...safe } = result.user;
  return NextResponse.json({ user: safe });
}
