import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { deleteForm, getFormById, updateForm } from "@/lib/db";
import type { FormComponent } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const form = await getFormById(id);

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json(form);
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as Partial<
    Omit<FormComponent, "id" | "createdAt">
  >;

  const form = await updateForm(id, body);

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json(form);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const deleted = await deleteForm(id);

  if (!deleted) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
