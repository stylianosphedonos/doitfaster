import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { getSettings, updateBranding } from "@/lib/settings-db";
import type { BrandingUpdate } from "@/lib/settings-db";

export async function GET() {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as BrandingUpdate;

  const branding = await updateBranding(body);
  return NextResponse.json({ branding });
}
