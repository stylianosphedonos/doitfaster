import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getFormById } from "@/lib/db";
import {
  deleteFormSaveForUser,
  getFormSaveForUser,
  upsertFormSaveForUser,
} from "@/lib/form-saves-db";
import type { FormValues } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { id: formId } = await context.params;
  const form = await getFormById(formId);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const save = await getFormSaveForUser(auth.id, formId);
  return NextResponse.json(save);
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { id: formId } = await context.params;
  const form = await getFormById(formId);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const body = (await request.json()) as { values?: FormValues };
  if (!body.values || typeof body.values !== "object") {
    return NextResponse.json({ error: "Values are required" }, { status: 400 });
  }

  const save = await upsertFormSaveForUser(auth.id, formId, body.values);
  return NextResponse.json(save);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { id: formId } = await context.params;
  const deleted = await deleteFormSaveForUser(auth.id, formId);
  if (!deleted) {
    return NextResponse.json({ error: "Saved template not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
