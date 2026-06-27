import { NextResponse } from "next/server";
import {
  canAccessAdmin,
  canManageUsers,
  canReviewAccessRequests,
  type SessionUser,
  type UserRole,
} from "@/lib/auth-types";
import { getSession } from "@/lib/auth";

export async function requireSession(): Promise<
  SessionUser | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireAdminAccess(): Promise<
  SessionUser | NextResponse
> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  if (!canAccessAdmin(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export async function requireUserManagement(): Promise<
  SessionUser | NextResponse
> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  if (!canManageUsers(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export async function requireRequestReview(): Promise<
  SessionUser | NextResponse
> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  if (!canReviewAccessRequests(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export function assignableRoles(reviewerRole: UserRole): UserRole[] {
  if (reviewerRole === "admin") {
    return ["admin", "superuser", "user"];
  }
  if (reviewerRole === "superuser") {
    return ["superuser", "user"];
  }
  return [];
}
