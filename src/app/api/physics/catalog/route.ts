import { NextResponse } from "next/server";
import { getPhysicsCatalog } from "@/lib/physics-books";

export const runtime = "nodejs";

export async function GET() {
  try {
    const classes = await getPhysicsCatalog();
    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Physics catalog failed:", error);
    return NextResponse.json(
      { error: "Failed to load Physics books catalog" },
      { status: 500 }
    );
  }
}
