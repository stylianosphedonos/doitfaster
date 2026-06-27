import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FormCard } from "@/components/FormCard";
import { GroupEmptyState, GroupPageHeader } from "@/components/GroupPageHeader";
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
          <GroupPageHeader group={group} />

          {forms.length === 0 ? (
            <GroupEmptyState />
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
