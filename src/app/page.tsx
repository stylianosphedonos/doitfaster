import { AppHeader } from "@/components/AppHeader";
import { GroupCard } from "@/components/GroupCard";
import { HomeEmptyState } from "@/components/HomeEmptyState";
import { MainBanner } from "@/components/MainBanner";
import { getAllForms } from "@/lib/db";
import { getAllGroups } from "@/lib/groups-db";
import { getBranding } from "@/lib/settings-db";

export default async function HomePage() {
  const [groups, forms, branding] = await Promise.all([
    getAllGroups(),
    getAllForms(),
    getBranding(),
  ]);

  const formCountByGroup = forms.reduce<Record<string, number>>((acc, form) => {
    acc[form.groupId] = (acc[form.groupId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <AppHeader />
      <MainBanner branding={branding} />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">{branding.pageTitle}</h1>
            <p className="mt-2 text-zinc-500">{branding.pageSubtitle}</p>
          </div>

          {groups.length === 0 ? (
            <HomeEmptyState />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  formCount={formCountByGroup[group.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
