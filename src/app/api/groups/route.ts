import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { createGroup, getAllGroups } from "@/lib/groups-db";
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
