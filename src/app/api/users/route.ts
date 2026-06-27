import { NextResponse } from "next/server";
import { requireUserManagement } from "@/lib/api-auth";
import { getAllUsers } from "@/lib/users-db";

export async function GET() {
  const auth = await requireUserManagement();
  if (auth instanceof NextResponse) return auth;

  const users = await getAllUsers();
  const safe = users.map(({ passwordHash: _, ...user }) => user);
  return NextResponse.json(safe);
}
