import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { unassignFormsFromGroup } from "@/lib/db";
import { deleteGroup, getGroupById, updateGroup } from "@/lib/groups-db";
import type { FormGroup } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const group = await getGroupById(id);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as Partial<
    Omit<FormGroup, "id" | "createdAt">
  >;

  const group = await updateGroup(id, body);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const deleted = await deleteGroup(id);

  if (!deleted) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await unassignFormsFromGroup(id);
  return NextResponse.json({ success: true });
}
