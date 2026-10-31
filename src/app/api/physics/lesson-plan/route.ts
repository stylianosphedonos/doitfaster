import { NextResponse } from "next/server";
import { generateLessonPlanFromSelection } from "@/lib/physics-books";

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

    const lessonPlan = await generateLessonPlanFromSelection({
      classId: body.classId,
      bookId: body.bookId,
      pages: body.pages,
    });
    return NextResponse.json({ lessonPlan });
  } catch (error) {
    console.error("Physics lesson plan failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create lesson plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
