import { NextResponse } from "next/server";
import {
  generateLessonPlanFromSelection,
  type LessonPlanUserWording,
} from "@/lib/physics-books";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      classId?: string;
      bookId?: string;
      pages?: number[];
      activityPages?: number[];
      teacherName?: string;
      date?: string;
      lessonNumber?: string;
      durationMinutes?: number;
      objectiveCount?: number;
      wording?: LessonPlanUserWording;
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
      activityPages: Array.isArray(body.activityPages)
        ? body.activityPages
        : [],
      teacherName: body.teacherName,
      date: body.date,
      lessonNumber: body.lessonNumber,
      durationMinutes: body.durationMinutes,
      objectiveCount: body.objectiveCount,
      wording: body.wording,
    });
    return NextResponse.json({ lessonPlan });
  } catch (error) {
    console.error("Physics lesson plan failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create lesson plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
