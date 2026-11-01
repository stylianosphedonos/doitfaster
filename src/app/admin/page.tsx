import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AdminPanel } from "@/components/AdminPanel";
import { getSession } from "@/lib/auth";
import { canAccessAdmin, ROLE_LABELS } from "@/lib/auth-types";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !canAccessAdmin(session.role)) {
    redirect("/login?redirect=/admin");
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to main page
          </Link>

          {/* Page Header */}
          <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-zinc-100">
                  <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
              </div>
              <p className="text-zinc-500">
                Configure groups, forms, and settings for your application.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-sm">
              <span className="text-zinc-500">Signed in as</span>
              <span className="font-semibold text-zinc-700">{session.username}</span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500">{ROLE_LABELS[session.role]}</span>
            </div>
          </div>

          <AdminPanel userRole={session.role} userId={session.id} />
        </div>
      </main>
    </>
  );
}
