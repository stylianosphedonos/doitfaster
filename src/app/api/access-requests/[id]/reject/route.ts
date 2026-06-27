import { NextResponse } from "next/server";
import { requireRequestReview } from "@/lib/api-auth";
import { rejectAccessRequest } from "@/lib/users-db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireRequestReview();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const rejected = await rejectAccessRequest(id, auth.id);

  if (!rejected) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
