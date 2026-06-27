import { NextResponse } from "next/server";
import { requireRequestReview } from "@/lib/api-auth";
import { getAllAccessRequests } from "@/lib/users-db";

export async function GET() {
  const auth = await requireRequestReview();
  if (auth instanceof NextResponse) return auth;

  const requests = await getAllAccessRequests();
  const safe = requests.map(({ passwordHash: _, ...request }) => request);
  return NextResponse.json(safe);
}
