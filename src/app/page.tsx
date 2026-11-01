import { AppHeader } from "@/components/AppHeader";
import { GroupCard } from "@/components/GroupCard";
import { HomeEmptyState } from "@/components/HomeEmptyState";
import { MainBanner } from "@/components/MainBanner";
import { getAllForms } from "@/lib/db";
import { getAllGroups } from "@/lib/groups-db";
import { getBranding } from "@/lib/settings-db";

export default async function HomePage() {
  const [allGroups, forms, branding] = await Promise.all([
    getAllGroups(),
    getAllForms(),
    getBranding(),
  ]);

  // Filter to only visible groups (already sorted by order from getAllGroups)
  const groups = allGroups.filter((g) => g.visible);

  const formCountByGroup = forms.reduce<Record<string, number>>((acc, form) => {
    acc[form.groupId] = (acc[form.groupId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <AppHeader />
      <MainBanner branding={branding} />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              {branding.pageTitle}
            </h1>
            <p className="mt-3 text-lg text-zinc-500 max-w-2xl">
              {branding.pageSubtitle}
            </p>
          </div>

          {groups.length === 0 ? (
            <HomeEmptyState />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
