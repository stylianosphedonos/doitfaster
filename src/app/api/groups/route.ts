import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { createGroup, getAllGroups, reorderGroups } from "@/lib/groups-db";
import type { FormGroup } from "@/lib/types";

export async function GET() {
  const groups = await getAllGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Omit<
    FormGroup,
    "id" | "createdAt" | "updatedAt"
  >;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const group = await createGroup({
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    icon: body.icon ?? "📁",
    color: body.color ?? "slate",
  });

  return NextResponse.json(group, { status: 201 });
}

// Bulk reorder groups
export async function PUT(request: Request) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { orderedIds: string[] };

  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json(
      { error: "orderedIds must be an array" },
      { status: 400 }
    );
  }

  const groups = await reorderGroups(body.orderedIds);
  return NextResponse.json(groups);
}
