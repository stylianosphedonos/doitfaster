import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LoginPageContent } from "@/components/LoginPageContent";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-20 bg-zinc-50/50">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl p-6 sm:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Welcome Back</h1>
              <p className="mt-2 text-zinc-500 text-sm">
                Sign in to your account or request access to get started.
              </p>
            </div>
            <LoginPageContent />
          </div>
        </div>
      </main>
    </>
  );
}
