import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import {
  absoluteBookPath,
  resolvePhysicsBook,
} from "@/lib/physics-books";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId") ?? "";
    const bookId = searchParams.get("bookId") ?? "";
    if (!classId || !bookId) {
      return NextResponse.json(
        { error: "classId and bookId are required" },
        { status: 400 }
      );
    }

    const book = await resolvePhysicsBook(classId, bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const filePath = absoluteBookPath(book);
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(book.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Physics file serve failed:", error);
    return NextResponse.json({ error: "Failed to open PDF" }, { status: 500 });
  }
}
