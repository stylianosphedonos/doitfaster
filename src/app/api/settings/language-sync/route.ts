import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { resolveLocale } from "@/lib/i18n";
import { syncLanguageContent } from "@/lib/language-sync";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth instanceof NextResponse) return auth;

  let preferredFromLocale: string | undefined;
  try {
    const body = (await request.json()) as { fromLocale?: string };
    preferredFromLocale = body.fromLocale;
  } catch {
    // body optional
  }

  try {
    const result = await syncLanguageContent(
      preferredFromLocale ? resolveLocale(preferredFromLocale) : undefined
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Language sync failed:", error);
    return NextResponse.json(
      { error: "Language sync failed" },
      { status: 500 }
    );
  }
}
