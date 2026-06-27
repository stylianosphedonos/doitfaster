"use client";

import { useLocale } from "./LocaleProvider";

export function HomeEmptyState() {
  const { t } = useLocale();

  return (
    <div className="text-center py-20 border border-dashed border-zinc-200 rounded-2xl">
      <p className="text-zinc-400 text-lg">{t.home.noGroups}</p>
      <p className="text-zinc-400 text-sm mt-1">{t.home.noGroupsHint}</p>
    </div>
  );
}
