import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { createForm, getAllForms } from "@/lib/db";
import type { FormComponent } from "@/lib/types";

export async function GET() {
  const forms = await getAllForms();
  return NextResponse.json(forms);
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Omit<
    FormComponent,
    "id" | "createdAt" | "updatedAt"
  >;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body.groupId?.trim()) {
    return NextResponse.json({ error: "Group is required" }, { status: 400 });
  }

  const form = await createForm({
    groupId: body.groupId.trim(),
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    icon: body.icon ?? "📋",
    color: body.color ?? "slate",
    fields: body.fields ?? [],
  });

  return NextResponse.json(form, { status: 201 });
}
