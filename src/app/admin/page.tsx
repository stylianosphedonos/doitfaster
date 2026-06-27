import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AdminPanel } from "@/components/AdminPanel";
import { getSession } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-types";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !canAccessAdmin(session.role)) {
    redirect("/login?redirect=/admin");
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Admin</h1>
            <p className="mt-2 text-zinc-500">
              Configure groups and forms that appear on the main page.
            </p>
          </div>
          <AdminPanel userRole={session.role} userId={session.id} />
        </div>
      </main>
    </>
  );
}
