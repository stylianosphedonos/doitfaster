import { NextResponse } from "next/server";
import { generateTestFromSelection } from "@/lib/physics-books";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      classId?: string;
      bookId?: string;
      pages?: number[];
    };

    if (!body.classId || !body.bookId || !Array.isArray(body.pages)) {
      return NextResponse.json(
        { error: "classId, bookId and pages are required" },
        { status: 400 }
      );
    }

    const test = await generateTestFromSelection({
      classId: body.classId,
      bookId: body.bookId,
      pages: body.pages,
    });
    return NextResponse.json({ test });
  } catch (error) {
    console.error("Physics test generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create test suggestion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
