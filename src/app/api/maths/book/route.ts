import { NextResponse } from "next/server";
import { ensureBookPageCount } from "@/lib/physics-books";

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

    const { pageCount, book } = await ensureBookPageCount(classId, bookId, "maths");
    return NextResponse.json({
      classId: book.classId,
      className: book.className,
      bookId: book.bookId,
      bookName: book.bookName,
      fileName: book.fileName,
      kind: book.kind,
      pageCount,
    });
  } catch (error) {
    console.error("Maths book meta failed:", error);
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
}
