import { NextResponse } from "next/server";
import { searchPhysicsBooks } from "@/lib/physics-books";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string; limit?: number };
    const query = body.query?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const result = await searchPhysicsBooks(query, body.limit ?? 40, "maths");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Maths search failed:", error);
    return NextResponse.json(
      { error: "Maths search failed" },
      { status: 500 }
    );
  }
}
