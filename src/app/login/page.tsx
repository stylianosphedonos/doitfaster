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
      <main className="flex-1 flex items-center justify-center px-4 py-16 text-zinc-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">Welcome</h1>
            <p className="mt-2 text-zinc-600">
              Sign in or request access to preview and export forms.
            </p>
          </div>
          <LoginPageContent />
        </div>
      </main>
    </>
  );
}
