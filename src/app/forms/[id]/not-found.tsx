import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-zinc-900">Form not found</h1>
          <p className="text-zinc-500 mt-2">
            This form may have been deleted or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
          >
            Back to forms
          </Link>
        </div>
      </main>
    </>
  );
}
