"use client";

import Link from "next/link";
import { translateGroup } from "@/lib/i18n";
import type { FormGroup } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

interface GroupPageHeaderProps {
  group: FormGroup;
}

export function GroupPageHeader({ group }: GroupPageHeaderProps) {
  const { locale, t } = useLocale();
  const translated = translateGroup(group, locale);

  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
      >
        {t.group.backToGroups}
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <span className="text-4xl">{group.icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">{translated.title}</h1>
          {translated.description && (
            <p className="mt-2 text-zinc-500">{translated.description}</p>
          )}
        </div>
      </div>
    </>
  );
}

export function GroupEmptyState() {
  const { t } = useLocale();

  return (
    <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl">
      <p className="text-zinc-400">{t.group.noForms}</p>
      <p className="text-sm text-zinc-400 mt-1">{t.group.noFormsHint}</p>
    </div>
  );
}
