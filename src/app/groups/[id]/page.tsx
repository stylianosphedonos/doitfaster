import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FormCard } from "@/components/FormCard";
import { getFormsByGroupId } from "@/lib/db";
import { getGroupById } from "@/lib/groups-db";

type PageProps = { params: Promise<{ id: string }> };

export default async function GroupPage({ params }: PageProps) {
  const { id } = await params;
  const [group, forms] = await Promise.all([
    getGroupById(id),
    getFormsByGroupId(id),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
          >
            ← Back to groups
          </Link>

          <div className="mb-8 flex items-start gap-4">
            <span className="text-4xl">{group.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{group.title}</h1>
              {group.description && (
                <p className="mt-2 text-zinc-500">{group.description}</p>
              )}
            </div>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl">
              <p className="text-zinc-400">No forms in this group yet.</p>
              <p className="text-sm text-zinc-400 mt-1">
                Add forms to this group in Admin.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {forms.map((form) => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
